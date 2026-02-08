export type PlanType = 'free' | 'pro' | 'enterprise';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface DbUserSubscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  payment_provider: 'razorpay' | 'manual';
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  provider_plan_id: string | null;
  billing_metadata: Record<string, unknown>;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  paymentProvider: 'razorpay' | 'manual';
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  providerPlanId: string | null;
  billingMetadata: Record<string, unknown>;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ENTITLED_STATUSES: SubscriptionStatus[] = ['active', 'trialing', 'past_due'];

export function dbSubscriptionToClient(row: DbUserSubscription): UserSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    planType: row.plan_type,
    status: row.status,
    paymentProvider: row.payment_provider,
    providerCustomerId: row.provider_customer_id,
    providerSubscriptionId: row.provider_subscription_id,
    providerPlanId: row.provider_plan_id,
    billingMetadata: row.billing_metadata || {},
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    trialEndsAt: row.trial_ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createFreeSubscription(userId: string): UserSubscription {
  const now = new Date().toISOString();

  return {
    id: `free-${userId}`,
    userId,
    planType: 'free',
    status: 'active',
    paymentProvider: 'manual',
    providerCustomerId: null,
    providerSubscriptionId: null,
    providerPlanId: null,
    billingMetadata: {},
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function isProEntitled(subscription: Pick<UserSubscription, 'planType' | 'status'>): boolean {
  return subscription.planType === 'pro' && ENTITLED_STATUSES.includes(subscription.status);
}
