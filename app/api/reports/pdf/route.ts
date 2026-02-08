import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/api/auth';
import { ApiError, fromError } from '@/lib/api/errors';
import { requireProEntitlement } from '@/lib/subscription/entitlements';
import type { DbPainEntry } from '@/types/pain-entry';
import { dbToClient } from '@/types/pain-entry';
import { buildReportPayload } from '@/lib/reports/payload';
import { generateSummaryPdf } from '@/lib/reports/pdf';

interface PdfRequestBody {
  dateStart?: string;
  dateEnd?: string;
  template?: 'summary' | 'detailed';
}

function assertDateString(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError('INVALID_DATE', `${label} must be in YYYY-MM-DD format.`, 400);
  }
}

function addDaysIso(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    await requireProEntitlement(supabase, user.id);

    const body = (await request.json()) as PdfRequestBody;

    if (!body.dateStart || !body.dateEnd) {
      throw new ApiError('INVALID_REQUEST', 'dateStart and dateEnd are required.', 400);
    }

    assertDateString(body.dateStart, 'dateStart');
    assertDateString(body.dateEnd, 'dateEnd');

    if (body.dateStart > body.dateEnd) {
      throw new ApiError('INVALID_RANGE', 'dateStart must be before or equal to dateEnd.', 400);
    }

    const { data: rawEntries, error } = await supabase
      .from('pain_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', `${body.dateStart}T00:00:00.000Z`)
      .lt('timestamp', addDaysIso(body.dateEnd, 1))
      .order('timestamp', { ascending: true });

    if (error) {
      throw new ApiError('ENTRIES_LOOKUP_FAILED', error.message, 500);
    }

    const entries = (rawEntries as DbPainEntry[] | null)?.map(dbToClient) ?? [];

    const payload = buildReportPayload({
      title: 'Pain Report',
      dateStart: body.dateStart,
      dateEnd: body.dateEnd,
      entries,
    });

    const pdfBuffer = generateSummaryPdf(payload);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="pain-report-${body.dateStart}-to-${body.dateEnd}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return fromError(error);
  }
}
