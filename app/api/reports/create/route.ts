import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/api/auth';
import { ApiError, fromError } from '@/lib/api/errors';
import { requireProEntitlement } from '@/lib/subscription/entitlements';
import type { CreateReportRequest, CreateReportResponse } from '@/types/report';
import type { DbPainEntry } from '@/types/pain-entry';
import { dbToClient } from '@/types/pain-entry';
import { buildReportPayload } from '@/lib/reports/payload';
import { hashReportPassword } from '@/lib/reports/password';
import { getPublicAppUrl } from '@/lib/env';
import { trackEvent } from '@/lib/analytics/events';

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}

function addDaysIso(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString();
}

function differenceInDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  return Math.floor((end - start) / (24 * 60 * 60 * 1000));
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    await requireProEntitlement(supabase, user.id);

    const body = (await request.json()) as CreateReportRequest;

    if (!body.dateStart || !body.dateEnd) {
      throw new ApiError('INVALID_REQUEST', 'dateStart and dateEnd are required.', 400);
    }

    if (!isValidDateString(body.dateStart) || !isValidDateString(body.dateEnd)) {
      throw new ApiError('INVALID_DATE', 'Date values must be in YYYY-MM-DD format.', 400);
    }

    if (body.dateStart > body.dateEnd) {
      throw new ApiError('INVALID_RANGE', 'dateStart must be before or equal to dateEnd.', 400);
    }

    const dayRange = differenceInDays(body.dateStart, body.dateEnd);
    if (dayRange > 365) {
      throw new ApiError('RANGE_TOO_LARGE', 'Maximum report range is 365 days.', 400);
    }

    const expiresInDays = body.expiresInDays ?? 30;
    if (expiresInDays < 1 || expiresInDays > 365) {
      throw new ApiError('INVALID_EXPIRY', 'expiresInDays must be between 1 and 365.', 400);
    }

    const { data: rawEntries, error: entriesError } = await supabase
      .from('pain_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', `${body.dateStart}T00:00:00.000Z`)
      .lt('timestamp', addDaysIso(body.dateEnd, 1))
      .order('timestamp', { ascending: true });

    if (entriesError) {
      throw new ApiError('ENTRIES_LOOKUP_FAILED', entriesError.message, 500);
    }

    const entries = (rawEntries as DbPainEntry[] | null)?.map(dbToClient) ?? [];
    const title = body.title?.trim() || 'Pain Report';

    const payload = buildReportPayload({
      title,
      dateStart: body.dateStart,
      dateEnd: body.dateEnd,
      entries,
    });

    const passwordHash = body.password?.trim() ? hashReportPassword(body.password.trim()) : null;
    const expiresAt = addDaysIso(new Date().toISOString().slice(0, 10), expiresInDays);

    const { data: inserted, error: insertError } = await supabase
      .from('shareable_reports')
      .insert({
        user_id: user.id,
        title,
        date_start: body.dateStart,
        date_end: body.dateEnd,
        payload,
        password_hash: passwordHash,
        expires_at: expiresAt,
      })
      .select('id, share_token')
      .single();

    if (insertError || !inserted) {
      throw new ApiError('REPORT_CREATE_FAILED', insertError?.message || 'Unable to create report.', 500);
    }

    const response: CreateReportResponse = {
      reportId: inserted.id,
      shareToken: inserted.share_token,
      shareUrl: new URL(`/share/${inserted.share_token}`, getPublicAppUrl()).toString(),
    };

    await trackEvent(supabase, 'report_generated', {
      dateStart: body.dateStart,
      dateEnd: body.dateEnd,
      entryCount: entries.length,
    }, user.id);

    return NextResponse.json(response);
  } catch (error) {
    return fromError(error);
  }
}
