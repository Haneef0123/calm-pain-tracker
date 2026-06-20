# Login-free experience plan (`/track`)

> Status: **Plan only** — no application code has been changed. This document
> captures the agreed approach for adding a login-free way to use the pain
> tracker, alongside (not replacing) the existing Google sign-in.

## Goal

Let people use the pain tracker **without logging in**, while still meeting these
hard requirements:

- **Cross-device sync** — the same data on phone + laptop.
- **Durable** — data survives clearing the browser or switching browsers.
- **Cloud-backed** — keep Supabase; admin analytics keeps working.
- **Non-destructive** — the existing Google `/sign-in` flow is left untouched.
- **Isolated** — the login-free flow lives on a **new route (`/track`)** and is
  fully self-contained: **a user in `/track` sees no trace of the existing app**
  (no Google sign-in links, no admin, no shared navigation).

## The core tension (why a recovery code is required)

"No login" + "sync across devices" + "survive a browser wipe" cannot all be true
with *zero* identity anchor: recognizing the same person on a new device requires
*something*. With no anchor, a new device or wiped browser is indistinguishable
from a brand-new user and the data is unreachable.

Therefore the design is **anonymous-first with a recovery code** as the
anchor: no login screen up front, and a lightweight, account-less way to
re-attach to the data when the user wants sync or moves devices.

## Approaches considered

| # | Approach | Verdict |
|---|----------|---------|
| A | Local-only (IndexedDB/localStorage), no backend | Rejected — no sync, not durable, breaks analytics |
| B | Supabase Anonymous Auth only | Rejected alone — identity lives in one browser cookie; no sync / not durable |
| C | Local-first + optional cloud sync | Heavier; not needed since we keep Supabase |
| D | Device-ID + relaxed RLS | Rejected — weakens security |
| E | Shareable access code | Effectively the chosen anchor |
| **Chosen** | **Anonymous-first + recovery code (B + E)** | Meets all requirements, keeps RLS unchanged |

## High-level design

Two independent entry paths into the **same app** and the **same `pain_entries`
table**:

| Path | Identity | Status |
|------|----------|--------|
| Existing `/sign-in` (Google OAuth) | Real Google user | **Untouched** |
| **New `/track`** | Supabase **anonymous** user, upgradeable to a recovery-code account | **New** |

Both are genuine Supabase `auth.users`, so **Row-Level Security stays exactly as
it is today** — no data-layer changes, no weakened security, and the admin
analytics aggregates over everyone uniformly.

## Flow

### First visit to `/track`
1. The **middleware** handles bootstrap: on a request to `/track*` with no
   session, it calls `signInAnonymously()` server-side and sets the auth cookies
   on the response, so the session exists before the first SSR render.
2. The app is usable immediately — **no login UI**.
3. Pain entries save to the cloud under the anonymous `user_id`.

### Recovery code (the crux)

Implemented with **standard Supabase auth only** — no RLS changes:

1. **Generate** a recovery code: a **12-character Crockford base32** string
   (~60-bit, crypto-secure RNG, ambiguous characters removed) displayed grouped
   as `XXXX-XXXX-XXXX`. Case-insensitive on entry. No external wordlist
   dependency.
2. **Back up** (new server API route, service-role): convert the anonymous
   account into a permanent one by setting a **synthetic, non-user-facing email**
   derived from the user id on an **owned domain** (e.g.
   `<uid>@anon.<owned-domain>`, configured via
   `RECOVERY_SYNTHETIC_EMAIL_DOMAIN`) with the **recovery code as the password**,
   auto-confirmed via the admin API (`email_confirm: true`, no email sent); store
   `bcrypt(code) -> email` in a new `recovery_codes` table.
3. **Restore** on any device (`/track/restore`): user enters the code ->
   server looks up the email by hash -> `signInWithPassword(email, code)`
   -> sets session cookies. Both devices now share the **same `user_id`** ->
   true multi-device sync.

### Backup prompt
After the user saves their **first pain entry** in `/track`, show a gentle,
dismissible nudge to save a recovery code. It re-surfaces in the `/track`
settings area.

