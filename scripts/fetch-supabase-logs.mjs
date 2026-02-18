import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SERVICE_TABLE_CANDIDATES = {
  api: ['postgrest_logs', 'api_logs'],
  auth: ['auth_logs'],
  postgres: ['postgres_logs'],
  storage: ['storage_logs'],
  realtime: ['realtime_logs'],
  'edge-function': ['edge_logs', 'function_edge_logs'],
};

const ALL_SERVICES = ['api', 'auth', 'postgres', 'storage', 'realtime', 'edge-function'];

function parseArgs(argv) {
  const args = {
    kind: 'signup',
    service: null,
    days: 30,
    since: null,
    hours: 6,
    limit: 200,
    out: null,
    format: 'json',
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--kind') args.kind = argv[++i];
    else if (token === '--service') args.service = argv[++i];
    else if (token === '--days') args.days = Number(argv[++i]);
    else if (token === '--since') args.since = argv[++i];
    else if (token === '--hours') args.hours = Number(argv[++i]);
    else if (token === '--limit') args.limit = Number(argv[++i]);
    else if (token === '--out') args.out = argv[++i];
    else if (token === '--format') args.format = argv[++i];
    else if (token === '--help' || token === '-h') args.help = true;
    else throw new Error(`Unknown arg: ${token}`);
  }

  return args;
}

function usage() {
  return [
    'Usage:',
    '  node scripts/fetch-supabase-logs.mjs [--kind signup] [--days N|--since YYYY-MM-DD] [--limit N] [--out PATH]',
    '  node scripts/fetch-supabase-logs.mjs --kind api|auth|postgres|storage|realtime|edge-function|all [--hours N] [--limit N] [--out PATH]',
    '',
    'Env vars:',
    '  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for signup mode',
    '  SUPABASE_ACCESS_TOKEN (or SUPABASE_MANAGEMENT_API_TOKEN) for service/all modes (Supabase Management API)',
  ].join('\n');
}

function parseDotEnvFile(contents) {
  const env = {};
  for (const rawLine of contents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function loadEnvFromRepoRoot() {
  const repoRoot = process.cwd();
  const candidates = ['.env.local', '.env'];
  for (const filename of candidates) {
    const filePath = path.join(repoRoot, filename);
    if (!fs.existsSync(filePath)) continue;
    const env = parseDotEnvFile(fs.readFileSync(filePath, 'utf8'));
    for (const [k, v] of Object.entries(env)) {
      if (process.env[k] == null || process.env[k] === '') process.env[k] = v;
    }
  }
}

function normalizeLimit(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 100;
  return Math.max(1, Math.min(1000, Math.floor(n)));
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) out[k] = obj?.[k] ?? null;
  return out;
}

function computeSinceIso({ since, days }) {
  if (since) {
    const d = new Date(`${since}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new Error(`Invalid --since date: ${since}`);
    return d.toISOString();
  }
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function getProjectRefFromUrl(supabaseUrl) {
  let hostname;
  try {
    hostname = new URL(supabaseUrl).hostname;
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  }
  const first = hostname.split('.')[0];
  if (!first) throw new Error(`Could not derive project ref from NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);
  return first;
}

function sanitizeKind(kind) {
  const value = String(kind || '').trim().toLowerCase();
  if (!value) return 'signup';
  return value;
}

function resolveServices(kind, serviceFlag) {
  const fromFlag = serviceFlag ? String(serviceFlag).trim().toLowerCase() : null;
  const effective = fromFlag || kind;
  if (effective === 'all') return ALL_SERVICES;
  if (!Object.prototype.hasOwnProperty.call(SERVICE_TABLE_CANDIDATES, effective)) {
    throw new Error(
      `Unsupported service kind "${effective}". Supported: ${ALL_SERVICES.join(', ')}, all, signup`
    );
  }
  return [effective];
}

function buildLogSql(table, limit) {
  return [
    `select cast(${table}.timestamp as datetime) as timestamp,`,
    'event_message,',
    'metadata',
    `from ${table}`,
    'order by timestamp desc',
    `limit ${limit}`,
  ].join(' ');
}

async function fetchServiceLogs({ projectRef, accessToken, service, limit, hours }) {
  const candidates = SERVICE_TABLE_CANDIDATES[service] || [];
  const now = new Date();
  const boundedHours = Math.max(1, Math.min(24, Math.floor(hours)));
  const start = new Date(now.getTime() - boundedHours * 60 * 60 * 1000);
  const isoStart = start.toISOString();
  const isoEnd = now.toISOString();

  let lastError = null;
  for (const table of candidates) {
    const sql = buildLogSql(table, limit);
    const endpoint = new URL(`https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/logs.all`);
    endpoint.searchParams.set('sql', sql);
    endpoint.searchParams.set('iso_timestamp_start', isoStart);
    endpoint.searchParams.set('iso_timestamp_end', isoEnd);

    const res = await fetch(endpoint.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: accessToken,
      },
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.error) {
      lastError = body?.error || `HTTP ${res.status}`;
      continue;
    }

    return {
      service,
      source_table: table,
      window: { start: isoStart, end: isoEnd, hours: boundedHours },
      row_count: Array.isArray(body?.result) ? body.result.length : 0,
      rows: Array.isArray(body?.result) ? body.result : [],
      error: null,
    };
  }

  return {
    service,
    source_table: null,
    window: { start: isoStart, end: isoEnd, hours: Math.max(1, Math.min(24, Math.floor(hours))) },
    row_count: 0,
    rows: [],
    error:
      lastError ||
      `No log data returned for service "${service}". Set SUPABASE_ACCESS_TOKEN with analytics_logs_read permission.`,
  };
}

async function runSignupMode(args) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL (set it in .env.local)');
  if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (set it in .env.local)');

  const sinceIso = computeSinceIso(args);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const perPage = Math.min(1000, Math.max(1, args.limit));
  let page = 1;
  let fetched = 0;
  let done = false;
  const users = [];

  while (!done) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const batch = data?.users ?? [];
    if (batch.length === 0) break;

    for (const u of batch) {
      fetched++;
      const createdAt = u.created_at ? new Date(u.created_at) : null;
      if (createdAt && createdAt.toISOString() >= sinceIso) {
        users.push({
          id: u.id,
          email: u.email ?? null,
          phone: u.phone ?? null,
          created_at: u.created_at ?? null,
          last_sign_in_at: u.last_sign_in_at ?? null,
          email_confirmed_at: u.email_confirmed_at ?? null,
          phone_confirmed_at: u.phone_confirmed_at ?? null,
          identities: Array.isArray(u.identities)
            ? u.identities.map((i) => pick(i, ['provider', 'identity_id', 'created_at', 'last_sign_in_at']))
            : null,
          app_metadata: u.app_metadata ?? null,
          user_metadata: u.user_metadata ?? null,
        });
      }
    }

    if (users.length >= args.limit) done = true;
    page++;
    if (page > 1000) break;
  }

  users.sort((a, b) => {
    const at = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bt - at;
  });

  const sliced = users.slice(0, args.limit);
  return {
    mode: 'signup',
    project: 'pain-dairy',
    since: sinceIso,
    limit: args.limit,
    fetched_users_examined: fetched,
    signup_users_returned: sliced.length,
    signups: sliced,
  };
}

