import 'server-only';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPublicAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function getSupabaseServiceRoleKey(): string {
  return getEnv('SUPABASE_SERVICE_ROLE_KEY');
}

export function getRazorpayKeyId(): string {
  return getEnv('RAZORPAY_KEY_ID');
}

export function getRazorpayKeySecret(): string {
  return getEnv('RAZORPAY_KEY_SECRET');
}

export function getRazorpayWebhookSecret(): string {
  return getEnv('RAZORPAY_WEBHOOK_SECRET');
}

export function getRazorpayPlanIds() {
  const monthly = getEnv('RAZORPAY_PLAN_PRO_MONTHLY');
  const annual = getEnv('RAZORPAY_PLAN_PRO_ANNUAL');

  return {
    monthly,
    annual,
    allowlist: new Set([monthly, annual]),
  };
}
