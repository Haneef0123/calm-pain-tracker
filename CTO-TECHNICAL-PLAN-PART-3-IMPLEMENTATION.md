# CTO TECHNICAL EXECUTION PLAN - PART 3
## Feature Implementation Guide

---

## WEEK 1: CORE MONETIZATION FEATURES

### DAY 1-2: Stripe Integration & Subscription System

#### Files to Create

```
lib/stripe/
  ├── client.ts          # Stripe client initialization
  ├── server.ts          # Server-side Stripe operations
  └── config.ts          # Stripe configuration

app/api/
  ├── create-checkout-session/route.ts
  ├── create-portal-session/route.ts
  └── webhooks/stripe/route.ts

hooks/
  └── use-subscription.ts  # Subscription state management

types/
  └── subscription.ts      # Subscription types

components/subscription/
  ├── SubscriptionBadge.tsx
  └── ManageSubscriptionButton.tsx
```

#### Installation

```bash
yarn add stripe @stripe/stripe-js
```

#### Environment Variables

```env
# Add to .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_ANNUAL=price_...
```

#### Implementation: lib/stripe/server.ts

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    client_reference_id: userId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
    subscription_data: {
      trial_period_days: 7,
      metadata: { user_id: userId },
    },
    allow_promotion_codes: true,
  });

  return session;
}

export async function createPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  });

  return session;
}
```

#### Implementation: hooks/use-subscription.ts

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Subscription {
  planType: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .single();

    if (error || !data) {
      setSubscription({
        planType: 'free',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
      });
    } else {
      setSubscription({
        planType: data.plan_type,
        status: data.status,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        trialEndsAt: data.trial_ends_at,
      });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPro = subscription?.planType === 'pro' || subscription?.planType === 'enterprise';
  const isTrialing = subscription?.status === 'trialing';
  const isFree = subscription?.planType === 'free';

  return { 
    subscription, 
    isPro, 
    isTrialing, 
    isFree,
    isLoading,
    refetch: fetchSubscription,
  };
}
```

#### Implementation: app/api/webhooks/stripe/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id!;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        await supabase.from('user_subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_type: 'pro',
          status: 'trialing',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
```

---

### DAY 3-4: Paywall System & Upgrade Triggers

#### Files to Create

```
components/paywalls/
  ├── UpgradeDialog.tsx
  ├── FeatureLockedBanner.tsx
  └── PricingTable.tsx

hooks/
  └── use-paywall.ts
```

#### Implementation: hooks/use-paywall.ts

```typescript
'use client';

import { useSubscription } from './use-subscription';
import { usePainEntries } from './use-pain-entries';
import { useState, useCallback } from 'react';

export type PaywallTrigger = 
  | 'history_limit'
  | 'advanced_trends'
  | 'report_limit'
  | 'device_limit'
  | 'doctor_sharing';

