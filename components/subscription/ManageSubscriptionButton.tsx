'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface PortalResponse {
  url?: string;
  message?: string;
  cancelAtPeriodEnd?: boolean;
}

export function ManageSubscriptionButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManage = async () => {
    setIsLoading(true);
    try {
      const confirmed = window.confirm(
        'Do you want to cancel your Pro plan at the end of the current billing cycle?'
      );

      if (!confirmed) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Unable to open billing portal.');
      }

      const data = payload as PortalResponse;

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      toast({
        title: 'Subscription updated',
        description: data.message || 'Your request has been processed.',
      });
      setIsLoading(false);
    } catch (error) {
      toast({
        title: 'Subscription update failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={handleManage}
      disabled={isLoading}
    >
      {isLoading ? 'Updating...' : 'Manage subscription'}
    </Button>
  );
}