## Isolation requirement (important)

`/track` must be a **self-contained experience**. The user should not learn that
the existing (Google) app exists.

- `/track` uses its **own layout / navigation** — it does not inherit any global
  nav that links to `/sign-in`, Google sign-out, or admin.
- No links from `/track` to existing routes; no "Sign in with Google" anywhere in
  the flow.
- "Sign out" inside `/track` becomes "lock / switch" — restorable via the
  recovery code — rather than a Google sign-out.

## Files involved

### New files (the feature is additive)

Routes (minimal scope — Today + Settings; History/backup reached from Settings):
- `app/track/layout.tsx` — self-contained shell (no existing-app nav/links).
- `app/track/page.tsx` — **Today** (log a check-in); primary screen.
- `app/track/settings/page.tsx` — **Settings** (backup/restore, export, history,
  clear, delete).
- `app/track/history/page.tsx` — **Past days** (reached from Settings).
- `app/track/restore/page.tsx` — restore-with-code screen.

API:
- `app/api/recovery/create/route.ts` — generate code, set synthetic credentials,
  store hash.
- `app/api/recovery/redeem/route.ts` — verify code, sign in, set cookies
  (rate-limited).

Database:
- `supabase/migrations/<timestamp>_recovery_codes.sql` — new `recovery_codes` and
  `recovery_redeem_attempts` tables.

UI components: see the **UI / UX design** section below for the full inventory.

### Minimal additive touchpoints to existing files (no behavior replaced)
- `middleware.ts` / `lib/supabase/middleware.ts` — **add** a `/track*` branch
  that (a) exempts these routes from the Google auth wall, and (b) bootstraps an
  anonymous session if none exists. Also add `/api/recovery/*` to the public
  allowlist. Existing Google redirect logic for every other route is untouched.
  This is the one unavoidable additive edit.

### Reuse vs. duplicate (decision)
- **Reuse the data layer as-is** (`hooks/use-pain-entries.ts`,
  `lib/data/pain-entries.ts`, the Supabase clients) — it is UI/nav-free and works
  for any authenticated user, including anonymous ones.
- **Duplicate the presentational UI** needed by `/track` into self-contained
  components under `app/track/`, rather than refactoring the existing tracker
  components. This keeps the existing app **100% untouched** and fully isolates
  `/track`, at the cost of some UI duplication. A future consolidation refactor
  is possible if/when touching shared components becomes acceptable.

## UI / UX design

### Principles
- **Mirror the existing design language** (mobile-first, `max-w-[430px]`, the
  pain-color tokens, Inter font, lucide icons, vaul drawers) so `/track` feels
  native — while staying **fully self-contained** (no bottom-nav links to `/`,
  `/history`, `/patterns`, `/settings`, `/sign-in`, or admin).
- **Use first, anchor later.** Nothing blocks logging. The recovery code is
  offered as a gentle, dismissible nudge after the first entry, and always
  available in Settings.
- **Minimal surface.** Two screens (Today, Settings); History and the
  backup/restore flows are reached from Settings.

### Navigation & screen map
No persistent bottom tab bar (that's the existing app's pattern). Instead:

```
/track                 Today  ──(gear icon, top-right)──►  /track/settings
   ▲                                                            │
   └──────────────── back ◄─────────────────────────────────────┤
                                                                 ├─► /track/history   (View past entries)
                                                                 ├─► Backup drawer    (Save a recovery code)
                                                                 └─► /track/restore   (Use a code / switch device)
```

- **Today** (`/track`) is home; a gear icon in the header opens Settings.
- **Settings** and **History** are pushed pages with a back arrow to the previous
  screen. None links to the existing app.

### Design-system reuse (no changes to shared files)
- **Reuse as-is** (pure, nav/auth-free): all `components/ui/*` (button, drawer,
  textarea, label, alert-dialog, tooltip, sonner/toast, action-overlay); all
  `components/pain/*` selectors + `PainSlider`, `ChipSelect`, `HistoryEntryCard`,
  `StatsCard`, `PainTypeInfo`; `components/home/RotatingTips` + `LastEntryCard`.
