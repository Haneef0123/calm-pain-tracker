# CTO Technical Execution Plan
## Day-One Profitability Blueprint (Architecture -> Outcomes)

This document is the single source of truth for building PainMap into a revenue-generating product with minimal ambiguity for AI-assisted implementation.

## 1) Executive Intent

### Primary objective
Launch a monetized version of PainMap that can generate paid conversions on day one.

### Business principle
Do not optimize for feature count. Optimize for paid value delivery at the highest-intent moment:
- User needs proof for a doctor, claim, or treatment decision.
- App must convert that intent into an immediate paid action.

### Non-negotiable outcomes (first launch)
1. Users can pay without friction.
2. Paid entitlements are enforced.
3. Paid users receive clear, concrete premium value.
4. Revenue, activation, and conversion are measurable.

## 2) Current State (Codebase Reality)

### Implemented today
- Auth: Google OAuth via Supabase.
  - `app/sign-in/page.tsx`
  - `components/providers/auth-provider.tsx`
  - `lib/supabase/middleware.ts`
- Core tracking: create/read/update/delete entries.
  - `components/pages/DailyEntry.tsx`
  - `hooks/use-pain-entries.ts`
  - `components/pages/History.tsx`
  - `components/pain/HistoryEntryCard.tsx`
- Trend analysis UI (7d, 30d, all) currently unrestricted.
  - `components/pages/Trends.tsx`
  - `components/pain/TimeRangeSelector.tsx`
- CSV export in Settings.
  - `components/pages/Settings.tsx`
  - `hooks/use-pain-entries.ts`
- Build/lint baseline is healthy.

### Not implemented (critical revenue gaps)
- No Stripe dependency, checkout, billing portal, or webhooks.
- No subscription table access in runtime code.
- No paywall logic or entitlement checks.
- No report/PDF/share flow (core paid value proposition).
- No pricing page/upgrade funnel route.
- No production analytics events tied to conversion funnel.

Conclusion: Product foundation exists. Monetization engine does not.

## 3) Profit Strategy

### Monetization thesis
Free tier proves value quickly; paid tier unlocks outcomes users pay for:
- Longer trend windows for treatment pattern clarity.
- Doctor-ready report output.
- Shareable report links.

### Initial pricing model
- Free: daily logging, history, 7-day trends, CSV export.
- Pro: $39/year preferred anchor (or $4.99/month), includes:
  - 30d/90d/all-time trends
  - PDF report generation
  - Shareable doctor report links
  - Priority support (email SLA target)

### Day-one conversion triggers
1. User taps 30-day or all-time trend.
2. User taps "Generate doctor report".
3. User taps "Create share link".
4. User reaches free report limit (if introduced).

## 4) Audience and Product Positioning

### Priority audience segments
1. Sciatica/lower-back chronic pain users with upcoming appointments.
2. Users applying for insurance/disability evidence.
3. PT/chiro-guided recovery users tracking adherence and triggers.

### Jobs to be done
- "Help me show objective pain history quickly."
- "Help me find patterns I can act on."
- "Help me avoid being dismissed because my data is vague."

### Positioning line
"Track your pain daily, generate doctor-ready evidence in minutes, and carry your history across every device."

## 5) Target Architecture

### Architecture goals
- Keep existing Next.js + Supabase foundation.
- Add Stripe and reporting workflows with minimal churn.
- Preserve performance and client responsiveness.

### High-level system design
```text
Client (Next.js app routes + React Query)
  -> Next.js API routes (checkout, portal, reports, webhooks)
    -> Stripe (subscriptions, invoices, portal)
    -> Supabase Postgres (entries, subscriptions, reports, events)

Shared auth context:
  Supabase JWT/cookies

Entitlement source of truth:
  user_subscriptions table updated by Stripe webhooks
```

### Runtime components
- Web app: Next.js App Router.
- Database/Auth: Supabase.
- Payments: Stripe Checkout + Billing Portal + Webhooks.
- Reporting: server-generated report payload + client/server PDF generation.
- Analytics: event table and/or external provider (Plausible/PostHog) in phase 2.

## 6) Data Architecture

## 6.1 Existing table assumptions
`pain_entries` exists and is protected by RLS.

## 6.2 New tables

### `user_subscriptions`
Purpose: entitlement state for feature gating.

```sql
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
```

RLS:
```sql
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_subscription"
ON user_subscriptions FOR SELECT
USING (auth.uid() = user_id);
```

### `shareable_reports`
Purpose: doctor-share links and report metadata.

