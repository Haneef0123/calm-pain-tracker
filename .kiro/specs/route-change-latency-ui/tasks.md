# Tasks: Route Change Latency UI

## Task 1: Create NavigationProgressProvider

**File:** `components/providers/navigation-progress-provider.tsx`

- Define `NavigationProgressContext` with `isNavigating`, `progress`, and `startNavigation`.
- Implement `NavigationProgressProvider`:
  - `startNavigation()` guards against double-trigger (`if (isNavigating) return`).
  - Interval-based progress animation (10 → 85%) with diminishing increments.
  - `useEffect` on `usePathname()` to detect navigation completion.
  - 10-second safety timeout to reset stale navigating state.
  - Cleanup all timers on unmount.

## Task 2: Create useNavigationProgress Hook

**File:** `hooks/use-navigation-progress.ts`

- Simple re-export of `useContext(NavigationProgressContext)`.
- Export `useNavigationProgress` and re-export `NavigationProgressContext` for direct context consumers.

## Task 3: Create RouteChangeIndicator Component

**File:** `components/layout/RouteChangeIndicator.tsx`

- Fixed position, `top-0 left-0 right-0`, `h-0.5`, `z-50`, `pointer-events-none`.
- `role="progressbar"`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-valuenow`.
- `aria-label="Page loading"`, `aria-hidden={!isNavigating}`, `aria-busy={isNavigating}`.
- Inner div with `bg-foreground`, `width: \`${progress}%\``, smooth CSS transition.
- Opacity 0 when not navigating, opacity 1 when navigating.

## Task 4: Wire NavigationProgressProvider into Providers

**File:** `components/providers.tsx`

- Import `NavigationProgressProvider` from `@/components/providers/navigation-progress-provider`.
- Import `RouteChangeIndicator` from `@/components/layout/RouteChangeIndicator`.
- Wrap the existing tree with `NavigationProgressProvider`.
- Render `<RouteChangeIndicator />` as first child inside `NavigationProgressProvider`.

## Task 5: Update BottomNav to Trigger Navigation Start

**File:** `components/layout/BottomNav.tsx`

- Import `useNavigationProgress` from `@/hooks/use-navigation-progress`.
- Call `startNavigation()` in `onClick` of each `Link` only when `path !== pathname`.

## Task 6: Verify Build

- Run `yarn build` (or `npm run build`) to confirm no TypeScript or compilation errors.
- Run `yarn lint` to confirm no ESLint errors.