- **Reuse data hooks**: `usePainEntries`, `usePainEntryForm`, `useActionOverlay`,
  `useToast`.
- **Reuse tokens**: `app/globals.css` + `tailwind.config.ts` (unchanged).
- **Inherit providers** from the existing root `app/layout.tsx` (QueryClient etc.)
  — no provider duplication.

### Component inventory (new, under `components/track/`)
| Component | Purpose |
|-----------|---------|
| `TrackShell` | Layout wrapper: centered `max-w-[430px]`, padding, **no BottomNav**. |
| `TrackHeader` | Title/date + a gear icon (Today) or a back arrow (sub-pages). |
| `TrackEntry` | Duplicate of `DailyEntry` minus app-nav; composes reused selectors; hosts the post-first-entry nudge. |
| `TrackSettings` | Backup/restore + export + history link + clear/delete. **No sign-out / Google / admin.** |
| `TrackHistory` | Duplicate of `History` with back nav; empty-state link points to `/track` (not `/`). |
| `RecoveryStatusCard` | Shows "Not backed up yet" (warning) or "Backed up ✓"; primary action opens the backup drawer. |
| `BackupNudgeBanner` | Dismissible banner shown after the first entry when not yet backed up. |
| `BackupDrawer` | Multi-step vaul bottom sheet: Intro → Reveal → Confirm. |
| `RecoveryCodeCard` | Displays the `XXXX-XXXX-XXXX` code in large mono type, with **Copy** and **Download .txt** actions. |
| `RestoreForm` | Passphrase input + Restore button; handles verifying/error/rate-limit states. |
| `SwitchAccountDialog` | AlertDialog warning when switching would orphan local entries. |

### Screen specs, states & wireframes

#### 1) Today (`/track`)
States: first-run (no entries) · normal · saving · post-first-entry nudge.

```
┌──────────────────────────────┐
│ MONDAY                    ⚙︎  │   ← gear → /track/settings
│ June 20, 2026                 │
│                               │
│ ┌──── Pain level ──────────┐  │
│ │   4        [ Moderate ]  │  │
│ │   ●──────slider──────    │  │
│ └──────────────────────────┘  │
│ Spine region  [Cervical][Lumbar]
│ [   Log today   ] [ Add details ]
│                               │
│ ⤵ (after 1st save, dismissible)│
│ ┌──────────────────────────┐  │
│ │ Save your data so you     │  │
│ │ don't lose it.   [Save] ✕ │  │ ← opens BackupDrawer
│ └──────────────────────────┘  │
│ Last entry · Tips             │
└──────────────────────────────┘
```

#### 2) Settings (`/track/settings`)
```
┌──────────────────────────────┐
│ ←  Settings                   │
│                               │
│ ┌─ Recovery ───────────────┐  │
│ │ ⚠ Not backed up yet       │  │  (or "✓ Backed up")
│ │ Save a recovery code to    │  │
│ │ sync & restore your data.  │  │
│ │ [ Save a recovery code ]   │  │ → BackupDrawer
│ │  Use a code from another   │  │ → /track/restore
│ │  device                    │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ View past entries      ›  │  │ → /track/history
│ │ ──────────────────────    │  │
│ │ Export CSV             ⤓  │  │
│ └──────────────────────────┘  │
│ ┌──────────────────────────┐  │
│ │ Clear all entries      🗑 │  │
│ │ ──────────────────────    │  │
│ │ Delete all data (danger)  │  │ → delete_user RPC
│ └──────────────────────────┘  │
│ Pain Tracker · Your data is yours
└──────────────────────────────┘
```

#### 3) Backup drawer (multi-step bottom sheet)
- **Step 1 — Intro:** what a recovery code is, that it enables sync/restore, and
  the **no-reset caveat**. Button: *Generate my code*.
