'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCheckout } from '@/hooks/use-checkout';
import { toast } from '@/hooks/use-toast';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  title = 'Upgrade to Pro',
  description = 'Unlock advanced trends and doctor-ready reports.',
}: UpgradeDialogProps) {
  const { startCheckout, isLoading } = useCheckout();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const handleStart = () => {
    try {
      startCheckout({
        plan: selectedPlan,
        successPath: '/settings?upgraded=1',
        cancelPath: '/pricing?canceled=1',
      });
    } catch (error) {
      toast({
        title: 'Upgrade unavailable',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <button
            type="button"
            className={`w-full rounded-sm border p-3 text-left ${
              selectedPlan === 'annual' ? 'border-foreground bg-muted' : 'border-border'
            }`}
            onClick={() => setSelectedPlan('annual')}
          >
            <p className="text-sm font-medium">Pro Annual</p>
            <p className="text-xs text-muted-foreground">₹1,000/year · best value</p>
          </button>

          <button
            type="button"
            className={`w-full rounded-sm border p-3 text-left ${
              selectedPlan === 'monthly' ? 'border-foreground bg-muted' : 'border-border'
            }`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <p className="text-sm font-medium">Pro Monthly</p>
            <p className="text-xs text-muted-foreground">₹100/month</p>
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button onClick={handleStart} disabled={isLoading}>
            {isLoading ? 'Opening checkout...' : 'Start Pro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
