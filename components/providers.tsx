'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';

const TooltipProvider = dynamic(() => import('@/components/ui/tooltip').then(m => m.TooltipProvider), { ssr: false });
const Toaster = dynamic(() => import('@/components/ui/toaster').then(m => m.Toaster), { ssr: false });
const Sonner = dynamic(() => import('@/components/ui/sonner').then(m => m.Toaster), { ssr: false });
import { AuthProvider } from '@/components/providers/auth-provider';
import { PerfObserver } from '@/components/perf/PerfObserver';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Data is fresh for 5 minutes
                staleTime: 5 * 60 * 1000,
                // Keep unused data in cache for 10 minutes
                gcTime: 10 * 60 * 1000,
                // Retry failed requests once
                retry: 1,
                // Avoid surprise refetches that make navigation feel slow.
                refetchOnWindowFocus: false,
                // Only refetch on mount when data is stale (default behavior).
                refetchOnMount: false,
                // Memory efficiency
                structuralSharing: true,
            },
            mutations: {
                // Retry failed mutations once
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {process.env.NODE_ENV === 'development' ? <PerfObserver /> : null}
            <AuthProvider>
                <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    {children}
                </TooltipProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
