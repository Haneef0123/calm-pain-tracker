'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface CreateCheckoutSessionResponse {
  subscription_id: string;
  url?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay Checkout script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    // Check if script tag already exists (e.g. from another component mount)
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => setRazorpayLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.error('Failed to load Razorpay Checkout script');
    document.head.appendChild(script);
  }, []);

  const startCheckout = async (params: {
    plan: 'monthly' | 'annual';
    successPath?: string;
    cancelPath?: string;
  }) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: params.plan,
          successPath: params.successPath ?? '/settings?upgraded=1',
          cancelPath: params.cancelPath ?? '/pricing?canceled=1',
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Unable to start checkout right now.');
      }

      const data = payload as CreateCheckoutSessionResponse;

      // Use Razorpay Checkout SDK if available
      if (data.subscription_id && window.Razorpay && razorpayLoaded) {
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
        if (!keyId) {
          // Fallback to hosted page redirect
          if (data.url) {
            window.location.href = data.url;
            return;
          }
          throw new Error('Payment gateway not configured. Please try again later.');
        }

        const razorpay = new window.Razorpay({
          key: keyId,
          subscription_id: data.subscription_id,
          name: 'Pain Diary Pro',
          description: params.plan === 'monthly' ? 'Monthly Subscription' : 'Annual Subscription',
          theme: { color: '#000000' },
          handler: function () {
            // Payment successful — navigate to success page
            const successPath = params.successPath ?? '/settings?upgraded=1';
            window.location.href = successPath;
          },
          modal: {
            ondismiss: function () {
              // User closed the modal — just reset the button, no redirect
              setIsLoading(false);
            },
          },
        });

        razorpay.open();
      } else if (data.url) {
        // Fallback to hosted page redirect
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL available');
      }
    } catch (error) {
      toast({
        title: 'Checkout unavailable',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    startCheckout,
  };
}
