import type { PlanType } from '@/types/subscription';

export type PremiumFeature = 'advanced_trends' | 'doctor_report' | 'share_report';

export const FEATURE_PLAN_REQUIREMENTS: Record<PremiumFeature, PlanType> = {
  advanced_trends: 'pro',
  doctor_report: 'pro',
  share_report: 'pro',
};

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};
