# Requirements Document

## Introduction

Switching between the main routes (`/`, `/history`, `/patterns`, `/settings`) feels slow. The delay is dominated by Supabase API latency: every route is a dynamic async Server Component that **blocks on a database query before any HTML is returned**, and there are **no `loading.tsx` fallbacks**, so the router shows nothing between the tap and the fully-rendered page. The user is left wondering whether their tap registered.

This feature adds graceful UI handling for that latency. It gives immediate feedback on tap, masks unavoidable cold-load waits with a spinner overlay, and makes repeat navigations effectively instant by serving the persisted React Query cache instead of re-running the server-side query on every navigation.

This is a UI/perceived-performance feature. It does not change the data model, auth, or Supabase schema.

## Glossary

- **Route**: One of the four primary nav destinations — `/` (Today/DailyEntry), `/history` (History), `/patterns` (Trends), `/settings` (Settings).
- **Nav_Bar**: The fixed bottom navigation (`components/layout/BottomNav.tsx`).
- **Spinner_Overlay**: A reusable dimmed full-area overlay with a centered spinner shown during a navigation transition.
- **Query_Cache**: The root-level React Query cache (key `['pain-entries']`) created in `components/providers.tsx`. It persists across client navigations because the `QueryClient` is never remounted.
- **Pain_Entries_Hook**: `hooks/use-pain-entries.ts` (`usePainEntries`), which reads/writes the Query_Cache and supports client-side fetch + SSR hydration.
- **Cold_Cache**: State where the Query_Cache has no `['pain-entries']` data yet (e.g. first visit after load).
- **Warm_Cache**: State where the Query_Cache already holds fresh entries.

## Requirements

### Requirement 1: Immediate tap feedback

**User Story:** As a user, I want a route to react the instant I tap it, so that I know my tap registered even when the data is still loading.

#### Acceptance Criteria

1. WHEN the user taps a Nav_Bar item, THE Nav_Bar SHALL visually mark that item as active/pending immediately, without waiting for the destination to finish loading.
2. WHILE a navigation triggered by a Nav_Bar item is pending, THE Nav_Bar SHALL ignore repeat taps on that same item.
3. WHEN the destination route finishes rendering, THE Nav_Bar SHALL settle into the normal active state for the new route.

### Requirement 2: Spinner overlay during transitions

**User Story:** As a user, I want a clear loading indicator while a route is genuinely loading, so that the wait feels intentional rather than broken.

#### Acceptance Criteria

1. WHILE a navigation is pending and the destination cannot render its content yet, THE App SHALL display the Spinner_Overlay.
2. WHEN the destination route is able to render its content (Warm_Cache or fetch complete), THE App SHALL hide the Spinner_Overlay.
3. THE Spinner_Overlay SHALL be a single reusable component used for all routes (one generic spinner, not per-page bespoke skeletons).
4. WHEN the app is first loaded or hard-refreshed on any route, THE App SHALL display the Spinner_Overlay as the Suspense fallback until the route is ready.

### Requirement 3: Instant repeat navigation via cache

**User Story:** As a user, I want re-visiting a route I've already seen to be instant, so that moving around the app doesn't repeatedly pay the API latency.

#### Acceptance Criteria

1. WHEN the user navigates to a data-backed Route (`/history`, `/patterns`) AND the Query_Cache is Warm, THE Route SHALL render its content immediately without blocking on a server-side database query.
2. WHEN the user navigates to a data-backed Route AND the Query_Cache is Cold, THE Route SHALL show the Spinner_Overlay (or in-page loading state) until the client-side fetch completes.
3. THE data-backed Routes SHALL NOT perform a blocking server-side `getPainEntries` / `getPainEntriesCount` query on every navigation.
4. THE App SHALL warm the Query_Cache once after authentication so that the first navigation to a data-backed Route is also instant.
5. THE existing auth gate SHALL be preserved on every Route (an unauthenticated user SHALL NOT see another user's data).

### Requirement 4: No regression to data behavior

**User Story:** As a user, I want my entries to stay correct and up to date after this change, so that faster navigation doesn't cost me accuracy.

#### Acceptance Criteria

1. THE Settings entry count SHALL reflect the same number of entries as before (derived from the Query_Cache rather than a separate server count).
2. WHEN entries are added, updated, or deleted, THE affected Routes SHALL continue to reflect the change via the existing React Query mutations.
3. THE change SHALL pass `yarn lint` and `yarn build` with no new errors.

## Out of Scope

- A dedicated `error.tsx` failure UI for fetch errors (may be added later; current toast-based error handling remains).
- Reducing Supabase latency itself (query tuning, edge regions, connection pooling).
- Changing the auth model, schema, or the React Query mutation logic.
- Per-page bespoke skeleton screens (explicitly chosen against in favor of one generic overlay).
