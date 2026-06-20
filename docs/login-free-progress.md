# Login-free `/track` — implementation progress

> Companion to `docs/login-free-phases.md` (execution plan) and `docs/login-free-plan.md` (design).  
> Updated after each phase is shipped.

---

## Phase 0 — Prerequisites ✅ Done

**Branch:** `claude/login-free-phase-doc-pu0t2s`  
**Date:** 2026-06-20

### What was done

| Task | Status | Notes |
|------|--------|-------|
| Added `bcryptjs` + `@types/bcryptjs` | ✅ | `npm install bcryptjs && npm install --save-dev @types/bcryptjs` |
| Added `RECOVERY_SYNTHETIC_EMAIL_DOMAIN` to `.env.example` | ✅ | Placeholder `anon.yourdomain.com` — replace with owned domain |
| Created migration `supabase/migrations/20260620_recovery_codes.sql` | ✅ | `recovery_codes` + `recovery_redeem_attempts` tables, RLS enabled, no policies |
| Enable Anonymous sign-ins in Supabase dashboard | ⚠️ **Manual step** | Must be done in Supabase → Authentication → Providers → Anonymous before Phase 1 will function end-to-end |

### New files
- `supabase/migrations/20260620_recovery_codes.sql`

### Acceptance
- `npm run build` passes ✅
- Migration is additive — `pain_entries` untouched ✅
- (Apply via `supabase db push` when connected to the dev project)

---

## Phase 1 — Anonymous-first `/track` + logging ✅ Done

**Branch:** `claude/login-free-phase-doc-pu0t2s`  
**Date:** 2026-06-20

### What was done

| Task | Status | Notes |
|------|--------|-------|
| `lib/supabase/middleware.ts` — `/track*` + `/api/recovery*` branch | ✅ | Skips sign-in redirect; calls `signInAnonymously()` when no session |
| `components/track/TrackShell.tsx` | ✅ | `max-w-[430px]`, no `BottomNav` |
| `components/track/TrackHeader.tsx` | ✅ | Day/date + gear icon → `/track/settings` |
| `components/track/TrackEntry.tsx` | ✅ | Duplicate of `DailyEntry` swapping `PageLayout` → `TrackShell` + `TrackHeader` |
| `app/track/layout.tsx` | ✅ | Self-contained; no existing-app nav/links |
| `app/track/page.tsx` | ✅ | Renders `TrackEntry` |

### New / modified files
- **New:** `app/track/layout.tsx`
- **New:** `app/track/page.tsx`
- **New:** `components/track/TrackShell.tsx`
- **New:** `components/track/TrackHeader.tsx`
- **New:** `components/track/TrackEntry.tsx`
- **Modified:** `lib/supabase/middleware.ts` — additive `/track*` branch only
- **Modified:** `.env.example` — added `RECOVERY_SYNTHETIC_EMAIL_DOMAIN`

### How the anonymous bootstrap works

1. A request to `/track*` reaches the middleware.
2. The middleware creates a Supabase SSR server client (with cookie read/write wired to the response).
3. It checks `getSessionFromCookies()` (fast, no network call).
4. If no valid cookie session exists, it calls `supabase.auth.getSession()`. If still no session, it calls `supabase.auth.signInAnonymously()`.
5. The Supabase client's `setAll` cookie handler writes the new anonymous session cookie onto `supabaseResponse`.
6. `supabaseResponse` is returned — the cookie is present before the first SSR render.
7. All subsequent client-side calls in `usePainEntries` use the anon `user_id` transparently via the browser cookie.

### Acceptance checklist
- [ ] Enable Anonymous sign-ins in Supabase dashboard (manual)
- [ ] Apply migration via `supabase db push`
- [ ] Fresh browser → open `/track` → no redirect, pain level + region selectable, "Log today" works
- [ ] Reload → entry still present (server-persisted under anon user)
- [ ] No link anywhere in `/track` to `/`, `/history`, `/sign-in`, or admin
- [ ] Existing app at `/` and `/sign-in` behaves exactly as before

---

## Upcoming phases

| Phase | Description | Status |
|-------|-------------|--------|
| 2 | Backup: generate a `XXXX-XXXX-XXXX` recovery code | Not started |
| 3 | Restore: cross-device sync + switch warning | Not started |
| 4 | Hardening, edge cases, a11y, polish | Not started |
| 5 | Automated tests (E2E + unit) | Not started |
| 6 | Production rollout | Not started |
