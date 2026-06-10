# Design Document: Route Change Latency UI

## Overview

Route changes feel slow because of where the work happens, not just how slow Supabase is. Every route is a dynamic async Server Component that awaits a Supabase query **before returning any HTML**, and the App Router has **no `loading.tsx` fallback**, so the user sees the old page frozen until the new server render completes.

This design attacks the problem on three fronts, all chosen by the user during planning:

1. **Immediate feedback** — the tapped nav item lights up instantly via `useLinkStatus`.
2. **A spinner overlay** masks any genuine wait.
3. **Instant repeats** — data-backed routes stop blocking on a server query and instead read the persisted React Query cache, which already survives client navigations.

No bespoke per-page skeletons; one generic overlay is reused everywhere.

## Current Behavior (Why It's Slow)

```
Tap nav item
   │
   ▼
Server Component runs (every navigation):
   getSession()          ← local cookie read (fast)
   getPainEntries(...)   ← Supabase DB query (SLOW, serial, blocking)
   │  (no loading.tsx → router shows nothing)
   ▼
HTML returned → client component mounts
   usePainEntries(initialEntries) hydrates Query_Cache
```

Key findings from the codebase:

- `components/providers.tsx` creates the `QueryClient` **once** via `useState`; it is never remounted, so the `['pain-entries']` cache **persists across client navigations**.
- `hooks/use-pain-entries.ts` already supports **client-side fetch** (`fetchPainEntries` queries Supabase directly) and **SSR hydration** (`initialData`). Settings and DailyEntry already call `usePainEntries()` with no `initialEntries` — they are already client-fetched.
- The slow, redundant work is the **server-side** `getPainEntries` (History/Patterns) and `getPainEntriesCount` (Settings) on every navigation — data the client typically already has.
- `getSession()` (`lib/supabase/auth.ts`) reads the session from cookies locally and is fast; it can stay as the auth gate.
- Next.js resolves to **15.5.9** (lockfile), so `useLinkStatus` (added in 15.3) is available from `next/link`.

## Target Behavior

```
Tap nav item
   │  useLinkStatus → item shows pending highlight immediately, repeat taps ignored
   ▼
Server Component runs (lightweight):
   getSession()   ← auth gate only (fast)
   (no blocking DB query)
   ▼
Client component mounts → reads Query_Cache
   ├─ Warm_Cache → renders instantly (no overlay)
   └─ Cold_Cache → Spinner_Overlay + client fetch via usePainEntries
```

The cache is warmed once after auth, so even the first navigation to History/Patterns is typically warm.

## Architecture / Components

### 1. `SpinnerOverlay` — shared loading primitive

**New file:** `components/ui/spinner-overlay.tsx` (client component)

- Renders a dimmed backdrop with a centered spinner using the existing `SpinnerIcon` (`components/icons/SpinnerIcon.tsx`).
- Rendered via a React portal to `document.body` so it floats above page content and the bottom nav.
- Accessibility: `role="status"`, `aria-live="polite"`, visually-hidden "Loading" text. Respects `prefers-reduced-motion` (static icon if motion reduced).
- Pure presentational; visibility is controlled by callers.

### 2. Nav pending feedback + overlay trigger

**Edit:** `components/layout/BottomNav.tsx`

- Extract each item into a `NavItem` child component rendered **inside** its `<Link>` (a requirement of `useLinkStatus`).
- `NavItem` calls `const { pending } = useLinkStatus();`
  - WHILE `pending`: apply the active styling immediately, show a small inline spinner on the icon, and set `aria-disabled` + `pointer-events-none` to ignore repeat taps (Requirement 1).
  - Mount `<SpinnerOverlay />` (via portal) while `pending` is true, covering the genuine-wait case (Requirement 2.1).
- Same-route taps already no-op in Next; different-route repeat taps are blocked by the disabled state.