```sql
CREATE TABLE IF NOT EXISTS shareable_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Pain Report',
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  payload JSONB NOT NULL,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shareable_reports_user_id ON shareable_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_shareable_reports_share_token ON shareable_reports(share_token);
CREATE INDEX IF NOT EXISTS idx_shareable_reports_expires_at ON shareable_reports(expires_at);
```

RLS:
```sql
ALTER TABLE shareable_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_own_reports"
ON shareable_reports FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public_select_by_token"
ON shareable_reports FOR SELECT
USING (expires_at IS NULL OR expires_at > now());
```

### `analytics_events`
Purpose: deterministic product funnel tracking.

```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_props JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
```

## 6.3 DB functions and triggers
- `touch_updated_at()` trigger for mutable tables.
- `increment_report_view_count(token uuid)` RPC.
- Seed subscriptions for existing users:
```sql
INSERT INTO user_subscriptions (user_id, plan_type, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions);
```

## 7) API Contract Plan

All API routes must return typed JSON and consistent error shape:
```json
{ "error": { "code": "STRING_CODE", "message": "Human-readable" } }
```

### 7.1 `POST /api/create-checkout-session`
Auth required.

Request:
```json
{ "priceId": "price_xxx", "successPath": "/settings?upgraded=1", "cancelPath": "/pricing?canceled=1" }
```

Response:
```json
{ "url": "https://checkout.stripe.com/c/..." }
```

Validation:
- `priceId` must match allowlisted env values.
- User must be authenticated.

### 7.2 `POST /api/create-portal-session`
Auth required.

Request:
```json
{}
```

Response:
```json
{ "url": "https://billing.stripe.com/p/session/..." }
```

Precondition:
- `stripe_customer_id` exists for user.

### 7.3 `POST /api/webhooks/stripe`
No user auth; Stripe signature verified.

Handled events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- optional: `invoice.payment_failed`, `invoice.paid`

Behavior:
- Upsert `user_subscriptions` atomically by `stripe_subscription_id`.
- Idempotent by `event.id` (persist processed event ids or rely on deterministic upsert).

### 7.4 `POST /api/reports/create`
Auth required and Pro entitlement required.

Request:
```json
{ "dateStart": "2026-01-01", "dateEnd": "2026-01-31", "title": "January Summary", "expiresInDays": 30, "password": "optional" }
```

Response:
```json
{ "reportId": "uuid", "shareToken": "uuid", "shareUrl": "https://app/share/<token>" }
```

### 7.5 `GET /api/reports/share/[token]`
Public token access; optional password challenge.

Response:
```json
{ "title": "...", "dateStart": "...", "dateEnd": "...", "summary": { "avgPain": 4.2, "worst": 8, "best": 1 }, "entries": [...] }
```

### 7.6 `POST /api/reports/pdf`
Auth required and Pro required.

Request:
```json
{ "dateStart": "2026-01-01", "dateEnd": "2026-01-31", "template": "summary|detailed" }
```

Response:
- Binary PDF stream (`application/pdf`) or signed download URL.

## 8) Frontend Architecture Plan

## 8.1 New routes
- `/pricing`
- `/share/[token]`
- optional `/reports`

## 8.2 New hooks
- `hooks/use-subscription.ts`
  - Fetches `user_subscriptions`.
  - Exposes `isPro`, `isTrialing`, `status`, `planType`.
- `hooks/use-paywall.ts`
  - Central policy checks for features.
  - Returns `{ allowed, reason, cta }`.
- `hooks/use-checkout.ts`
  - Calls checkout API and redirects.

## 8.3 New components
- `components/subscription/UpgradeDialog.tsx`
- `components/subscription/SubscriptionBadge.tsx`
- `components/subscription/ManageSubscriptionButton.tsx`
- `components/reports/ReportGenerator.tsx`
- `components/reports/ShareReportDialog.tsx`

## 8.4 Integration points in existing pages
- `components/pages/Trends.tsx`
  - Gate `30d` and `all` based on subscription.
  - Show lock CTA when blocked.
- `components/pages/Settings.tsx`
  - Add "Upgrade to Pro" and "Manage subscription".
  - Add "Generate doctor report" CTA.
- `components/layout/BottomNav.tsx`
  - Optional pricing link/entry point if needed.

## 9) Product Requirements by Feature

## 9.1 Feature A: Pricing + Upgrade Funnel (must-have)

User story:
- As a free user, I can clearly understand paid value and upgrade in under 2 clicks.

Requirements:
- Add `/pricing` with free vs pro comparison.
- CTA buttons:
  - `Start Pro (Annual)`
  - `Start Pro (Monthly)`
- Handle success/cancel query params and show toasts.