async function runServiceMode(args) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL (set it in .env.local)');

  const accessToken =
    process.env.SUPABASE_ACCESS_TOKEN ||
    process.env.SUPABASE_MANAGEMENT_API_TOKEN ||
    process.env.SUPABSE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      'Missing SUPABASE_ACCESS_TOKEN (or SUPABASE_MANAGEMENT_API_TOKEN) for service logs. For Codex sessions, you can alternatively use Supabase MCP get_logs.'
    );
  }

  const projectRef = getProjectRefFromUrl(supabaseUrl);
  const services = resolveServices(args.kind, args.service);
  const results = await Promise.all(
    services.map((service) =>
      fetchServiceLogs({
        projectRef,
        accessToken,
        service,
        limit: args.limit,
        hours: args.hours,
      })
    )
  );

  return {
    mode: services.length === 1 ? services[0] : 'all',
    fetched_at: new Date().toISOString(),
    project_ref: projectRef,
    services: results,
  };
}

function toOutputText(payload, format) {
  if (format === 'ndjson') {
    if (payload?.mode === 'signup') {
      return (payload.signups || []).map((row) => JSON.stringify(row)).join('\n') + '\n';
    }
    const rows = [];
    for (const servicePayload of payload?.services || []) {
      for (const row of servicePayload.rows || []) {
        rows.push(JSON.stringify({ service: servicePayload.service, ...row }));
      }
    }
    return rows.join('\n') + (rows.length ? '\n' : '');
  }
  return JSON.stringify(payload, null, 2) + '\n';
}

async function main() {
  const rawArgs = parseArgs(process.argv.slice(2));
  if (rawArgs.help) {
    console.log(usage());
    return;
  }

  loadEnvFromRepoRoot();

  const args = {
    ...rawArgs,
    kind: sanitizeKind(rawArgs.kind),
    limit: normalizeLimit(rawArgs.limit),
  };

  const payload = args.kind === 'signup' ? await runSignupMode(args) : await runServiceMode(args);
  const outText = toOutputText(payload, args.format);

  if (args.out) {
    fs.writeFileSync(args.out, outText, 'utf8');
    if (payload.mode === 'signup') {
      console.log(JSON.stringify({ wrote: args.out, mode: payload.mode, since: payload.since, count: payload.signup_users_returned }, null, 2));
    } else {
      console.log(
        JSON.stringify(
          {
            wrote: args.out,
            mode: payload.mode,
            fetched_at: payload.fetched_at,
            services: (payload.services || []).map((s) => ({
              service: s.service,
              row_count: s.row_count,
              error: s.error,
            })),
          },
          null,
          2
        )
      );
    }
    return;
  }

  process.stdout.write(outText);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exitCode = 1;
});
