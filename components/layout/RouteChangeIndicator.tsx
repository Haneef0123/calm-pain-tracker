'use client';

import { useNavigationProgress } from '@/hooks/use-navigation-progress';

export function RouteChangeIndicator() {
    const { isNavigating, progress } = useNavigationProgress();

    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={isNavigating ? Math.round(progress) : undefined}
            aria-label="Page loading"
            aria-hidden={!isNavigating}
            aria-busy={isNavigating}
            className="fixed top-0 left-0 right-0 z-50 h-0.5 pointer-events-none"
        >
            <div
                className="h-full bg-foreground"
                style={{
                    width: `${progress}%`,
                    opacity: isNavigating ? 1 : 0,
                    // While navigating: animate width only (opacity is locked to 1).
                    // While fading out: animate opacity only; progress is still 100% so
                    // width stays put — no visible shrink — until the bar is invisible.
                    transition: isNavigating
                        ? 'width 150ms ease-out'
                        : 'width 0ms, opacity 300ms ease-out',
                }}
            />
        </div>
    );
}
