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
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
            resetTimerRef.current = null;
        }
        if (safetyTimerRef.current) {
            clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
        }
    }, []);

    const startNavigation = useCallback(() => {
        if (isNavigatingRef.current) return;

        isNavigatingRef.current = true;
        setIsNavigating(true);
        setProgress(10);

        progressIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 85) return prev;
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
                // Unblock new navigations immediately — don't wait for fade-out
                isNavigatingRef.current = false;
                clearAllTimers();

                // Snap bar to 100%, then begin fade-out after a brief hold
                setProgress(100);
                completeTimerRef.current = setTimeout(() => {
                    setIsNavigating(false);
                    // progress stays at 100% so the bar doesn't visually shrink during fade
                }, 100);

                // Reset progress only after fade-out animation finishes (100ms + 300ms fade)
                resetTimerRef.current = setTimeout(() => {
                    setProgress(0);
                }, 450);
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
