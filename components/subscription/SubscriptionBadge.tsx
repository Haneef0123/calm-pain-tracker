'use client';

import { cn } from '@/lib/utils';
import { PLAN_LABELS } from '@/lib/subscription/features';
import type { PlanType, SubscriptionStatus } from '@/types/subscription';

interface SubscriptionBadgeProps {
  planType: PlanType;
  status: SubscriptionStatus;
}

export function SubscriptionBadge({ planType, status }: SubscriptionBadgeProps) {
  const statusLabel = status.replace('_', ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        planType === 'pro' ? 'bg-foreground text-background' : 'bg-muted text-foreground'
      )}
    >
      {PLAN_LABELS[planType]} · {statusLabel}
    </span>
  );
}
