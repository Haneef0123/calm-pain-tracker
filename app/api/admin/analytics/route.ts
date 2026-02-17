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
    console.error('Failed to build admin analytics snapshot', error);
    return NextResponse.json(
      { error: 'Unable to load analytics right now' },
      { status: 500 }
    );
  }
}
