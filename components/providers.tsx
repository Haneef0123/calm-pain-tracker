'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/providers/auth-provider';

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
                // Refetch on window focus for fresh data
                refetchOnWindowFocus: true,
                // Don't refetch on mount if data is fresh
                refetchOnMount: true,
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