- **Step 2 — Reveal:** `RecoveryCodeCard` shows the `XXXX-XXXX-XXXX` code; **Copy** and
  **Download .txt**. Calls `/api/recovery/create`; shows a spinner while creating.
- **Step 3 — Confirm:** checkbox *"I've saved my recovery code somewhere safe."*
  (enables **Done**). Optional hardening: ask the user to retype the code.
- Error state: creation failed → inline retry.

```
┌──────────────────────────────┐
│ ──                            │  (drag handle)
│ Save a recovery code          │
│ This is the ONLY way to get   │
│ your data back. There's no    │
│ email reset. Keep it safe.    │
│           [ Generate my code ]│
└──────────────────────────────┘
        ▼ (after generate)
┌──────────────────────────────┐
│ Your recovery code            │
│      K7QM - 3FPX - 9TPB       │  (large mono, grouped)
│ [ Copy ]   [ Download .txt ]  │
│ ☐ I've saved it somewhere safe│
│                     [ Done ]  │
└──────────────────────────────┘
```

#### 4) Restore (`/track/restore`)
States: idle · verifying · invalid-code · rate-limited · network-error ·
switch-warning · success.

```
┌──────────────────────────────┐
│ ←  Restore your data          │
│ Enter the recovery code       │
│ you saved.                    │
│ ┌──────────────────────────┐  │
│ │ K7QM-3FPX-9TPB            │  │  input
│ └──────────────────────────┘  │
│           [ Restore my data ] │
│ ! That code didn't match.     │  (error variants below)
└──────────────────────────────┘
```
- **invalid-code:** "That code didn't match. Check the words and try again."
- **rate-limited:** "Too many attempts. Please try again in ~{n} minutes."
- **network-error:** "Couldn't reach the server. Check your connection."
- **switch-warning** (via `SwitchAccountDialog`, only if the current anonymous
  session has ≥1 entry): "You have {n} entries on this device that aren't backed
  up. Restoring switches to your saved data and leaves these behind." Actions:
  *Back up these first* (→ BackupDrawer) · *Switch anyway*.
- **success:** redirect to `/track` + toast "Welcome back — your data is restored."

#### 5) History (`/track/history`)
Reuses `HistoryEntryCard` (collapse/expand/delete) exactly as the existing
screen; only the header gains a back arrow and the empty-state link points to
`/track`.

### User-facing copy (canonical strings)
- Nudge banner: **"Save your data so you don't lose it."** / button **"Save"**.
- Status (not backed up): **"Not backed up yet"** · sub: **"Save a recovery code
  to sync and restore your data on any device."**
- Status (backed up): **"Backed up ✓"** · sub: **"Use your recovery code to
  restore on another device."**
- Backup intro warning: **"This recovery code is the only way to get your data
  back — there's no email or password reset. Write it down or save it somewhere
  safe."**
- Confirm checkbox: **"I've saved my recovery code somewhere safe."**
- Restore prompt: **"Enter the recovery code you saved."**
- Delete confirm: **"This permanently deletes all your entries and your data.
  This can't be undone."**

### Accessibility & responsive
- Touch targets ≥ 44px (buttons are 52px, matching the app).
- Drawer and dialogs use the existing Radix/vaul primitives (focus trap, ESC,
  labelled). Passphrase grid words are selectable; Copy has an `aria-live`
  confirmation.
- Single-column, `max-w-[430px]`, safe-area insets respected — same as the app.
- Dark mode inherited from the shared tokens automatically.

## Supabase project settings (configuration, not code)
- Enable **Anonymous sign-ins**.
- Recommend enabling **CAPTCHA / Turnstile** on anonymous sign-in to prevent
  anonymous-user spam and database bloat.

## Database

New table only — no changes to `pain_entries` or its RLS policies:

```sql
-- One active recovery code per user (regenerating replaces the row).
create table public.recovery_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code_hash text not null,          -- bcrypt(recovery code)
  synthetic_email text not null,    -- used for signInWithPassword
  created_at timestamptz not null default now()
);

-- Supabase-backed rate limiting for the redeem endpoint (no extra infra).
create table public.recovery_redeem_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,            -- hashed client IP
  attempted_at timestamptz not null default now(),
  succeeded boolean not null default false
);
create index idx_redeem_attempts_ip_time
  on public.recovery_redeem_attempts(ip_hash, attempted_at);

-- Both tables: access only via service-role API routes; no client RLS grants.
```

