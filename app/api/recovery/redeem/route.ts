import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalize } from '@/lib/recovery/code';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient();
  const ipHash = hashIp(getClientIp(request));
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  // Rate-limit: count recent attempts from this IP
  const { count: recentCount, error: countError } = await adminClient
    .from('recovery_redeem_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('attempted_at', windowStart);

  if (countError) {
    console.error('Rate limit check failed:', countError);
    return Response.json({ error: 'server_error' }, { status: 500 });
  }

  if ((recentCount ?? 0) >= MAX_ATTEMPTS) {
    return Response.json({ error: 'rate_limited', retryAfterMinutes: 15 }, { status: 429 });
  }

  // Parse code from request body
  let code: string;
  try {
    const body = (await request.json()) as { code?: unknown };
    if (typeof body.code !== 'string' || !body.code) {
      return Response.json({ error: 'code_required' }, { status: 400 });
    }
    code = normalize(body.code);
  } catch {
    return Response.json({ error: 'invalid_body' }, { status: 400 });
  }

  // Fetch all recovery codes and find a bcrypt match
  const { data: codes, error: fetchError } = await adminClient
    .from('recovery_codes')
    .select('code_hash, synthetic_email');

  if (fetchError) {
    console.error('Failed to fetch recovery codes:', fetchError);
    return Response.json({ error: 'server_error' }, { status: 500 });
  }

  let matchedEmail: string | null = null;
  for (const row of codes ?? []) {
    if (await bcrypt.compare(code, row.code_hash as string)) {
      matchedEmail = row.synthetic_email as string;
      break;
    }
  }

  const succeeded = matchedEmail !== null;

  // Log the attempt
  await adminClient.from('recovery_redeem_attempts').insert({
    ip_hash: ipHash,
    attempted_at: new Date().toISOString(),
    succeeded,
  });

  if (!matchedEmail) {
    return Response.json({ error: 'invalid_code' }, { status: 401 });
  }

  // Sign in as the recovered user — the SSR client writes session cookies to the response
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: matchedEmail,
    password: code,
  });

  if (signInError) {
    console.error('Sign in failed after code match:', signInError);
    return Response.json({ error: 'sign_in_failed' }, { status: 500 });
  }

  return Response.json({ success: true });
}
