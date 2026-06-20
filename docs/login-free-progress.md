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

---

## Phase 4 — Hardening, edge cases & polish ✅ Done

**Branch:** `claude/login-free-phase-doc-pu0t2s`  
**Date:** 2026-06-20

### What was done

| Task | Status | Notes |
|------|--------|-------|
| Fix `aria-live` on Copy button | ✅ | Moved to a sibling visually-hidden `<span aria-live="polite">` outside the button — `aria-live` on interactive elements is unreliable across screen readers |
| Touch targets — icon buttons | ✅ | All icon-only buttons (back arrows, settings gear, nudge dismiss) raised from 36px / 28px → 44px |
| History loading skeleton | ✅ | `isLoaded` from `usePainEntries` gates the skeleton (3 pulsing bars) vs empty state vs list — prevents flash of empty-state during fetch |
| Restore input accessibility | ✅ | Added `aria-label`, `aria-invalid`, `aria-describedby` → error paragraph (id=`restore-error`); added `focus-visible:ring` for keyboard users |
| Edge cases — double-submit | ✅ | Already covered: restore button disabled during verifying; backup Generate button disabled during loading |
| Edge cases — code regeneration | ✅ | Already covered: `upsert` in create route replaces both the Supabase password and `code_hash`, invalidating the old code immediately |
| Edge cases — switch orphaning | ✅ | Already covered by `SwitchAccountDialog` (Phase 3) |

### Modified files
- `components/track/RecoveryCodeCard.tsx` — fix `aria-live` region placement
- `components/track/BackupNudgeBanner.tsx` — dismiss button 28px → 44px
- `components/track/TrackHeader.tsx` — settings gear link 36px → 44px
- `app/track/settings/page.tsx` — back button 36px → 44px
- `app/track/history/page.tsx` — back button 36px → 44px; add loading skeleton
- `app/track/restore/page.tsx` — back button 36px → 44px; input aria attributes + focus ring

---

---

## Phase 5 — Automated tests (unit + E2E) ✅ Done

**Branch:** `claude/login-free-plan-phases-po85ze`  
**Date:** 2026-06-20

### What was done

| Task | Status | Notes |
|------|--------|-------|
| Installed Vitest + `@vitest/coverage-v8` | ✅ | `npm install --save-dev vitest @vitest/coverage-v8` |
| Installed `@playwright/test` | ✅ | E2E runner (was missing from devDeps) |
| `vitest.config.ts` | ✅ | Node env, `@` alias, covers `lib/recovery` + `app/api/recovery` |
| `playwright.config.ts` | ✅ | Chromium + Pixel-5 mobile; `webServer` reuses a running `npm start`; CI-aware retries |
| Unit: `lib/recovery/code.ts` | ✅ | 11 tests — generateCode length/charset/ambiguity/uniqueness, formatGrouped, normalize |
| Unit: `app/api/recovery/create/route.ts` | ✅ | 7 tests — 401 no-user, 500 missing-env, 500 upgrade-fail, 500 db-fail, 200 success, upsert payload |
| Unit: `app/api/recovery/status/route.ts` | ✅ | 4 tests — no session, row found, no row, exception swallowed |
| Unit: `app/api/recovery/redeem/route.ts` | ✅ | 11 tests — rate-limit, rate-limit DB error, no code, bad JSON, wrong code, success, sign-in fail, attempt logging ×2, normalize before compare |
| E2E: `e2e/helpers/mock-api.ts` | ✅ | `page.route()` helpers for all recovery endpoints + Supabase pain_entries |
| E2E: `e2e/anonymous-track.spec.ts` | ✅ | 5 specs — no redirect, gear icon visible, pain selector, navigation, no leaking app links |
| E2E: `e2e/backup-flow.spec.ts` | ✅ | 6 specs — status display, drawer opens, code displayed, copy button, nudge banner presence |
| E2E: `e2e/restore-flow.spec.ts` | ✅ | 7 specs — reachability, empty submit, wrong code error, rate-limit message, success redirect, back nav, aria-label |
| Added `test`, `test:watch`, `test:coverage` scripts | ✅ | `npm test` runs all 33 unit tests |

### New files
- `vitest.config.ts`
- `playwright.config.ts`
- `__tests__/unit/recovery-code.test.ts`
- `__tests__/unit/api/recovery-create.test.ts`
- `__tests__/unit/api/recovery-status.test.ts`
- `__tests__/unit/api/recovery-redeem.test.ts`
- `e2e/helpers/mock-api.ts`
- `e2e/anonymous-track.spec.ts`
- `e2e/backup-flow.spec.ts`
- `e2e/restore-flow.spec.ts`

### Running the tests

**Unit tests** (no external deps needed):
```bash
npm test                  # single run — 33 tests
npm run test:watch        # watch mode
npm run test:coverage     # with V8 coverage report
```

**E2E tests** (requires a running app + Supabase):
```bash
# 1. Apply migration:  supabase db push
# 2. Enable anonymous sign-ins in Supabase dashboard
# 3. npm run build && npm start
# 4. NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx playwright test
```
E2E specs auto-skip with `test.skip` when `NEXT_PUBLIC_SUPABASE_URL` is not set.

### Acceptance
- `npm test` → 33/33 passing ✅
- `npm run build` still passes ✅
- All E2E specs annotated to skip gracefully without live Supabase ✅

---

---

## Phase 6 — Production rollout ✅ Done

**Branch:** `claude/login-free-plan-phases-po85ze`  
**Date:** 2026-06-20

### What was done

| Task | Status | Notes |
|------|--------|-------|
| Entry point on sign-in page | ✅ | "Try without signing in →" link → `/track` below the Google button |
| `docs/production-rollout.md` | ✅ | Step-by-step ops checklist: migration, Supabase config, Vercel env vars, smoke tests, monitoring, rollback |
| README updated | ✅ | Features section, updated scripts table (npm), env vars table, login-free section, link to rollout doc |

### New / modified files
- **Modified:** `app/sign-in/page.tsx` — added "Try without signing in →" entry point
- **New:** `docs/production-rollout.md` — production go-live checklist
- **Modified:** `README.md` — full update with login-free docs

### Ops steps (manual — outside this codebase)
1. `supabase db push` against the production project
2. Enable Anonymous sign-ins in Supabase dashboard → Authentication → Providers
3. Add `RECOVERY_SYNTHETIC_EMAIL_DOMAIN` to Vercel environment variables
4. Redeploy on Vercel
5. Run smoke tests per `docs/production-rollout.md`

### Acceptance
- Sign-in page shows "Try without signing in →" link ✅
- `docs/production-rollout.md` covers all go-live steps ✅
- `npm run build` passes ✅
