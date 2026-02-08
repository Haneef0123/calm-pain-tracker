import { NextRequest, NextResponse } from 'next/server';
import { ApiError, fromError } from '@/lib/api/errors';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyReportPassword } from '@/lib/reports/password';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { trackEvent } from '@/lib/analytics/events';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return 'unknown';
}

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;

    if (!isUuid(token)) {
      throw new ApiError('INVALID_TOKEN', 'Invalid share token.', 400);
    }

    const rateLimitKey = `share:${token}:${getClientIp(request)}`;
    const rateLimit = checkRateLimit({
      key: rateLimitKey,
      max: 30,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again shortly.',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('shareable_reports')
      .select('id, user_id, title, date_start, date_end, payload, password_hash, expires_at')
      .eq('share_token', token)
      .maybeSingle();

    if (error) {
      console.error('share_report_lookup_failed', error);
      if (error.code === '42501') {
        throw new ApiError('REPORT_NOT_FOUND', 'Report not found.', 404);
      }
      if (error.code === '42P01' || error.code === 'PGRST205') {
        throw new ApiError('REPORT_SERVICE_UNAVAILABLE', 'Report service is temporarily unavailable.', 503);
      }
      throw new ApiError('REPORT_LOOKUP_FAILED', 'Report unavailable.', 500);
    }

    if (!data) {
      throw new ApiError('REPORT_NOT_FOUND', 'Report not found.', 404);
    }

    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
      throw new ApiError('REPORT_EXPIRED', 'This report link has expired.', 410);
    }

    const providedPassword = request.headers.get('x-report-password') || '';
    if (data.password_hash) {
      if (!providedPassword) {
        throw new ApiError('PASSWORD_REQUIRED', 'This report is password protected.', 401);
      }

      if (!verifyReportPassword(providedPassword, data.password_hash)) {
        throw new ApiError('INVALID_PASSWORD', 'Incorrect password.', 401);
      }
    }

    const { error: countError } = await admin.rpc('increment_report_view_count', { token });
    if (countError) {
      console.warn('increment_report_view_count_failed', countError.message);
    }

    try {
      await trackEvent(admin, 'report_shared', {
        reportId: data.id,
        hasPassword: Boolean(data.password_hash),
      }, data.user_id);
    } catch (trackError) {
      console.warn('report_shared_analytics_failed', trackError);
    }

    const payload = (data.payload || {}) as {
      summary?: unknown;
      entries?: unknown;
    };

    return NextResponse.json({
      title: data.title,
      dateStart: data.date_start,
      dateEnd: data.date_end,
      summary: payload.summary || { avgPain: 0, worst: 0, best: 0, entryCount: 0 },
      entries: payload.entries || [],
    });
  } catch (error) {
    return fromError(error);
  }
}
