import { NextRequest, NextResponse } from 'next/server';
import { ApiError, fromError } from '@/lib/api/errors';
import {
  getRazorpayWebhookEventId,
  parseRazorpayWebhookEvent,
  verifyRazorpayWebhookSignature,
  type RazorpaySubscription,
  type RazorpayWebhookEvent,
} from '@/lib/razorpay/server';
import {
  findSubscriptionByProviderRefs,
  markWebhookEventFailed,
  markWebhookEventProcessed,
  reserveWebhookEvent,
  toUpsertParamsFromRazorpaySubscription,
  upsertUserSubscription,
} from '@/lib/subscription/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { trackEvent } from '@/lib/analytics/events';

const SUBSCRIPTION_EVENTS = new Set([
  'subscription.authenticated',
  'subscription.activated',
  'subscription.charged',
  'subscription.pending',
  'subscription.halted',
  'subscription.cancelled',
  'subscription.completed',
  'subscription.paused',
  'subscription.resumed',
]);

function extractSubscription(event: RazorpayWebhookEvent): RazorpaySubscription | null {
  return event.payload?.subscription?.entity || null;
}

function mapForcedStatus(eventType: string) {
  switch (eventType) {
    case 'subscription.cancelled':
    case 'subscription.completed':
      return 'canceled' as const;
    case 'subscription.pending':
      return 'past_due' as const;
    case 'subscription.halted':
      return 'unpaid' as const;
    default:
      return undefined;
  }
}

async function resolveMappedUserId(subscription: RazorpaySubscription): Promise<string> {
  const metadataUserId = subscription.notes?.user_id;
  if (metadataUserId) {
    return metadataUserId;
  }

  const existing = await findSubscriptionByProviderRefs({
    provider: 'razorpay',
    providerSubscriptionId: subscription.id,
    providerCustomerId: subscription.customer_id,
  });

  if (!existing?.user_id) {
    throw new ApiError('SUBSCRIPTION_MAPPING_NOT_FOUND', 'Unable to map Razorpay subscription to user.', 400);
  }

  return existing.user_id;
}

async function handleSubscriptionEvent(event: RazorpayWebhookEvent) {
  const subscription = extractSubscription(event);
  if (!subscription) {
    return;
  }

  const existing = await findSubscriptionByProviderRefs({
    provider: 'razorpay',
    providerSubscriptionId: subscription.id,
    providerCustomerId: subscription.customer_id,
  });

  const userId = subscription.notes?.user_id || existing?.user_id || (await resolveMappedUserId(subscription));

  const params = toUpsertParamsFromRazorpaySubscription(
    subscription,
    userId,
    mapForcedStatus(event.event)
  );

  await upsertUserSubscription(params);

  const admin = createAdminClient();

  if (event.event === 'subscription.activated') {
    await trackEvent(admin, 'checkout_completed', {
      provider: 'razorpay',
      providerSubscriptionId: subscription.id,
    }, userId);
  }

  if (
    params.planType === 'pro' &&
    (params.status === 'active' || params.status === 'trialing') &&
    (!existing || existing.status !== params.status)
  ) {
    await trackEvent(admin, 'pro_entitlement_activated', {
      provider: 'razorpay',
      providerSubscriptionId: subscription.id,
      status: params.status,
    }, userId);
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const eventId = getRazorpayWebhookEventId(rawBody, request.headers.get('x-razorpay-event-id'));

  try {
    verifyRazorpayWebhookSignature(rawBody, request.headers.get('x-razorpay-signature'));
  } catch {
    return fromError(new ApiError('INVALID_SIGNATURE', 'Invalid Razorpay signature.', 400));
  }

  let event: RazorpayWebhookEvent;

  try {
    event = parseRazorpayWebhookEvent(rawBody);
  } catch {
    return fromError(new ApiError('INVALID_PAYLOAD', 'Invalid webhook payload.', 400));
  }

  const reserved = await reserveWebhookEvent({
    provider: 'razorpay',
    eventId,
    eventType: event.event,
    payload: event,
  });

  if (!reserved) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (SUBSCRIPTION_EVENTS.has(event.event)) {
      await handleSubscriptionEvent(event);
    }

    await markWebhookEventProcessed({
      provider: 'razorpay',
      eventId,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed.';

    try {
      await markWebhookEventFailed({
        provider: 'razorpay',
        eventId,
        errorMessage: message,
      });
    } catch (loggingError) {
      console.warn('webhook_failure_log_failed', loggingError);
    }

    return fromError(error);
  }
}

export const runtime = 'nodejs';
