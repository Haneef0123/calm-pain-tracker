'use client';

import { useMemo } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { FEATURE_PLAN_REQUIREMENTS, type PremiumFeature } from '@/lib/subscription/features';

interface PaywallResult {
  allowed: boolean;
  reason: string | null;
  cta: {
    label: string;
    href: string;
  };
}

export function usePaywall(feature: PremiumFeature): PaywallResult {
  const { isPro } = useSubscription();

  return useMemo(() => {
    const requiredPlan = FEATURE_PLAN_REQUIREMENTS[feature];

    if (requiredPlan === 'pro' && !isPro) {
      const reasonMap: Record<PremiumFeature, string> = {
        advanced_trends: '30-day and all-time pattern insights are available on Pro.',
        doctor_report: 'Doctor-ready reports are available on Pro.',
        share_report: 'Shareable report links are available on Pro.',
      };

      return {
        allowed: false,
        reason: reasonMap[feature],
        cta: {
          label: 'Upgrade to Pro',
          href: '/pricing',
        },
      };
    }

    return {
      allowed: true,
      reason: null,
      cta: {
        label: 'Manage plan',
        href: '/settings',
      },
    };
  }, [feature, isPro]);
}
