import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/api/auth';
import { ApiError, fromError } from '@/lib/api/errors';
import { cancelRazorpaySubscriptionAtPeriodEnd } from '@/lib/razorpay/server';
import { toUpsertParamsFromRazorpaySubscription, upsertUserSubscription } from '@/lib/subscription/server';
import type { DbUserSubscription } from '@/types/subscription';

export async function POST() {
  try {
    const { supabase, user } = await requireAuthenticatedUser();

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw new ApiError('SUBSCRIPTION_LOOKUP_FAILED', error.message, 500);
    }

    const subscription = data as DbUserSubscription | null;

    if (!subscription?.provider_subscription_id || subscription.payment_provider !== 'razorpay') {
      throw new ApiError('NO_BILLING_ACCOUNT', 'No Razorpay subscription found for this user.', 400);
    }

    // Check if subscription is in a cancellable state
    if (!['active', 'trialing', 'past_due'].includes(subscription.status)) {
      throw new ApiError(
        'SUBSCRIPTION_NOT_ACTIVE',
        `Cannot cancel subscription with status: ${subscription.status}.`,
        400
      );
    }

    try {
      const updated = await cancelRazorpaySubscriptionAtPeriodEnd(subscription.provider_subscription_id);
      const params = toUpsertParamsFromRazorpaySubscription(updated, user.id);
      params.cancelAtPeriodEnd = true;

      await upsertUserSubscription(params);

      return NextResponse.json({
        message: 'Your subscription will cancel at the end of the current billing cycle.',
        cancelAtPeriodEnd: true,
      });
    } catch (razorpayError) {
      // Handle Razorpay-specific errors
      const errorMessage = razorpayError instanceof Error ? razorpayError.message : String(razorpayError);
      
      if (errorMessage.includes('no billing cycle') || errorMessage.includes('billing cycle is going on')) {
        throw new ApiError(
          'NO_BILLING_CYCLE',
          'Subscription cannot be cancelled because no billing cycle is active. The subscription may already be cancelled or incomplete.',
          400
        );
      }
      
      // Re-throw other Razorpay errors
      throw new ApiError(
        'RAZORPAY_ERROR',
        `Unable to cancel subscription: ${errorMessage}`,
        500
      );
    }
  } catch (error) {
    return fromError(error);
  }
}
