'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function MaintenancePage() {
    const router = useRouter();
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetry = async () => {
        setIsRetrying(true);
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push('/');
        router.refresh();
    };

    // Auto-retry every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh();
        }, 30000);

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
                <div className="flex justify-center">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-heading">Service Temporarily Unavailable</h1>
                    <p className="text-muted-foreground">
                        We&apos;re having trouble connecting to our servers. This is usually temporary.
                    </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2">
                    <p className="font-medium">What&apos;s happening?</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Our backend service may be temporarily down</li>
                        <li>There might be a network connectivity issue</li>
                        <li>The service could be updating</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="w-full"
                        size="lg"
                    >
                        {isRetrying ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Retrying...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        Auto-retrying every 30 seconds...
                    </p>
                </div>

                <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                        If this persists, check{' '}
                        <a
                            href="https://status.supabase.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground underline hover:no-underline"
                        >
                            Supabase Status
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
