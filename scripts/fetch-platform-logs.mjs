import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

function parseArgs(argv) {
  const args = {
    project: 'calm-pain-tracker',
    vercelSince: '30d',
    vercelLimit: 200,
    supabaseKind: 'all',
    supabaseHours: 6,
    supabaseLimit: 100,
    signupDays: 7,
    signupLimit: 100,
    out: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--project') args.project = argv[++i];
    else if (token === '--vercel-since') args.vercelSince = argv[++i];
    else if (token === '--vercel-limit') args.vercelLimit = Number(argv[++i]);
    else if (token === '--supabase-kind') args.supabaseKind = argv[++i];
    else if (token === '--supabase-hours') args.supabaseHours = Number(argv[++i]);
    else if (token === '--supabase-limit') args.supabaseLimit = Number(argv[++i]);
    else if (token === '--signup-days') args.signupDays = Number(argv[++i]);
    else if (token === '--signup-limit') args.signupLimit = Number(argv[++i]);
    else if (token === '--out') args.out = argv[++i];
    else if (token === '--help' || token === '-h') args.help = true;
    else throw new Error(`Unknown arg: ${token}`);
  }

  return args;
}

function usage() {
  return [
    'Usage:',
    '  node scripts/fetch-platform-logs.mjs [--project calm-pain-tracker] [--vercel-since 30d] [--vercel-limit 200] [--supabase-kind all] [--supabase-hours 6] [--supabase-limit 100] [--signup-days 7] [--signup-limit 100] [--out /tmp/file.json]',
    '',
    'Notes:',
    '  - Vercel logs are fetched via `vercel logs` CLI.',
    '  - Supabase signups/services are fetched via scripts/fetch-supabase-logs.mjs.',
    '  - Service logs require SUPABASE_ACCESS_TOKEN or SUPABASE_MANAGEMENT_API_TOKEN.',
  ].join('\n');
}

function normalizePositiveInt(value, fallback, max = 2000) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.max(1, Math.floor(n)));
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });
  });
}

function parseJsonLines(text) {
  const rows = [];
  for (const rawLine of String(text || '').split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('{')) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      // ignore malformed lines
    }
  }
  return rows;
}

function firstErrorLine(text, fallback) {
  const line = String(text || '')
    .split('\n')
    .map((v) => v.trim())
    .find((v) => v.length > 0);
  return line || fallback;
}

