'use client';

import { useEffect } from 'react';

/**
 * Dev-only performance instrumentation to help you catch INP / long task issues.
 * - Logs long tasks (>50ms)
 * - Logs Event Timing (INP candidate) entries when supported
 *
 * Safe to ship, but we only mount it in development.
 */
export function PerfObserver() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const observers: PerformanceObserver[] = [];

        // Long Tasks (main-thread blocking)
        try {
            const obs = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const duration = (entry as PerformanceEntry & { duration?: number }).duration ?? 0;
                    if (duration >= 50) {
                        console.warn('[perf] longtask', {
                            name: entry.name,
                            duration,
                            startTime: entry.startTime,
                        });
                    }
                }
            });
            obs.observe({ entryTypes: ['longtask'] as any });
            observers.push(obs);
        } catch {
            // ignore
        }

        // Event Timing (INP-related) - not supported in all browsers
        try {
            const obs = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    const e = entry as any;
                    // duration ~ processing time; interactionId groups related events
                    if (typeof e.duration === 'number' && e.duration >= 50) {
                        console.warn('[perf] event', {
                            name: e.name,
                            duration: e.duration,
                            startTime: e.startTime,
                            interactionId: e.interactionId,
                        });
                    }
                }
            });
            obs.observe({ type: 'event', buffered: true } as any);
            observers.push(obs);
        } catch {
            // ignore
        }

        return () => {
            observers.forEach((o) => o.disconnect());
        };
    }, []);

    return null;
}
