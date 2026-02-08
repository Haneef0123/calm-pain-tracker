'use client';

import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { useCheckout } from '@/hooks/use-checkout';
import { toast } from '@/hooks/use-toast';

const FREE_FEATURES = [
  'Daily pain logging',
  'Entry history',
  '7-day trend view',
  'CSV export',
];

const PRO_FEATURES = [
  '30-day and all-time trend windows',
  'Doctor-ready report generation',
  'Shareable report links',
  'Priority support',
];

export default function PricingPage() {
  const { startCheckout, isLoading } = useCheckout();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('upgraded') === '1') {
      toast({
        title: 'Upgrade successful',
        description: 'Your Pro access is activating now.',
      });
    }

    if (params.get('canceled') === '1') {
      toast({
        title: 'Checkout canceled',
        description: 'No changes were made to your plan.',
      });
    }
  }, []);

  const handleCheckout = async (plan: 'annual' | 'monthly') => {
    try {
      await startCheckout({
        plan,
        successPath: '/settings?upgraded=1',
        cancelPath: '/pricing?canceled=1',
      });
    } catch (error) {
      toast({
        title: 'Pricing unavailable',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <PageLayout>
      <div className="pt-8 pb-12 animate-fade-in">
        <header className="mb-8">
          <h1 className="text-heading">Upgrade to Pro</h1>
          <p className="text-label mt-1">Generate evidence your clinician can act on.</p>
        </header>

        <div className="grid gap-4">
          <section className="rounded-sm border border-border bg-card p-5">
            <p className="text-sm font-semibold mb-3">Free</p>
            <ul className="space-y-2 mb-4">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <p className="text-xl font-semibold">Free</p>
          </section>

          <section className="rounded-sm border border-foreground bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Pro</p>
              <span className="text-xs rounded-full bg-foreground text-background px-2 py-1">Recommended</span>
            </div>
            <ul className="space-y-2 mb-4">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              <Button className="w-full" onClick={() => handleCheckout('annual')} disabled={isLoading}>
                {isLoading ? 'Opening checkout...' : 'Start Pro (Annual) · ₹1,000/year'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleCheckout('monthly')}
                disabled={isLoading}
              >
                {isLoading ? 'Opening checkout...' : 'Start Pro (Monthly) · ₹100/month'}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
