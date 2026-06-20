# Login-free `/track` — phased implementation plan

> Companion to `docs/login-free-plan.md` (the design). This is the **execution
> plan**: ordered phases, each independently buildable and verifiable. All work
> is additive — the existing Google `/sign-in` app is never modified.
>
> Status: **not started** (plan/design only). Branch: `claude/new-session-69gz15`.

## Phase overview

| Phase | Outcome | Shippable on its own? |
|-------|---------|-----------------------|
| 0 | Prerequisites: deps, env, migration, Supabase config | Infra only (no UI) |
| 1 | Anonymous-first `/track` + pain logging | ✅ Usable login-free tracker (single device) |
| 2 | Backup: generate a recovery code | ✅ Adds durability |
| 3 | Restore: cross-device sync + switch warning | ✅ Completes the core promise |
| 4 | Hardening, edge cases, a11y, polish | Quality |
| 5 | Automated tests (E2E + unit) | Confidence |
| 6 | Rollout (prod migration, env, entry point) | Go-live |

The minimum to demo the concept is **Phase 0 + 1**. The minimum to satisfy all
the original requirements (sync + durable) is **through Phase 3**.

---

## Phase 0 — Prerequisites & scaffolding
**Goal:** Everything in place to build, with no user-facing change.

**Tasks**
- Add dependency: `bcryptjs` (+ `@types/bcryptjs`).
- Add env var `RECOVERY_SYNTHETIC_EMAIL_DOMAIN` to `.env.example` (and Vercel
  later in Phase 6). Reuses existing `SUPABASE_SERVICE_ROLE_KEY`.
- Create migration `supabase/migrations/<ts>_recovery_codes.sql`:
  `recovery_codes` + `recovery_redeem_attempts`, RLS enabled with **no policies**.
- **External (you):** enable **Anonymous sign-ins** in the Supabase dashboard for
  the dev/test project.

**Depends on:** nothing.

**Acceptance**
- `npm run build` passes; migration applies cleanly via `supabase db push` to the
  dev/test project; both tables exist; `pain_entries` untouched.

**Risks:** none significant (purely additive).

---

## Phase 1 — Anonymous-first `/track` + logging  ← first shippable slice
**Goal:** Visiting `/track` with no account lets you log pain immediately; data
persists server-side for that browser. No sign-in wall, no links to the existing
app.

**Tasks**
- `lib/supabase/middleware.ts`: add a branch for paths starting with `/track` or
  `/api/recovery` that (a) skips the `/sign-in` redirect and (b) calls
  `supabase.auth.signInAnonymously()` when no valid session, returning
  `supabaseResponse` (cookies already wired).
- `app/track/layout.tsx` + `components/track/TrackShell.tsx` (centered
  `max-w-[430px]`, **no `BottomNav`**) + `components/track/TrackHeader.tsx`
  (title/date + gear → `/track/settings`).
- `app/track/page.tsx` → `components/track/TrackEntry.tsx`: duplicate of
  `DailyEntry`, reusing `PainSlider` + all `components/pain/*` selectors +
  `LastEntryCard` + `RotatingTips` + `usePainEntries` + `usePainEntryForm` +
  `useActionOverlay` unchanged. Swap `PageLayout` → `TrackShell`.

**Depends on:** Phase 0 (anon sign-in enabled).

**Acceptance**
- Fresh browser → open `/track` → no redirect, can set pain level + region and
  **Log today**.
- Reload → the entry is still there (server-persisted under the anon user).
- No link anywhere in `/track` to `/`, `/history`, `/sign-in`, or admin.
- Existing app at `/` and `/sign-in` behaves exactly as before.

**Risks**
- **SSR session timing:** confirm the middleware sets the anon cookie before the
  first server render so the page isn't empty on first hit. Mitigation: bootstrap
  in middleware (server-side), verified by reading `getUser()` in a server
  component if needed.

---

## Phase 2 — Backup: generate a recovery code
**Goal:** A user can turn their anonymous data into recoverable data by saving a
`XXXX-XXXX-XXXX` code. After the first entry, a nudge offers this.

**Tasks**
- `lib/recovery/code.ts`: `generateCode()` (12-char Crockford base32 via
  `crypto.randomInt`, ambiguous chars removed), `formatGrouped()`, `normalize()`.
- `app/api/recovery/create/route.ts` (service-role): get current anon user via
  the server client; generate code; `adminClient.auth.admin.updateUserById(uid, {
  email: \`${uid}@anon.${DOMAIN}\`, password: code, email_confirm: true })`;
  upsert `recovery_codes` with `bcrypt(code)`; return the formatted code.
