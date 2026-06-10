'use client';

import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationProgressContextType {
    isNavigating: boolean;
    progress: number;
    startNavigation: () => void;
}

export const NavigationProgressContext = createContext<NavigationProgressContextType>({
    isNavigating: false,
    progress: 0,
    startNavigation: () => {},
});

export function NavigationProgressProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);
    const isNavigatingRef = useRef(false);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevPathnameRef = useRef(pathname);

    const clearAllTimers = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        if (completeTimerRef.current) {
            clearTimeout(completeTimerRef.current);
            completeTimerRef.current = null;
        }
        if (safetyTimerRef.current) {
            clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
        }
    }, []);

    const startNavigation = useCallback(() => {
        // Guard against double-trigger
        if (isNavigatingRef.current) return;

        isNavigatingRef.current = true;
        setIsNavigating(true);
        setProgress(10);

        progressIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 85) return prev;
                // Diminishing increments as we approach 85%
                const increment = Math.random() * 12 * (1 - prev / 100);
                return Math.min(prev + increment, 85);
            });
        }, 150);

        // Safety timeout: reset after 10s if navigation never completes
        safetyTimerRef.current = setTimeout(() => {
            clearAllTimers();
            isNavigatingRef.current = false;
            setIsNavigating(false);
            setProgress(0);
        }, 10000);
    }, [clearAllTimers]);

    // Detect pathname change = navigation complete
    useEffect(() => {
        if (pathname !== prevPathnameRef.current) {
            prevPathnameRef.current = pathname;

            if (isNavigatingRef.current) {
                clearAllTimers();
                setProgress(100);

                completeTimerRef.current = setTimeout(() => {
                    isNavigatingRef.current = false;
                    setIsNavigating(false);
                    setProgress(0);
                }, 400);
            }
        }
    }, [pathname, clearAllTimers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearAllTimers();
        };
    }, [clearAllTimers]);

    return (
        <NavigationProgressContext.Provider value={{ isNavigating, progress, startNavigation }}>
            {children}
        </NavigationProgressContext.Provider>
    );
}