Acceptance criteria:
- Pricing page loads in <2.5s on 4G.
- Checkout session creation succeeds for authenticated users.
- Failed checkout returns actionable error messaging.

## 9.2 Feature B: Entitlement and Paywall (must-have)

User story:
- As a free user, restricted features clearly explain why locked and how to unlock.

Requirements:
- Centralized policy table:
  - `advanced_trends`: pro
  - `doctor_report`: pro
  - `share_report`: pro
- Lock behavior:
  - Disable action + show dialog.
  - Track event `paywall_viewed`.

Acceptance criteria:
- Free user cannot access gated APIs.
- Pro user bypasses all relevant locks.
- Entitlement state updates within one refresh after successful payment/webhook.

## 9.3 Feature C: Doctor-Ready Reports (must-have)

User story:
- As a Pro user, I can generate a concise report for a clinician.

Requirements:
- Report templates:
  - Summary: averages, worst/best, timeline graph, key notes.
  - Detailed (phase 2): entry table with annotations.
- Export as PDF.
- Include generation timestamp and date range.

Acceptance criteria:
- Report generates from selected date range with no empty-section failures.
- PDF size <2MB for average 90-day report.

## 9.4 Feature D: Shareable Report Link (should-have for day-one; must-have for week 1)

User story:
- As a Pro user, I can send a secure link to a doctor.

Requirements:
- Tokenized share URL.
- Optional expiry (7/30/90 days).
- Optional password.
- View count increment.

Acceptance criteria:
- Expired links return friendly invalid/expired page.
- Password-protected links reject incorrect password.

## 10) Delivery Plan and Sequencing

## 10.1 Phase breakdown

### Phase 0 (half day): foundation hardening
- Add env var schema validation at startup.
- Add shared error response utility.
- Add typed constants for plan/feature flags.

### Phase 1 (day 1): monetization rail
- Install Stripe deps.
- Build checkout session API.
- Build pricing page.
- Add upgrade CTA from Settings.

Exit criteria:
- Test user can pay through Stripe checkout link flow.

### Phase 2 (day 2): entitlement enforcement
- Add `user_subscriptions` reads.
- Add webhook route and DB upsert logic.
- Add paywall checks on Trends and report actions.

Exit criteria:
- Free user blocked, Pro user allowed, webhook updates state.

### Phase 3 (day 3-4): premium value delivery
- Build report generation and PDF export.
- Build shareable report route and storage.

Exit criteria:
- Pro user can produce and share doctor-ready report.

### Phase 4 (day 5): instrumentation and launch polish
- Add funnel event tracking.
- Add support copy and fallback handling.
- Smoke-test full conversion journey.

Exit criteria:
- Metrics pipeline captures signup -> paywall -> checkout -> paid conversion.

## 10.2 Detailed file implementation map

Create/modify:
- `lib/stripe/server.ts` (new)
- `lib/stripe/config.ts` (new)
- `app/api/create-checkout-session/route.ts` (new)
- `app/api/create-portal-session/route.ts` (new)
- `app/api/webhooks/stripe/route.ts` (new)
- `app/pricing/page.tsx` (new)
- `app/share/[token]/page.tsx` (new)
- `hooks/use-subscription.ts` (new)
- `hooks/use-paywall.ts` (new)
- `components/subscription/UpgradeDialog.tsx` (new)
- `components/reports/ReportGenerator.tsx` (new)
- `components/pages/Trends.tsx` (modify)
- `components/pages/Settings.tsx` (modify)
- `types/subscription.ts` (new)
- `types/report.ts` (new)

## 11) Testing and QA Strategy

## 11.1 Automated test coverage targets
- Unit:
  - paywall policy matrix
  - subscription status mapping
  - report aggregation math
- API integration:
  - checkout route auth/validation
  - webhook signature + idempotency
  - report create/read permissions
- E2E:
  - free user blocked on advanced trends
  - upgrade flow redirects to checkout
  - post-upgrade access unlocked
  - report generate and share view

## 11.2 Manual launch checklist
1. New free signup and first entry creation.
2. Trigger paywall from Trends.
3. Complete Stripe checkout in test mode.
4. Verify subscription row updated.
5. Verify blocked feature unlock.
6. Generate report PDF.
7. Open share link in incognito.
8. Cancel subscription in portal and verify status transition.

## 12) Security, Privacy, and Compliance Controls

### Mandatory controls for launch
- Verify Stripe webhook signature for every webhook request.
- Restrict API endpoints to authenticated users where applicable.
- Enforce entitlements in backend endpoints, not just UI.
- Use hashed passwords for share links (never plain text).
- Add rate limiting on public share endpoint.

