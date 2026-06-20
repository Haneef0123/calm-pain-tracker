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

---

## Phase 2 — Backup: generate a recovery code ✅ Done

**Branch:** `claude/login-free-phase-doc-pu0t2s`  
**Date:** 2026-06-20

### What was done

| Task | Status | Notes |
|------|--------|-------|
| `lib/recovery/code.ts` — `generateCode`, `formatGrouped`, `normalize` | ✅ | 12-char Crockford base32, crypto-secure RNG |
| `app/api/recovery/create/route.ts` | ✅ | Upgrades anon user, bcrypt-hashes code, upserts `recovery_codes` row |
| `app/api/recovery/status/route.ts` | ✅ | Returns `{ backedUp }` by checking `recovery_codes` via admin client |
| `hooks/use-backup-status.ts` | ✅ | React Query hook; `markBackedUp()` sets cache optimistically |
| `components/track/RecoveryCodeCard.tsx` | ✅ | Monospace display, Copy (aria-live), Download .txt |
| `components/track/BackupDrawer.tsx` | ✅ | 3-step vaul drawer: Intro → Reveal → Confirm; blocks accidental close on reveal step |
| `components/track/BackupNudgeBanner.tsx` | ✅ | Amber banner with Save + dismiss (×) actions |
| `components/track/RecoveryStatusCard.tsx` | ✅ | Shield icon, backed-up vs not-backed-up states |
| `app/track/settings/page.tsx` (minimal) | ✅ | Back arrow + `RecoveryStatusCard` + `BackupDrawer` |
| `components/track/TrackEntry.tsx` — nudge wired in | ✅ | Shows after first entry; hides when backed up or dismissed |

### New / modified files
- **New:** `lib/recovery/code.ts`
- **New:** `app/api/recovery/create/route.ts`
- **New:** `app/api/recovery/status/route.ts`
- **New:** `hooks/use-backup-status.ts`
- **New:** `components/track/RecoveryCodeCard.tsx`
- **New:** `components/track/BackupDrawer.tsx`
- **New:** `components/track/BackupNudgeBanner.tsx`
- **New:** `components/track/RecoveryStatusCard.tsx`
- **New:** `app/track/settings/page.tsx`
- **Modified:** `components/track/TrackEntry.tsx` — added nudge + backup drawer

### Acceptance checklist
- [ ] Generate a code → shown once in drawer; `recovery_codes` row exists with bcrypt hash
- [ ] Auth user is permanent after generation (`synthetic_email` set via admin API)
- [ ] Regenerating overwrites the row → previous code stops working
- [ ] Nudge appears after the first entry and is dismissible
- [ ] Nudge disappears after backup is complete
- [ ] `/track/settings` shows correct backed-up / not-backed-up status

---

---

## Phase 3 — Restore: cross-device sync + switch warning ✅ Done

**Branch:** `claude/login-free-phase-doc-pu0t2s`  
**Date:** 2026-06-20

### What was done

| Task | Status | Notes |
|------|--------|-------|
| `app/api/recovery/redeem/route.ts` | ✅ | Rate-limited (5 attempts / 15-min window per hashed IP); bcrypt scans `recovery_codes`; `signInWithPassword` sets session cookies via SSR client |
| `components/track/SwitchAccountDialog.tsx` | ✅ | AlertDialog warning when restoring over un-backed-up local entries; "Back up these first" / "Switch anyway" |
| `app/track/restore/page.tsx` | ✅ | Restore form; states: idle / verifying / invalid / rate-limited / network-error; wires `SwitchAccountDialog` + `BackupDrawer`; clears React Query cache before redirect |
| `app/track/history/page.tsx` | ✅ | TrackHistory: back nav, `HistoryEntryCard`, empty-state link → `/track` |
| `app/track/settings/page.tsx` (fleshed out) | ✅ | Full settings: RecoveryStatusCard, View past entries, Export CSV, Clear all (2-tap confirm), Delete all data (2-tap confirm, `delete_user` RPC) |

### New / modified files
- **New:** `app/api/recovery/redeem/route.ts`
- **New:** `components/track/SwitchAccountDialog.tsx`
- **New:** `app/track/restore/page.tsx`
- **New:** `app/track/history/page.tsx`
- **Modified:** `app/track/settings/page.tsx` — replaced minimal Phase 2 stub with full settings

### How the restore flow works

1. User enters a `XXXX-XXXX-XXXX` code on `/track/restore`.
2. If the current device has un-backed-up entries (`!isBackedUp && entries.length > 0`), `SwitchAccountDialog` warns before proceeding.
3. The client posts the normalized code to `POST /api/recovery/redeem`.
4. The route checks rate limits (per-hashed-IP, 5 attempts / 15 min window via `recovery_redeem_attempts`).
5. It fetches all `recovery_codes` rows and bcrypt-compares to find a match.
6. On match, `supabase.auth.signInWithPassword({ email: syntheticEmail, password: code })` sets session cookies via the SSR client.
7. The client clears the React Query cache and navigates to `/track`, which re-fetches the restored user's entries.

### Acceptance checklist
- [ ] Save code on browser A; enter it in fresh browser B → B shows A's entries; new entry in B appears in A after refresh
- [ ] Wrong code → "That code didn't match" error message
- [ ] Many attempts → rate-limited message with retry countdown
- [ ] Restoring on a device with un-backed-up entries shows the switch warning first
- [ ] "Back up these first" opens the BackupDrawer in-page
- [ ] Settings: View past entries → `/track/history`; Export CSV downloads file; Clear all entries (2-tap) wipes data; Delete all data (2-tap) calls `delete_user` RPC
- [ ] History page shows all entries with collapse/delete; empty state links to `/track`

---

## Upcoming phases

| Phase | Description | Status |
|-------|-------------|--------|
| 4 | Hardening, edge cases, a11y, polish | Not started |
| 5 | Automated tests (E2E + unit) | Not started |
| 6 | Production rollout | Not started |
