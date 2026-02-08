'use client';

import { createClient } from '@/lib/supabase/client';
import type { AnalyticsEventName } from '@/lib/analytics/events';

export async function trackClientEvent(eventName: AnalyticsEventName, eventProps: Record<string, unknown> = {}) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_name: eventName,
      event_props: eventProps,
    });
  } catch {
    // Best effort only.
  }
}
