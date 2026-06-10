# Design Document: Route Change Latency UI

## Overview

Adds a top-of-viewport progress bar that appears during client-side route transitions. The bar simulates progress (0 → 85%) while navigation is pending, then jumps to 100% and fades out once the new route is confirmed via `usePathname()` change.

No new dependencies are required. The feature uses React Context, `usePathname` from `next/navigation`, and CSS transitions.

## Architecture

### Component Tree (after this feature)

```
Providers (components/providers.tsx)
└── QueryClientProvider
    └── NavigationProgressProvider          ← NEW
        ├── RouteChangeIndicator            ← NEW (renders the bar)
        └── AuthProvider
            └── TooltipProvider
                ├── Toaster
                ├── Sonner
                └── {children}
```

### State Machine

```
idle
  │ user clicks a nav link to different route
  ▼
navigating (progress: 10 → 85%, animated via interval)
  │ usePathname() returns new value
  ▼
completing (progress: 100%, single frame)
  │ 400ms fade-out timer
  ▼
idle (progress: 0, opacity: 0)
```

## Components and Interfaces

### NavigationProgressContext

```typescript
interface NavigationProgressContextType {
    isNavigating: boolean;
    progress: number;          // 0–100
    startNavigation: () => void;
}
```

### NavigationProgressProvider (`components/providers/navigation-progress-provider.tsx`)

- Owns `isNavigating` and `progress` state.
- `startNavigation()`: sets `isNavigating = true`, starts at 10%, kicks off an interval that increments progress with diminishing returns until ~85%.
- `useEffect` on `pathname`: when `pathname` changes while `isNavigating`, clears the interval, sets `progress = 100`, then after 400ms resets to idle.
- Cleans up timers on unmount.

### RouteChangeIndicator (`components/layout/RouteChangeIndicator.tsx`)

- Renders a `<div role="progressbar">` fixed at the top.
- Inner `<div>` uses inline `style={{ width: \`${progress}%\` }}` for the fill.
- CSS `transition: width 150ms ease-out` for smooth fill animation.
- Opacity driven by `isNavigating`: `1` while navigating, `0` otherwise (with a separate opacity transition for the fade-out).

### BottomNav (updated)

- Consumes `NavigationProgressContext`.
- Each `Link` gets an `onClick` that calls `startNavigation()` only when `path !== pathname` (i.e., actually navigating away).

## Data Flow

```
User tap on BottomNav Link
  │
  ├─ onClick fires
  │    calls startNavigation() via context
  │
  ▼
NavigationProgressProvider
  sets isNavigating = true
  progress animates: 10 → 85%
  │
  ▼
RouteChangeIndicator re-renders
  bar fills to ~current progress
  │
  ▼ (Next.js completes route change)
usePathname() returns new pathname
  │
  ▼
NavigationProgressProvider effect
  clears interval
  sets progress = 100
  schedules hide in 400ms
  │
  ▼
RouteChangeIndicator renders at 100%
  fade-out transition begins
  │
  ▼
After 400ms: isNavigating = false, progress = 0
  bar has zero opacity, aria-hidden
```

## Correctness Properties

### Property 1: No Double-Trigger
If `startNavigation()` is called while already navigating (e.g., rapid taps), the ongoing animation continues without resetting. Guard: `if (isNavigating) return` in `startNavigation`.

### Property 2: Cleanup on Unmount
All `setInterval` and `setTimeout` handles are stored in refs and cleared in the `useEffect` cleanup returned from the provider.

### Property 3: Same-Route No-Op
`BottomNav` checks `path !== pathname` before calling `startNavigation()`, so tapping the active tab never triggers the bar.

### Property 4: Dark Mode Support
Color is `bg-foreground` (Tailwind utility tied to `--foreground` CSS variable), so it automatically uses the correct color in both light and dark themes.

## Error Handling

- If `usePathname()` never changes (navigation cancelled, same route), the interval will run until a 10-second safety timeout clears it and resets state.
- If the component unmounts mid-navigation, refs are cleared by the useEffect cleanup.
