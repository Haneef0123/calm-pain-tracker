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

Therefore the design is **anonymous-first with a recovery passphrase** as the
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
| **Chosen** | **Anonymous-first + recovery passphrase (B + E)** | Meets all requirements, keeps RLS unchanged |

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
1. If there is no session, silently call `signInAnonymously()`.
2. The app is usable immediately — **no login UI**.
3. Pain entries save to the cloud under the anonymous `user_id`.

### Recovery passphrase (the crux)

Implemented with **standard Supabase auth only** — no RLS changes:

1. **Generate** a high-entropy passphrase (recommend ~12 BIP39-style words,
   ≈128-bit; memorable and writable).
2. **Back up** (new server API route, service-role): convert the anonymous
   account into a permanent one by setting a **synthetic, non-user-facing email**
   derived from the user id (e.g. `<uid>@anon.local`) with the **passphrase as
   the password**; store `bcrypt(passphrase) -> email` in a new `recovery_codes`
   table.
3. **Restore** on any device (`/track/restore`): user enters the passphrase ->
   server looks up the email by hash -> `signInWithPassword(email, passphrase)`
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
- `app/track/page.tsx` — login-free landing + anonymous bootstrap.
- `app/track/restore/page.tsx` — restore-with-code screen.
- `app/track/layout.tsx` — self-contained layout/nav (no links to existing app).
- `app/api/recovery/create/route.ts` — generate code, set synthetic credentials,
  store hash.
- `app/api/recovery/redeem/route.ts` — verify code, sign in, set cookies
  (rate-limited).
- `supabase/migrations/<timestamp>_recovery_codes.sql` — new `recovery_codes`
  table.
- New UI components for the backup-code modal and the restore form.

### Minimal additive touchpoints to existing files (no behavior replaced)
- `middleware.ts` / `lib/supabase/middleware.ts` — **add** `/track*` and
  `/api/recovery/*` to the public allowlist so the auth wall does not redirect
  them. Existing Google redirect logic for every other route is untouched. This
  is the one unavoidable additive edit.

## Supabase project settings (configuration, not code)
- Enable **Anonymous sign-ins**.
- Recommend enabling **CAPTCHA / Turnstile** on anonymous sign-in to prevent
  anonymous-user spam and database bloat.

## Database

New table only — no changes to `pain_entries` or its RLS policies:

```sql
create table public.recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,          -- bcrypt(passphrase)
  synthetic_email text not null,    -- used for signInWithPassword
  created_at timestamptz not null default now()
);
create index idx_recovery_codes_user_id on public.recovery_codes(user_id);
-- Access only via service-role API routes; no client RLS access granted.
```

## Security considerations
- The passphrase is the **only** key — there is no email reset. Show a prominent
  warning on generation and strongly nudge the user to save it.
- High entropy + **rate-limiting / backoff** on `/api/recovery/redeem`
  (brute-force protection); store only `bcrypt(code)`; HTTPS only.
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

## Open implementation questions / risks to resolve before build

These are design-level decisions that are not yet locked and should be settled
before writing code:

1. **Anonymous session bootstrap (SSR vs client).** The existing app renders
   server components that read the session via `getSession()`, but
   `signInAnonymously()` is a client-side call. `/track` needs a defined order:
   either (a) a client bootstrap that creates the anon session then hydrates the
   page, or (b) a server route handler that mints the anonymous session and sets
   cookies before the first SSR. Recommend (b) for clean SSR.
2. **Reuse vs. duplicate the tracker UI.** To satisfy the isolation requirement,
   any existing tracker/history/settings components reused by `/track` must not
   carry the existing app's navigation or links to `/sign-in`. This likely means
   extracting "chrome-free" shared components or duplicating the relevant UI for
   `/track`. Decide reuse-by-refactor vs duplicate.
3. **Synthetic email validity.** Supabase may reject an invalid email domain.
   Use a real, owned domain (not `@anon.local`) and auto-confirm via the admin
   API (`email_confirm: true`) so no confirmation email is sent.
4. **Rate-limiting store.** Vercel functions are stateless, so throttling
   `/api/recovery/redeem` requires an external store (e.g. Upstash/Redis) or a
   Supabase-backed attempt counter. Pick one.
5. **Code regeneration & code-switching edge cases.**
   - Regenerating a recovery code must invalidate the previous one (overwrite the
     password and the stored hash).
   - Entering a *different* code on a device that already has local anonymous
     entries will orphan those entries (they remain under the old anon user).
     The restore screen must warn before switching.
6. **BIP39 wordlist dependency.** A memorable passphrase needs a wordlist library
   (e.g. a BIP39 package). Confirm this dependency is acceptable.

## Out of scope (per instruction)
- No edits to the Google OAuth flow.
- No RLS / schema changes beyond the additive `recovery_codes` table.
