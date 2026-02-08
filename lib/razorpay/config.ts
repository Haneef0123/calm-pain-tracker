import 'server-only';

import { getRazorpayPlanIds } from '@/lib/env';
import type { BillingPlan } from '@/lib/billing/plans';
import type { PlanType } from '@/types/subscription';

function resolvePlans() {
  return getRazorpayPlanIds();
}

export function getRazorpayPlanId(plan: BillingPlan): string {
  const plans = resolvePlans();
  return plan === 'annual' ? plans.annual : plans.monthly;
}

export function isAllowedRazorpayPlanId(planId: string): boolean {
  return resolvePlans().allowlist.has(planId);
}

export function getPlanTypeFromRazorpayPlanId(planId: string): PlanType {
  if (isAllowedRazorpayPlanId(planId)) {
    return 'pro';
  }

  return 'free';
}

export function getPlanFromRazorpayPlanId(planId: string): BillingPlan | null {
  const plans = resolvePlans();

  if (planId === plans.annual) {
    return 'annual';
  }

  if (planId === plans.monthly) {
    return 'monthly';
  }

  return null;
}

export function getTotalCountForPlan(plan: BillingPlan): number {
  return plan === 'annual' ? 10 : 120;
}