### Recommended controls (week 2)
- CSP headers.
- Sentry error tracking with PII redaction.
- Audit logging for account deletion/report access.

## 13) Performance and Reliability Controls

- Keep chart/report heavy components code-split.
- Cache non-sensitive report aggregates where safe.
- Avoid extra Supabase auth calls inside hot paths.
- Maintain optimistic UX in entry creation flow.
- Add timeout + retry policy for network-sensitive operations.

SLOs for launch:
- Checkout API p95 < 700ms (excluding Stripe redirect).
- Report generation p95 < 2.5s for 90-day range.
- App route navigation p95 < 1.0s on cached routes.

## 14) Instrumentation Plan (Outcomes)

Track these events consistently:
- `signup_completed`
- `first_entry_logged`
- `paywall_viewed`
- `checkout_started`
- `checkout_completed`
- `pro_entitlement_activated`
- `report_generated`
- `report_shared`

Daily KPI dashboard (required):
- New signups
- Activation rate (first entry within 24h)
- Paywall view rate
- Checkout start rate
- Checkout completion rate
- Trial-to-paid (if trial used)
- ARPU and MRR

## 15) Financial Operating Model (Day-One Focus)

Baseline assumptions for first 1000 visitors:
- Signup conversion: 20-30%
- Activation: 45-60% of signups
- Paywall exposure: 35-50% of activated users
- Checkout start: 8-15% of paywall viewers
- Checkout completion: 30-50% of checkout starts

Illustrative expected range:
- 1000 visitors -> 250 signups -> 125 activated -> 50 paywall viewers -> 6 checkout starts -> 2-3 paid
- At $39 annual, day-one recognized revenue is small but validates willingness-to-pay.
- Objective is not absolute day-one MRR size; objective is positive unit economics trend and repeatable conversion mechanics.

## 16) Launch Governance and AI Implementation Rules

### Implementation order is mandatory
Do not parallelize features that depend on unresolved entitlement data contracts.

Order:
1. DB + types
2. Billing APIs + webhook
3. subscription hook
4. paywall integration
5. report APIs
6. report UI/share UI
7. analytics + polish

### Definition of done for each PR
- Typed interfaces included.
- Loading/error states implemented.
- API auth/validation complete.
- Test coverage added or updated.
- Telemetry events emitted.
- No lint/build/type errors.

### Branch and PR standards
- Branch prefix: `codex/`.
- One feature slice per PR when possible.
- PR body includes:
  - scope
  - risks
  - test evidence
  - migration notes
  - rollback notes

## 17) Risk Register and Mitigation

1. Stripe webhook misconfiguration
- Mitigation: test mode webhook replay + signature verification tests.

2. Entitlement drift (paid but still locked)
- Mitigation: source entitlement from DB only; add manual resync admin script.

3. Report performance degradation
- Mitigation: cap max date range initially (e.g., 365 days), optimize query indexes.

4. Conversion underperformance
- Mitigation: sharpen paywall copy, reduce plan confusion, test annual-first layout.

## 18) Rollback and Incident Plan

Rollback priorities:
1. Keep logging/tracking core always online.
2. Disable paywalled report feature if unstable.
3. Keep checkout button visible only if API health checks pass.

Incident playbook:
- Severity 1: payment failures widespread -> disable upgrade CTA and show status banner.
- Severity 2: report generation failures -> fallback to CSV + "report unavailable" notice.

## 19) Final Build Checklist

Technical
- [ ] Stripe keys configured in environment.
- [ ] Migrations applied and verified.
- [ ] Webhook endpoint active in Stripe dashboard.
- [ ] Pricing page and checkout flow tested.
- [ ] Entitlement gating verified on UI and API.
- [ ] Report generation + share link tested.
- [ ] Lint/build/tests green.

Business
- [ ] Offer messaging finalized.
- [ ] Pricing copy and FAQ finalized.
- [ ] Support contact path active.
- [ ] Conversion dashboard visible daily.

Outcome
- [ ] First successful paid conversion captured.
- [ ] Funnel metrics reviewed within 24 hours.
- [ ] Next optimization experiment queued.

## 20) Immediate Next Actions (Execution Start)

1. Implement `user_subscriptions` schema + seed data.
2. Ship Stripe checkout session endpoint and `/pricing` page.
3. Add `use-subscription` + paywall in `Trends`.
4. Add report generation endpoint and premium CTA in `Settings`.
5. Enable webhook and validate entitlement updates end-to-end.

This is the authoritative implementation blueprint. If any future plan conflicts with this document, this document takes precedence unless explicitly superseded by a newer version.
