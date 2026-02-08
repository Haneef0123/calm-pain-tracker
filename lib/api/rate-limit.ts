const buckets = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  key: string;
  max: number;
  windowMs: number;
}

export function checkRateLimit(options: RateLimitOptions): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = buckets.get(options.key);

  if (!current || current.resetAt <= now) {
    buckets.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return { allowed: true, retryAfterSeconds: Math.ceil(options.windowMs / 1000) };
  }

  if (current.count >= options.max) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  buckets.set(options.key, current);

  return {
    allowed: true,
    retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
  };
}
