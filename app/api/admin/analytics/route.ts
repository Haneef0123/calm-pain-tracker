import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAnalyticsAdmin } from '@/lib/admin/access';
import { getAnalyticsSnapshot } from '@/lib/admin/analytics';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAnalyticsAdmin(user?.email)) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const timeZone = request.nextUrl.searchParams.get('tz') ?? 'UTC';

  try {
    const snapshot = await getAnalyticsSnapshot(timeZone);
    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Missing SUPABASE_SERVICE_ROLE_KEY') || message.includes('Missing NEXT_PUBLIC_SUPABASE_URL')) {
      console.error('[analytics] Configuration error — check that SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are set in your deployment environment:', message);
    } else if (
      message.toLowerCase().includes('invalid api key') ||
      message.toLowerCase().includes('invalid token') ||
      message.toLowerCase().includes('jwt') ||
      message.toLowerCase().includes('unauthorized')
    ) {
      console.error('[analytics] Supabase auth error — SUPABASE_SERVICE_ROLE_KEY may be wrong or rotated. Re-copy it from Supabase → Settings → API:', message);
    } else {
      console.error('[analytics] Failed to build snapshot:', message, error);
    }

    return NextResponse.json(
      { error: 'Unable to load analytics right now' },
      { status: 500 }
    );
  }
}