> Note: `useLinkStatus` reflects the App Router transition for that link. Because the destination server component becomes lightweight (no blocking query), `pending` is brief on warm navigations and the overlay barely flashes; on cold client fetches the in-page loading state (below) carries the wait.

### 3. Take the blocking query off the navigation path

**Edit:** `app/history/page.tsx` and `app/patterns/page.tsx`
- Keep the `getSession()` auth gate (fast, local). On no session, render the page with empty data as today.
- **Remove** the awaited `getPainEntries(...)` call. Render `<History />` / `<Trends />` immediately.
- The client component reads the Query_Cache via `usePainEntries()`:
  - Warm → instant content (Requirement 3.1).
  - Cold → in-page loading state / overlay until client fetch completes (Requirement 3.2). Trends already gates on `!isLoaded`; History will gain the same.
- Net: server render is now near-instant; no per-navigation DB query (Requirement 3.3).

**Edit:** `app/settings/page.tsx`
- Remove the server-side `getPainEntriesCount(...)`. Settings already calls `usePainEntries()` client-side; derive the count from `entries.length` (Requirement 4.1).
- Keep `getSession()` for `userEmail` and the admin check (local, fast).

**Edit:** `components/pages/History.tsx`
- Add the shared loading state for Cold_Cache using the hook's `isLoaded` / `isFetching` (parity with `Trends.tsx`). `initialEntries` becomes optional / defaults to `[]`.

**Edit:** `components/pages/Settings.tsx`
- Replace the `entryCount` prop usage with `entries.length` from the hook.

### 4. Warm the cache after auth

**Edit:** `components/providers/auth-provider.tsx` (or a small effect near app mount)
- After an authenticated session is confirmed, `queryClient.prefetchQuery({ queryKey: ['pain-entries'], queryFn: fetchPainEntries })` once.
- This guarantees the cache is Warm before the user navigates to History/Patterns (Requirement 3.4). The home page (DailyEntry) already fetches, so in practice this mostly covers users who land directly on a data route.

### 5. Cold-load Suspense fallback

**New file:** `app/loading.tsx`
- Renders `<SpinnerOverlay />` as the root Suspense fallback so first loads / hard refreshes on any route show the overlay until ready (Requirement 2.4).

## Data Flow After Change

| Route | Server work (per nav) | Client data source | Cold-cache UI |
|-------|----------------------|--------------------|---------------|
| `/` (Today) | `getSession()` | `usePainEntries()` | existing |
| `/history` | `getSession()` | `usePainEntries()` cache | overlay → fetch |
| `/patterns` | `getSession()` | `usePainEntries()` cache | existing `!isLoaded` |
| `/settings` | `getSession()` | `usePainEntries()` cache | overlay → fetch |

## Trade-offs

- **Lost SSR data on hard refresh of `/history` and `/patterns`.** A direct URL hit or refresh now shows the overlay + a client fetch instead of server-rendered entries. This is the cost of making in-app navigation instant and was explicitly accepted during planning. The alternative — `<Suspense>` streaming of the server query — keeps SSR but still re-queries on every navigation, so it would not deliver the "instant repeat" requirement.
- **Count source change in Settings.** Deriving from `entries.length` ties the count to the same cache the rest of the app uses; it stays consistent and removes a server round-trip. Edge case: a Cold_Cache Settings visit shows the count only after the client fetch resolves (covered by the loading state).

## Testing Strategy

- **Static:** `yarn lint`, `yarn build` (Requirement 4.3).
- **Manual (via `test-auth-playwright` skill):** with `ENABLE_TEST_AUTH=true`, walk `/ → /history → /patterns → /settings → /`:
  - Confirm the tapped item highlights immediately (Req 1).
  - Confirm the overlay appears on the first cold visit and not on warm repeats (Req 2, 3).
  - Confirm Settings count matches History entry count (Req 4.1).
  - Capture a screenshot of the overlay state.
- **Mutations:** add/delete an entry and confirm History/Patterns/Settings reflect it (Req 4.2).
