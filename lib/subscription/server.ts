import 'server-only';

import type { DbUserSubscription, PlanType, SubscriptionStatus } from '@/types/subscription';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanTypeFromRazorpayPlanId } from '@/lib/razorpay/config';
import { unixToIso, type RazorpaySubscription } from '@/lib/razorpay/server';

export interface UpsertSubscriptionParams {
  userId: string;
  paymentProvider: 'razorpay' | 'manual';
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  providerPlanId: string | null;
  billingMetadata: Record<string, unknown>;
  planType: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
}

export function mapRazorpayStatus(status: string): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active';
    case 'pending':
    case 'paused':
      return 'past_due';
    case 'halted':
      return 'unpaid';
    case 'cancelled':
    case 'completed':
    case 'expired':
      return 'canceled';
    case 'created':
    case 'authenticated':
      return 'incomplete';
    default:
      return 'incomplete';
  }
}

export function toUpsertParamsFromRazorpaySubscription(
  subscription: RazorpaySubscription,
  userId: string,
  forcedStatus?: SubscriptionStatus
): UpsertSubscriptionParams {
  const planId = subscription.plan_id || null;
  const planType = planId ? getPlanTypeFromRazorpayPlanId(planId) : 'free';

  return {
    userId,
    paymentProvider: 'razorpay',
    providerCustomerId: subscription.customer_id || null,
    providerSubscriptionId: subscription.id,
    providerPlanId: planId,
    billingMetadata: {
      rawStatus: subscription.status,
      notes: subscription.notes || {},
    },
    planType,
    status: forcedStatus || mapRazorpayStatus(subscription.status),
    currentPeriodStart: unixToIso(subscription.current_start),
    currentPeriodEnd: unixToIso(subscription.current_end),
    cancelAtPeriodEnd: Boolean(subscription.has_scheduled_changes),
    trialEndsAt: null,
  };
}

export async function upsertUserSubscription(params: UpsertSubscriptionParams): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from('user_subscriptions')
    .upsert(
      {
        user_id: params.userId,
        plan_type: params.planType,
        status: params.status,
        payment_provider: params.paymentProvider,
        provider_customer_id: params.providerCustomerId,
        provider_subscription_id: params.providerSubscriptionId,
        provider_plan_id: params.providerPlanId,
        billing_metadata: params.billingMetadata,
        current_period_start: params.currentPeriodStart,
        current_period_end: params.currentPeriodEnd,
        cancel_at_period_end: params.cancelAtPeriodEnd,
        trial_ends_at: params.trialEndsAt,
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }
}

export async function findSubscriptionByProviderRefs(params: {
  provider: 'razorpay';
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
}): Promise<DbUserSubscription | null> {
  const admin = createAdminClient();

  let query = admin.from('user_subscriptions').select('*').limit(1);
  query = query.eq('payment_provider', params.provider);

  if (params.providerSubscriptionId) {
    query = query.eq('provider_subscription_id', params.providerSubscriptionId);
  } else if (params.providerCustomerId) {
    query = query.eq('provider_customer_id', params.providerCustomerId);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Failed to load subscription mapping: ${error.message}`);
  }

  return data as DbUserSubscription | null;
}

export async function reserveWebhookEvent(params: {
  provider: 'razorpay';
  eventId: string;
  eventType: string;
  payload: unknown;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from('billing_webhook_events').insert({
    provider: params.provider,
    event_id: params.eventId,
    event_type: params.eventType,
    payload: params.payload,
  });

  if (!error) {
    return true;
  }

  if (error.code === '23505') {
    return false;
  }

  throw new Error(`Failed to reserve webhook event: ${error.message}`);
}

export async function markWebhookEventProcessed(params: {
  provider: 'razorpay';
  eventId: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('billing_webhook_events')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq('provider', params.provider)
    .eq('event_id', params.eventId);

  if (error) {
    throw new Error(`Failed to mark webhook event as processed: ${error.message}`);
  }
}

export async function markWebhookEventFailed(params: {
  provider: 'razorpay';
  eventId: string;
  errorMessage: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('billing_webhook_events')
    .update({
      processed: false,
      error_message: params.errorMessage.slice(0, 1000),
    })
    .eq('provider', params.provider)
    .eq('event_id', params.eventId);

  if (error) {
    throw new Error(`Failed to mark webhook event as failed: ${error.message}`);
  }
}
