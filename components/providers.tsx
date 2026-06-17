'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/providers/auth-provider';
import { NavigationProgressProvider } from '@/components/providers/navigation-progress-provider';
import { RouteChangeIndicator } from '@/components/layout/RouteChangeIndicator';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 1,
                refetchOnWindowFocus: false,
                refetchOnMount: false,
                refetchOnReconnect: false,
                structuralSharing: true,
            },
            mutations: {
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <NavigationProgressProvider>
                <RouteChangeIndicator />
                <AuthProvider>
                    <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        {children}
                    </TooltipProvider>
                </AuthProvider>
            </NavigationProgressProvider>
        </QueryClientProvider>
    );
}
