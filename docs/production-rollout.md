# Login-free `/track` — Production Rollout Checklist

> Run through this checklist top-to-bottom before merging to `main` / triggering a Vercel production deploy.

---

## 1. Supabase — production project setup

### 1a. Apply the migration

```sh
# Point the CLI at your production project
supabase link --project-ref <your-prod-project-ref>

# Run all pending migrations (additive — existing tables are untouched)
supabase db push
```

Expected result: two new tables exist in the production database:
- `public.recovery_codes` (with RLS enabled)
- `public.recovery_redeem_attempts` (with RLS enabled)

Verify with:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('recovery_codes', 'recovery_redeem_attempts');
```

### 1b. Enable Anonymous sign-ins

1. Open the Supabase dashboard → **Authentication** → **Providers**
2. Find **Anonymous** and toggle it **on**
3. Save

Without this, `/track` will redirect users instead of creating an anonymous session.

### 1c. Add RLS policies (if not already applied)

The migration creates the tables with RLS enabled but no policies — anonymous users access data through the **service role** (server-side API routes only, never the browser client). Confirm no direct browser writes reach these tables.

---

## 2. Vercel — environment variables

Add or verify the following in **Vercel → Project → Settings → Environment Variables** for the **Production** environment:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role key |
| `RECOVERY_SYNTHETIC_EMAIL_DOMAIN` | A domain you control, e.g. `anon.yourdomain.com` |

**Important — `RECOVERY_SYNTHETIC_EMAIL_DOMAIN`:**
- Must be a real domain you own so Supabase accepts it as an email domain.
- Supabase will NOT send any email to this domain (we pass `email_confirm: true` via the admin API), but it must be syntactically valid.
- Recommended: use a subdomain like `anon.painmap.app` — no DNS record needed, just ownership.

After adding variables, trigger a **Redeploy** for them to take effect.

---

## 3. Smoke test in production

Run through the core flows after deploy:

### Anonymous tracking
- [ ] Visit `https://yourdomain.com/track` in a fresh incognito window
- [ ] No sign-in redirect — pain logger appears
- [ ] Log a pain entry → entry saves and persists on reload

### Backup
- [ ] Go to `/track/settings` → "Save your recovery code"
- [ ] Generate a code → displayed in `XXXX-XXXX-XXXX` format
- [ ] Copy / Download the code
- [ ] Confirm nudge banner disappears after backup

### Restore
- [ ] Open `/track/restore` in a second incognito window
- [ ] Enter the code → redirects to `/track` and shows the original entries
- [ ] Enter a wrong code → "That code didn't match" error
- [ ] Enter wrong code 5× → rate-limited message

### Existing app unaffected
- [ ] `https://yourdomain.com/` still requires Google sign-in
- [ ] No `/track` links appear in the main app
- [ ] Sign-in page shows "Try without signing in →" link

---

## 4. Entry point

The `/track` URL is surfaced on the sign-in page (`app/sign-in/page.tsx`) as:

> **Try without signing in →**

Additional entry points to consider (outside this codebase):
- Link in marketing copy / landing page
- QR code on physical materials
- Direct URL share: `https://yourdomain.com/track`

---

## 5. Post-launch monitoring

Watch for these in Supabase logs / Vercel logs after launch:

| Signal | What to check |
|--------|--------------|
| Anonymous sign-in rate | Supabase → Auth → Users (filter `is_anonymous = true`) |
| Recovery code creation | `recovery_codes` row count growing |
| Failed redeem attempts | `recovery_redeem_attempts` where `succeeded = false` |
| Rate limit hits | `recovery_redeem_attempts` grouped by `ip_hash`, count ≥ 5 in 15 min |
| 500 errors on `/api/recovery/*` | Vercel function logs |

---

## 6. Rollback plan

All changes are **additive** — removing the feature requires no data migration:

1. Set `RECOVERY_SYNTHETIC_EMAIL_DOMAIN` to empty in Vercel → the create route returns 500 (safe fail, no data loss)
2. Remove the `/track` middleware branch in `lib/supabase/middleware.ts` to re-enable the sign-in redirect
3. The `recovery_codes` and `recovery_redeem_attempts` tables can be dropped at any time — they are isolated from `pain_entries`
