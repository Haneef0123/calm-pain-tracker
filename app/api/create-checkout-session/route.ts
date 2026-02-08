import { NextRequest, NextResponse } from 'next/server';
import { ApiError, fromError } from '@/lib/api/errors';
import { requireAuthenticatedUser } from '@/lib/api/auth';
import {
  cancelRazorpaySubscriptionImmediately,
  createRazorpaySubscriptionCheckout,
  fetchRazorpaySubscription,
} from '@/lib/razorpay/server';
import { getRazorpayPlanId, getTotalCountForPlan } from '@/lib/razorpay/config';
import { isBillingPlan, type BillingPlan } from '@/lib/billing/plans';
import { trackEvent } from '@/lib/analytics/events';
import { toUpsertParamsFromRazorpaySubscription, upsertUserSubscription } from '@/lib/subscription/server';
import type { DbUserSubscription } from '@/types/subscription';

/** Razorpay statuses that mean the user never completed payment — safe to discard. */
const STALE_RAZORPAY_STATUSES = new Set(['created']);

/** App-side statuses that represent a real, progressing subscription — block duplicates. */
const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'] as const;

interface RequestBody {
  plan?: string;
  successPath?: string;
  cancelPath?: string;
}

function validatePath(value: string, fieldName: string): string {
  if (!value.startsWith('/')) {
    throw new ApiError('INVALID_REQUEST', `${fieldName} must start with "/".`, 400);
  }
  return value;
}

/**
 * Checks whether a stale "incomplete" subscription can be replaced with a fresh checkout.
 *
 * If the Razorpay-side subscription is still in "created" (user never paid), we cancel it
 * on Razorpay and return `true` so the caller can proceed with a new subscription.
 *
 * If the subscription has progressed past "created" on Razorpay (authenticated / active / etc.)
 * we return `false` — the user has a real subscription in flight.
 */
async function tryReclaimStaleSubscription(sub: DbUserSubscription): Promise<boolean> {
  if (!sub.provider_subscription_id) {
    // No Razorpay ID means something went wrong earlier; safe to overwrite.
    return true;
  }

  try {
    const rzpSub = await fetchRazorpaySubscription(sub.provider_subscription_id);

    if (STALE_RAZORPAY_STATUSES.has(rzpSub.status)) {
      // Still "created" on Razorpay — user never paid. Cancel and allow retry.
      console.log(`[Checkout] Cancelling stale Razorpay subscription ${rzpSub.id} (status: ${rzpSub.status})`);
      await cancelRazorpaySubscriptionImmediately(sub.provider_subscription_id);
      return true;
    }

    // Razorpay subscription has progressed (authenticated, active, etc.) — don't touch it.
    console.log(`[Checkout] Razorpay subscription ${rzpSub.id} is ${rzpSub.status}, not reclaimable`);
    return false;
  } catch (err) {
    // If we can't reach Razorpay, err on the side of safety: don't replace.
    console.error(`[Checkout] Failed to fetch Razorpay subscription ${sub.provider_subscription_id}:`, err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { supabase, user } = await requireAuthenticatedUser();

    // ── Check for existing subscription ─────────────────────────────────
    let reclaimedCustomerId: string | undefined;

    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSubscription) {
      const sub = existingSubscription as DbUserSubscription;
      const isActive = (ACTIVE_STATUSES as readonly string[]).includes(sub.status);

      if (isActive) {
        // Real subscription in progress — block duplicate.
        throw new ApiError(
          'SUBSCRIPTION_EXISTS',
          'You already have an active subscription. Manage it from Settings.',
          400
        );
      }

      if (sub.status === 'incomplete') {
        // Stale checkout attempt — try to reclaim.
        const reclaimed = await tryReclaimStaleSubscription(sub);
        if (!reclaimed) {
          throw new ApiError(
            'SUBSCRIPTION_EXISTS',
            'You already have an active subscription. Manage it from Settings.',
            400
          );
        }
        // If reclaimed, fall through and create a fresh subscription (upsert will overwrite).
        // Re-use the existing Razorpay customer ID to avoid rate-limit issues.
        reclaimedCustomerId = sub.provider_customer_id ?? undefined;
        console.log(`[Checkout] Reclaimed stale subscription for user ${user.id}, reusing customer ${reclaimedCustomerId ?? 'none'}`);
      }
      // For other terminal statuses (canceled, unpaid, incomplete_expired) — allow new checkout.
    }

    // ── Validate inputs ─────────────────────────────────────────────────
    if (!body.plan || !isBillingPlan(body.plan)) {
      throw new ApiError('INVALID_PLAN', 'Invalid plan selected.', 400);
    }

    validatePath(body.successPath || '/settings?upgraded=1', 'successPath');
    validatePath(body.cancelPath || '/pricing?canceled=1', 'cancelPath');

    if (!user.email) {
      throw new ApiError('MISSING_EMAIL', 'An email address is required for checkout.', 400);
    }

    // ── Create Razorpay subscription ────────────────────────────────────
    const plan = body.plan as BillingPlan;
    const razorpayPlanId = getRazorpayPlanId(plan);

    let checkout;
    try {
      checkout = await createRazorpaySubscriptionCheckout({
        planId: razorpayPlanId,
        userId: user.id,
        userEmail: user.email,
        totalCount: getTotalCountForPlan(plan),
        existingCustomerId: reclaimedCustomerId,
      });
    } catch (razorpayError) {
      const msg = razorpayError instanceof Error ? razorpayError.message : 'Checkout failed.';
      throw new ApiError('CHECKOUT_FAILED', msg, 502);
    }

    // ── Persist to DB (upsert overwrites any stale row) ─────────────────
    try {
      const params = toUpsertParamsFromRazorpaySubscription(checkout.subscription, user.id);
      await upsertUserSubscription(params);
    } catch (dbError) {
      // Race condition: re-check to return a clean error.
      const { data: raceCheck } = await supabase
        .from('user_subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (raceCheck) {
        throw new ApiError(
          'SUBSCRIPTION_EXISTS',
          'You already have an active subscription. Manage it from Settings.',
          400
        );
      }
      throw dbError;
    }

    await trackEvent(supabase, 'checkout_started', {
      provider: 'razorpay',
      plan,
      providerPlanId: razorpayPlanId,
      providerSubscriptionId: checkout.subscription.id,
    }, user.id);

    return NextResponse.json({
      subscription_id: checkout.subscription.id,
      url: checkout.checkoutUrl,
    });
  } catch (error) {
    return fromError(error);
  }
}