- UI: `BackupDrawer` (vaul, 3 steps: Intro → Reveal → Confirm) + `RecoveryCodeCard`
  (Copy / Download .txt); `BackupNudgeBanner` shown on `/track` after the first
  entry; `RecoveryStatusCard` ("Not backed up yet" / "Backed up ✓").
- Minimal `app/track/settings/page.tsx` hosting `RecoveryStatusCard` (full
  settings comes in Phase 3).

**Depends on:** Phase 1 + the `recovery_codes` table (Phase 0).

**Acceptance**
- Generate a code → it's shown once; the auth user becomes permanent
  (`is_anonymous = false`, synthetic email set); a `recovery_codes` row exists
  with a bcrypt hash (not the raw code).
- Regenerating overwrites the row → the previous code stops working.
- Nudge appears only after the first entry and is dismissible.

**Risks**
- **Anon→permanent upgrade** via `updateUserById` + `email_confirm: true` must
  succeed without sending email; verify against the synthetic domain.

---

## Phase 3 — Restore: cross-device sync + switch warning  ← completes the promise
**Goal:** On any device, entering the code shows the same data (true sync).

**Tasks**
- `app/api/recovery/redeem/route.ts`: rate-limit via `recovery_redeem_attempts`
  (per-hashed-IP window + backoff); look up email by `bcrypt.compare`;
  `serverClient.auth.signInWithPassword({ email, password: code })` to set
  cookies; log the attempt.
- `app/track/restore/page.tsx` → `RestoreForm` (idle/verifying/invalid/
  rate-limited/network states) + `SwitchAccountDialog` (warns when the current
  anon session already has ≥1 entry before switching).
- Flesh out `app/track/settings/page.tsx` → `TrackSettings`: status card +
  "Use a code from another device" → `/track/restore`, **View past entries** →
  `/track/history`, **Export CSV** (`exportToCsv`), **Clear all entries**
  (`clearAllEntries`), **Delete all data** (`delete_user` RPC). No Google/sign-out.
- `app/track/history/page.tsx` → `TrackHistory` (reuse `HistoryEntryCard`; back
  nav; empty-state link → `/track`).

**Depends on:** Phase 2.

**Acceptance**
- Save a code on browser A; in a fresh browser B enter it → B shows A's entries;
  a new entry in B appears in A after refresh (same `user_id`).
- Wrong code → "didn't match"; many attempts → rate-limited message.
- Restoring on a device with un-backed-up local entries shows the switch warning
  first.

**Risks**
- Cookie-setting from a Route Handler — verify the session cookie is written and
  the subsequent `/track` load is authenticated as the restored user.

---

## Phase 4 — Hardening, edge cases & polish
**Goal:** Production-quality behavior.

**Tasks**
- Rate-limit tuning + IP hashing; consistent error/empty/loading states.
- Edge cases: regeneration invalidation, code-switch orphaning, expired anon
  session, double-submit.
- Optional: **Cloudflare Turnstile** on anonymous sign-in to curb anon-user spam.
- Accessibility pass (focus traps, `aria-live` on Copy, 44px+ targets), final
  copy, dark-mode check.

**Depends on:** Phase 3. **Acceptance:** edge cases handled gracefully; a11y review passes.

---

## Phase 5 — Automated tests
**Goal:** Lock behavior in.

**Tasks**
- Unit: `lib/recovery/code.ts` (format, charset, normalization, entropy length).
- Playwright E2E (new specs, existing Google tests untouched): anon bootstrap +
  log entry; create code; restore in a fresh context; rate-limit; isolation (no
  links from `/track` to the existing app).

**Depends on:** Phases 1–3. **Acceptance:** new suite green in CI; existing suite still green.

---

## Phase 6 — Rollout
**Goal:** Live.

**Tasks**
- Apply the migration to the **production** Supabase project; enable Anonymous
  sign-ins there; set `RECOVERY_SYNTHETIC_EMAIL_DOMAIN` in Vercel.
- Decide the public entry point (standalone `/track` link / QR / campaign URL).
- Update README/docs.

**Depends on:** Phases 1–5 merged. **Acceptance:** `/track` works in production end-to-end; existing app unaffected.

---

## Suggested delivery order / PRs
1. **PR A** = Phase 0 + 1 (anon logging) — demoable.
2. **PR B** = Phase 2 (backup).
3. **PR C** = Phase 3 (restore + settings + history).
4. **PR D** = Phases 4–5 (hardening + tests).
5. Phase 6 = ops/config, not a code PR.

(PRs only when you ask — none will be opened automatically.)