## Security considerations
- The recovery code is the **only** key — there is no email reset. Show a prominent
  warning on generation and strongly nudge the user to save it.
- High entropy + **rate-limiting / backoff** on `/api/recovery/redeem`
  (brute-force protection) via the Supabase `recovery_redeem_attempts` table
  (per-hashed-IP fixed window + exponential backoff); store only `bcrypt(code)`;
  HTTPS only.
- Synthetic emails are never shown to users and will not match the admin
  allowlist, so anonymous users cannot become admins.

## Coexistence & edge cases (decide later)
- Optional future: allow an anonymous user to **upgrade to Google** (link
  accounts).
- Merging data between the two paths is **out of scope** unless requested.
- Account **deletion** for recovery-code users reuses the existing `delete_user`
  RPC.

## Testing
- New Playwright specs: anonymous bootstrap, create code, restore in a fresh
  browser context, rate-limit behavior, and isolation (no links to the existing
  app from `/track`). Existing Google E2E tests are untouched.

## Resolved implementation decisions

All previously-open items are now locked:

1. **Anonymous session bootstrap → middleware (server-side).** The `/track*`
   branch of the middleware mints the anonymous session
   (`signInAnonymously()`) and sets the auth cookies on the response when none
   exists, so the session is present before the first SSR render. Chosen over a
   client-side bootstrap to keep server components working without a hydration
   round-trip. No changes to how other routes are handled.

2. **UI → duplicate for `/track`, reuse the data layer.** The data layer
   (`hooks/use-pain-entries.ts`, `lib/data/pain-entries.ts`, Supabase clients) is
   reused unchanged. The presentational/nav UI is **duplicated** into
   `app/track/` self-contained components so the existing app is not modified and
   `/track` stays fully isolated. Accepted trade-off: some UI duplication; a
   future consolidation refactor is optional.

3. **Synthetic email → owned domain + admin auto-confirm.** Emails use
   `<uid>@anon.<owned-domain>` from `RECOVERY_SYNTHETIC_EMAIL_DOMAIN` (a domain
   the project controls) and are created with `email_confirm: true` so no
   confirmation email is ever sent and Supabase accepts the address.

4. **Rate-limiting → Supabase table (no new infra).** `/api/recovery/redeem`
   throttles via the `recovery_redeem_attempts` table: per-hashed-IP fixed window
   with exponential backoff. Avoids adding Upstash/Redis since Supabase is
   already present.

5. **Code regeneration & switching → defined behavior.**
   - **One active code per user**: `recovery_codes` is keyed by `user_id`;
     regenerating overwrites the password (admin API) and replaces the row, so
     the previous code is immediately invalid.
   - **Switching warning**: if the current session is an anonymous user with at
     least one local entry, the restore screen warns that switching leaves those
     un-backed-up entries behind before proceeding. Data merge/migration remains
     out of scope.

6. **Recovery code format → 12-char Crockford base32 (~60-bit).** Generated with
   a crypto-secure RNG (Node `crypto`), ambiguous characters (I, L, O, U, 0, 1)
   removed, displayed grouped as `XXXX-XXXX-XXXX`, accepted case-insensitively.
   No external wordlist dependency. ~60-bit is comfortably safe given bcrypt
   storage + redeem rate-limiting, and far friendlier than a 12-word phrase for a
   pain tracker.

### New environment variables
- `RECOVERY_SYNTHETIC_EMAIL_DOMAIN` — owned domain used for synthetic emails.
- (Existing `SUPABASE_SERVICE_ROLE_KEY` is reused by the recovery API routes.)

## Out of scope (per instruction)
- No edits to the Google OAuth flow.
- No RLS / schema changes beyond the additive `recovery_codes` table.