function safeIso(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;

  const ms = n > 10_000_000_000_000 ? Math.floor(n / 1000) : n;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function analyzeVercelRows(rows) {
  const sorted = [...rows].sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
  const totalRows = sorted.length;
  const apiRows = sorted.filter((r) => String(r.requestPath || '').startsWith('/api/'));

  const pathCounts = new Map();
  for (const row of sorted) {
    const pathName = String(row.requestPath || '');
    pathCounts.set(pathName, (pathCounts.get(pathName) || 0) + 1);
  }
  const topPaths = [...pathCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([requestPath, count]) => ({ requestPath, count }));

  return {
    latest_timestamp: safeIso(sorted[0]?.timestamp),
    total_rows: totalRows,
    api_rows: apiRows.length,
    top_paths: topPaths,
    latest_10: sorted.slice(0, 10).map((row) => ({
      timestamp: safeIso(row.timestamp),
      method: row.requestMethod || null,
      path: row.requestPath || null,
      status: row.responseStatusCode ?? null,
      source: row.source || null,
      environment: row.environment || null,
      domain: row.domain || null,
    })),
  };
}

function analyzeSupabaseServicePayload(payload) {
  const services = Array.isArray(payload?.services) ? payload.services : [];
  const summary = services.map((serviceEntry) => ({
    service: serviceEntry?.service || null,
    row_count: Number(serviceEntry?.row_count || 0),
    latest_timestamp: safeIso(serviceEntry?.rows?.[0]?.timestamp),
    error: serviceEntry?.error || null,
  }));

  return {
    mode: payload?.mode || null,
    fetched_at: payload?.fetched_at || null,
    project_ref: payload?.project_ref || null,
    services: summary,
    raw: payload,
  };
}

function buildHighlights({ vercel, supabaseServices, supabaseSignups }) {
  const highlights = [];

  if (vercel?.api_rows === 0) {
    highlights.push('No /api/* requests found in the fetched Vercel window.');
  } else {
    highlights.push(`Found ${vercel.api_rows} Vercel /api/* requests in the fetched window.`);
  }

  if (!supabaseServices?.command_ok) {
    highlights.push(
      `Supabase service logs were not fetched: ${supabaseServices?.command_error || 'unknown error'}.`
    );
  } else {
    const failingServices = (supabaseServices?.services || []).filter((s) => s.error);
    if (failingServices.length > 0) {
      highlights.push(
        `Supabase service fetch issues for: ${failingServices.map((s) => s.service).join(', ')}.`
      );
    }
  }

  const signupCount = Number(supabaseSignups?.signup_users_returned || 0);
  highlights.push(`Fetched ${signupCount} Supabase signup rows.`);

  return highlights;
}

async function main() {
  const argsRaw = parseArgs(process.argv.slice(2));
  if (argsRaw.help) {
    console.log(usage());
    return;
  }

  const args = {
    ...argsRaw,
    vercelLimit: normalizePositiveInt(argsRaw.vercelLimit, 200, 1000),
    supabaseHours: normalizePositiveInt(argsRaw.supabaseHours, 6, 24),
    supabaseLimit: normalizePositiveInt(argsRaw.supabaseLimit, 100, 1000),
    signupDays: normalizePositiveInt(argsRaw.signupDays, 7, 3650),
    signupLimit: normalizePositiveInt(argsRaw.signupLimit, 100, 1000),
  };

  const repoRoot = process.cwd();
  const supabaseScript = path.join(repoRoot, 'scripts', 'fetch-supabase-logs.mjs');
  if (!fs.existsSync(supabaseScript)) {
    throw new Error(`Missing script: ${supabaseScript}`);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'calm-pain-platform-logs-'));
  const supabaseServiceOut = path.join(tempDir, 'supabase-services.json');
  const supabaseSignupOut = path.join(tempDir, 'supabase-signups.json');

  const vercelResult = await runCommand('vercel', [
    'logs',
    '--project',
    args.project,
    '--since',
    args.vercelSince,
    '--limit',
    String(args.vercelLimit),
    '--no-branch',
    '--no-follow',
    '--json',
  ]);

  const vercelRows = parseJsonLines(vercelResult.stdout);
  const vercel = {
    command_ok: vercelResult.exitCode === 0,
    command_exit_code: vercelResult.exitCode,
    command_error: vercelResult.exitCode === 0 ? null : (vercelResult.stderr || vercelResult.stdout).trim() || 'vercel logs failed',
    ...analyzeVercelRows(vercelRows),
    raw_row_count: vercelRows.length,
  };

  const supabaseServiceResult = await runCommand(process.execPath, [
    supabaseScript,
    '--kind',
    args.supabaseKind,
    '--hours',
    String(args.supabaseHours),
    '--limit',
    String(args.supabaseLimit),
    '--out',
    supabaseServiceOut,
  ]);

  let supabaseServices;
  if (supabaseServiceResult.exitCode === 0 && fs.existsSync(supabaseServiceOut)) {
    const payload = JSON.parse(fs.readFileSync(supabaseServiceOut, 'utf8'));
    supabaseServices = {
      command_ok: true,
      command_exit_code: 0,
      command_error: null,
      ...analyzeSupabaseServicePayload(payload),
    };
  } else {
    supabaseServices = {
      command_ok: false,
      command_exit_code: supabaseServiceResult.exitCode,
      command_error: firstErrorLine(
        supabaseServiceResult.stderr || supabaseServiceResult.stdout,
        'supabase service log fetch failed'
      ),
      mode: args.supabaseKind,
      fetched_at: null,
      project_ref: null,
      services: [],
      raw: null,
    };
  }

  const supabaseSignupResult = await runCommand(process.execPath, [
    supabaseScript,
    '--kind',
    'signup',
    '--days',
    String(args.signupDays),
    '--limit',
    String(args.signupLimit),
    '--out',
    supabaseSignupOut,
  ]);

  let supabaseSignups;
  if (supabaseSignupResult.exitCode === 0 && fs.existsSync(supabaseSignupOut)) {
    const payload = JSON.parse(fs.readFileSync(supabaseSignupOut, 'utf8'));
    supabaseSignups = {
      command_ok: true,
      command_exit_code: 0,
      command_error: null,
      since: payload?.since || null,
      signup_users_returned: Number(payload?.signup_users_returned || 0),
      latest_10: Array.isArray(payload?.signups) ? payload.signups.slice(0, 10) : [],
      raw: payload,
    };
  } else {
    supabaseSignups = {
      command_ok: false,
      command_exit_code: supabaseSignupResult.exitCode,
      command_error: firstErrorLine(
        supabaseSignupResult.stderr || supabaseSignupResult.stdout,
        'supabase signup fetch failed'
      ),
      since: null,
      signup_users_returned: 0,
      latest_10: [],
      raw: null,
    };
  }

  const report = {
    fetched_at: new Date().toISOString(),
    params: {
      project: args.project,
      vercel_since: args.vercelSince,
      vercel_limit: args.vercelLimit,
      supabase_kind: args.supabaseKind,
      supabase_hours: args.supabaseHours,
      supabase_limit: args.supabaseLimit,
      signup_days: args.signupDays,
      signup_limit: args.signupLimit,
    },
    vercel,
    supabase: {
      services: supabaseServices,
      signups: supabaseSignups,
    },
    analysis: {
      highlights: buildHighlights({
        vercel,
        supabaseServices,
        supabaseSignups,
      }),
    },
  };

  const outPath =
    args.out ||
    `/tmp/calm-pain-platform-log-analysis-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(
    JSON.stringify(
      {
        wrote: outPath,
        fetched_at: report.fetched_at,
        vercel_total_rows: vercel.total_rows,
        vercel_api_rows: vercel.api_rows,
        supabase_service_ok: supabaseServices.command_ok,
        supabase_signup_count: supabaseSignups.signup_users_returned,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exitCode = 1;
});
