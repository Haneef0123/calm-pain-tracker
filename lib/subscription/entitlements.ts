import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/api/errors';
import {
  createFreeSubscription,
  dbSubscriptionToClient,
  isProEntitled,
  type DbUserSubscription,
  type UserSubscription,
} from '@/types/subscription';

export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSubscription> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') {
      return createFreeSubscription(userId);
    }
    throw new ApiError('SUBSCRIPTION_LOOKUP_FAILED', error.message, 500);
  }

  if (!data) {
    return createFreeSubscription(userId);
  }

  return dbSubscriptionToClient(data as DbUserSubscription);
}

export async function requireProEntitlement(supabase: SupabaseClient, userId: string) {
  const subscription = await getUserSubscription(supabase, userId);

  if (!isProEntitled(subscription)) {
    throw new ApiError('PRO_REQUIRED', 'This feature requires an active Pro subscription.', 403);
  }

  return subscription;
}
