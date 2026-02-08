'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  createFreeSubscription,
  dbSubscriptionToClient,
  isProEntitled,
  type DbUserSubscription,
  type UserSubscription,
} from '@/types/subscription';

const SUBSCRIPTION_QUERY_KEY = ['subscription'] as const;

async function fetchSubscription(): Promise<UserSubscription | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') {
      return createFreeSubscription(user.id);
    }
    throw new Error(error.message);
  }

  if (!data) {
    return createFreeSubscription(user.id);
  }

  return dbSubscriptionToClient(data as DbUserSubscription);
}

export function useSubscription() {
  const query = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: fetchSubscription,
    staleTime: 60 * 1000,
  });

  const subscription = query.data ?? null;

  return {
    ...query,
    subscription,
    planType: subscription?.planType ?? 'free',
    status: subscription?.status ?? 'active',
    isPro: subscription ? isProEntitled(subscription) : false,
    isTrialing: subscription?.status === 'trialing',
  };
}
