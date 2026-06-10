# Implementation Plan: Route Change Latency UI

## Overview

Add graceful UI handling for route-change latency. The work is ordered so the shared primitive comes first, then the visible feedback, then the architectural change that delivers instant repeats, and finally verification. Each task is independently shippable and keeps the app working.

## Tasks

- [ ] 1. Shared loading primitive
  - [ ] 1.1 Create `components/ui/spinner-overlay.tsx`
    - Dimmed backdrop + centered spinner using existing `SpinnerIcon`
    - Render via portal to `document.body`
    - `role="status"`, `aria-live="polite"`, visually-hidden "Loading" text
    - Respect `prefers-reduced-motion`
    - _Requirements: 2.1, 2.3_

- [ ] 2. Immediate tap feedback + overlay trigger
  - [ ] 2.1 Refactor `components/layout/BottomNav.tsx` into per-item `NavItem`
    - Render `NavItem` inside each `<Link>` so `useLinkStatus` is usable
    - _Requirements: 1.1_
  - [ ] 2.2 Wire `useLinkStatus` pending state in `NavItem`
    - WHILE pending: apply active styling + inline icon spinner immediately
    - Set `aria-disabled` / `pointer-events-none` to ignore repeat taps
    - Settle to normal active state on arrival
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 2.3 Mount `SpinnerOverlay` while a nav item is pending
    - _Requirements: 2.1, 2.2_

- [ ] 3. Take the blocking query off the navigation path
  - [ ] 3.1 `app/history/page.tsx`: keep `getSession()` gate, remove awaited `getPainEntries`
    - Render `<History />` immediately; data comes from the client cache
    - _Requirements: 3.1, 3.3, 3.5_
  - [ ] 3.2 `app/patterns/page.tsx`: same change for `<Trends />`
    - _Requirements: 3.1, 3.3, 3.5_
  - [ ] 3.3 `app/settings/page.tsx`: remove `getPainEntriesCount`, keep `getSession()` for email/admin
    - _Requirements: 3.3, 3.5, 4.1_
  - [ ] 3.4 `components/pages/History.tsx`: add Cold_Cache loading state via `isLoaded`/`isFetching`
    - Make `initialEntries` optional (default `[]`)
    - _Requirements: 2.2, 3.2_
  - [ ] 3.5 `components/pages/Settings.tsx`: derive count from `entries.length`
    - Remove dependency on the `entryCount` prop
    - _Requirements: 4.1_

- [ ] 4. Warm the cache after auth
  - [ ] 4.1 Prefetch `['pain-entries']` once after an authenticated session is confirmed
    - In `components/providers/auth-provider.tsx` (or near app mount)
    - Use `queryClient.prefetchQuery` with the existing fetcher
    - _Requirements: 3.4_

- [ ] 5. Cold-load Suspense fallback
  - [ ] 5.1 Create `app/loading.tsx` rendering `SpinnerOverlay`
    - _Requirements: 2.4_

- [ ] 6. Verification
  - [ ] 6.1 `yarn lint` and `yarn build` pass with no new errors
    - _Requirements: 4.3_
  - [ ] 6.2 Manual walk-through via `test-auth-playwright` skill
    - `/ → /history → /patterns → /settings → /`
    - Verify: instant tap highlight; overlay on cold visit only; instant warm repeats; Settings count matches
    - Add/delete an entry and confirm all routes reflect it
    - Capture overlay screenshot
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2_

## Notes

- Next.js resolves to 15.5.9, so `useLinkStatus` (15.3+) is available from `next/link`.
- The `QueryClient` in `components/providers.tsx` persists across client navigations, which is what makes warm-cache repeats instant.
- Trade-off accepted during planning: hard refresh of `/history` and `/patterns` shows the overlay + client fetch instead of SSR'd data, in exchange for instant in-app navigation.