export function usePaywall() {
  const { isPro, subscription } = useSubscription();
  const { entries } = usePainEntries();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [triggerReason, setTriggerReason] = useState<PaywallTrigger | null>(null);

  const checkFeatureAccess = useCallback((feature: PaywallTrigger): boolean => {
    if (isPro) return true;

    switch (feature) {
      case 'history_limit': {
        const oldestEntry = entries[entries.length - 1];
        if (oldestEntry) {
          const daysSinceOldest = Math.floor(
            (Date.now() - new Date(oldestEntry.timestamp).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceOldest <= 30;
        }
        return true;
      }

      case 'advanced_trends':
      case 'doctor_sharing':
        return false;

      case 'report_limit': {
        const lastReportDate = localStorage.getItem('last_report_date');
        if (!lastReportDate) return true;
        const daysSinceReport = Math.floor(
          (Date.now() - new Date(lastReportDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceReport >= 30;
      }

      case 'device_limit':
        return true;

      default:
        return true;
    }
  }, [isPro, entries]);

  const triggerUpgrade = useCallback((reason: PaywallTrigger) => {
    setTriggerReason(reason);
    setShowUpgradeDialog(true);
  }, []);

  return {
    isPro,
    subscription,
    checkFeatureAccess,
    triggerUpgrade,
    showUpgradeDialog,
    setShowUpgradeDialog,
    triggerReason,
  };
}
```

---

### DAY 5-7: Doctor Sharing & PDF Reports

#### Files to Create

```
app/api/
  ├── reports/create/route.ts
  └── pdf/generate/route.ts

app/share/[shareToken]/page.tsx

components/reports/
  ├── ShareReportDialog.tsx
  └── ReportViewer.tsx

lib/
  └── pdf-generator.ts
```

#### Installation

```bash
yarn add jspdf
```

#### Implementation: lib/pdf-generator.ts

```typescript
import jsPDF from 'jspdf';
import type { PainEntry } from '@/types/pain-entry';
import { format } from 'date-fns';

export function generatePDF(
  entries: PainEntry[], 
  dateRange: { start: Date; end: Date },
  userEmail: string
): jsPDF {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Pain Diary Report', 20, 20);
  
  doc.setFontSize(10);
  doc.text(
    `${format(dateRange.start, 'MMM d, yyyy')} - ${format(dateRange.end, 'MMM d, yyyy')}`,
    20,
    30
  );
  
  // Summary stats
  const avgPain = entries.reduce((sum, e) => sum + e.painLevel, 0) / entries.length;
  const maxPain = Math.max(...entries.map(e => e.painLevel));
  const minPain = Math.min(...entries.map(e => e.painLevel));
  
  doc.setFontSize(12);
  doc.text('Summary', 20, 45);
  doc.setFontSize(10);
  doc.text(`Total Entries: ${entries.length}`, 20, 55);
  doc.text(`Average Pain: ${avgPain.toFixed(1)}/10`, 20, 62);
  doc.text(`Highest Pain: ${maxPain}/10`, 20, 69);
  doc.text(`Lowest Pain: ${minPain}/10`, 20, 76);
  
  // Entry list
  let y = 90;
  doc.setFontSize(12);
  doc.text('Entries', 20, y);
  y += 10;
  
  doc.setFontSize(9);
  entries.slice(0, 30).forEach((entry) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    const date = format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a');
    doc.text(`${date} - Pain: ${entry.painLevel}/10`, 20, y);
    y += 5;
    
    if (entry.locations.length > 0) {
      doc.text(`  Locations: ${entry.locations.join(', ')}`, 20, y);
      y += 5;
    }
    
    if (entry.notes) {
      const notes = entry.notes.substring(0, 80);
      doc.text(`  Notes: ${notes}${entry.notes.length > 80 ? '...' : ''}`, 20, y);
      y += 5;
    }
    
    y += 3;
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text('Generated by Pain Diary (paindiary.app)', 20, 285);
  
  return doc;
}
```

---

## WEEK 2: UX POLISH & LAUNCH PREP

### DAY 8-9: Onboarding Flow

#### Files to Create

```
components/onboarding/
  ├── WelcomeTour.tsx
  ├── OnboardingStep.tsx
  └── FirstEntryGuide.tsx

hooks/
  └── use-onboarding.ts
```

---

### DAY 10-11: Sync Status & Device Management

#### Files to Create

```
components/sync/
  ├── SyncStatusIndicator.tsx
  └── DeviceList.tsx

hooks/
  └── use-sync-status.ts
```

---

### DAY 12-14: Landing Page & Analytics

#### Files to Create

```
app/(marketing)/
  ├── layout.tsx
  ├── page.tsx
  ├── pricing/page.tsx
  └── privacy/page.tsx

components/marketing/
  ├── Hero.tsx
  ├── Features.tsx
  ├── Testimonials.tsx
  ├── PricingSection.tsx
  └── FAQ.tsx

lib/
  └── analytics.ts
```

---

## TESTING CHECKLIST

### Unit Tests
- [ ] Subscription hook logic
- [ ] Paywall trigger logic
- [ ] PDF generation
- [ ] Date calculations

### Integration Tests
- [ ] Stripe checkout flow
- [ ] Webhook handling
- [ ] Report sharing
- [ ] Free tier limits

### E2E Tests
- [ ] Sign up → First entry → Upgrade
- [ ] Create report → Share → View
- [ ] Free tier limit enforcement
- [ ] Subscription cancellation

---

## NEXT STEPS

See PART 4 for deployment checklist and launch plan
