import type { SupabaseClient } from '@supabase/supabase-js';

export type AnalyticsEventName =
  | 'signup_completed'
  | 'first_entry_logged'
  | 'paywall_viewed'
  | 'checkout_started'
  | 'checkout_completed'
  | 'pro_entitlement_activated'
  | 'report_generated'
  | 'report_shared';

export async function trackEvent(
  supabase: SupabaseClient,
  eventName: AnalyticsEventName,
  eventProps: Record<string, unknown> = {},
  userId?: string | null
) {
  const { error } = await supabase.from('analytics_events').insert({
    user_id: userId || null,
    event_name: eventName,
    event_props: eventProps,
  });

  if (error) {
    // Best-effort instrumentation: don't block core user actions
    console.warn('analytics_event_insert_failed', error.message);
  }
}
