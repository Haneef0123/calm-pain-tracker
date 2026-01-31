# CTO TECHNICAL EXECUTION PLAN - PART 4
## Deployment Checklist & Launch Plan

---

## PRE-LAUNCH CHECKLIST

### Environment Setup

#### Supabase Production
- [ ] Create production project
- [ ] Run database migrations
- [ ] Set up RLS policies
- [ ] Create database functions
- [ ] Test with sample data
- [ ] Configure auth providers (Google)
- [ ] Set up email templates
- [ ] Configure rate limiting

#### Stripe Production
- [ ] Create production account
- [ ] Create products (Pro Monthly, Pro Annual)
- [ ] Create prices
- [ ] Configure webhooks
- [ ] Test checkout flow
- [ ] Test subscription management
- [ ] Test cancellation flow
- [ ] Set up tax collection (if needed)

#### Vercel Production
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Set up custom domain (paindiary.app)
- [ ] Configure SSL certificate
- [ ] Set up preview deployments
- [ ] Configure build settings
- [ ] Test deployment

#### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxx

# App
NEXT_PUBLIC_APP_URL=https://paindiary.app

# Analytics (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=paindiary.app

# Error Tracking (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## DATABASE MIGRATION PLAN

### Step 1: Backup Current Data

```bash
# Backup production database
pg_dump $PROD_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Upload to S3 or similar
aws s3 cp backup_*.sql s3://paindiary-backups/
```

### Step 2: Run Migrations

```sql
-- Run in this order:
-- 1. Create shareable_reports table
-- 2. Create user_subscriptions table
-- 3. Create user_devices table
-- 4. Create analytics_events table
-- 5. Create database functions
-- 6. Create triggers
-- 7. Seed default subscriptions
```

### Step 3: Verify Migration

```sql
-- Check table counts
SELECT 'pain_entries' as table_name, COUNT(*) FROM pain_entries
UNION ALL
SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL
SELECT 'shareable_reports', COUNT(*) FROM shareable_reports
UNION ALL
SELECT 'user_devices', COUNT(*) FROM user_devices;

-- Verify RLS policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Test as user
SET request.jwt.claims.sub = '<test-user-id>';
SELECT * FROM pain_entries LIMIT 1;
```

---

## STRIPE CONFIGURATION

### Products & Prices

```bash
# Create Pro Monthly product
stripe products create \
  --name="Pain Diary Pro (Monthly)" \
  --description="Unlimited tracking, advanced trends, doctor sharing"

# Create Pro Monthly price
stripe prices create \
  --product=<product-id> \
  --unit-amount=499 \
  --currency=usd \
  --recurring[interval]=month

# Create Pro Annual product
stripe products create \
  --name="Pain Diary Pro (Annual)" \
  --description="Unlimited tracking, advanced trends, doctor sharing"

# Create Pro Annual price
stripe prices create \
  --product=<product-id> \
  --unit-amount=3900 \
  --currency=usd \
  --recurring[interval]=year
```

### Webhook Configuration

```bash
# Create webhook endpoint
stripe webhook_endpoints create \
  --url="https://paindiary.app/api/webhooks/stripe" \
  --enabled-events=checkout.session.completed \
  --enabled-events=customer.subscription.updated \
  --enabled-events=customer.subscription.deleted \
  --enabled-events=invoice.payment_succeeded \
  --enabled-events=invoice.payment_failed
```

### Test Webhook

```bash
# Forward webhooks to local dev
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

---

## TESTING PLAN

### Manual Testing Checklist

#### Authentication
- [ ] Sign up with Google
- [ ] Sign out
- [ ] Sign in again
- [ ] Protected routes redirect to sign-in
- [ ] Authenticated routes accessible

#### Core Features
- [ ] Create pain entry
- [ ] View history
- [ ] View trends
- [ ] Export CSV
- [ ] Delete entry
- [ ] Clear all entries

#### Subscription Flow
- [ ] Free tier works
- [ ] Upgrade to Pro (test mode)
- [ ] Access Pro features
- [ ] Manage subscription (portal)
- [ ] Cancel subscription
- [ ] Subscription expires correctly

#### Paywall Triggers
- [ ] 30-day history limit (free)
- [ ] Advanced trends locked (free)
- [ ] Report limit (free)
- [ ] Doctor sharing locked (free)
- [ ] All features unlocked (pro)

#### Doctor Sharing
- [ ] Create shareable report
- [ ] View shared report (logged out)
- [ ] Report expires correctly
- [ ] View count increments
- [ ] Password protection works

#### PDF Reports
- [ ] Generate PDF
- [ ] PDF contains correct data
- [ ] PDF formatting correct
- [ ] Download works

### Cross-Browser Testing
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (iOS)

### Performance Testing
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 2s
- [ ] Bundle size < 300KB

---

## MONITORING SETUP

### Error Tracking (Sentry)

```bash
yarn add @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### Analytics (Plausible)

```typescript
// app/layout.tsx
<Script
  defer
  data-domain="paindiary.app"
  src="https://plausible.io/js/script.js"
/>
```

### Uptime Monitoring

- [ ] Set up UptimeRobot or similar
- [ ] Monitor https://paindiary.app
- [ ] Monitor https://paindiary.app/api/health
- [ ] Alert on downtime

---

## LAUNCH DAY PLAN

### T-24 Hours
- [ ] Final code review
- [ ] Merge to main branch
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Test all critical flows
- [ ] Prepare Reddit post
- [ ] Prepare screenshots
- [ ] Record demo video

### T-12 Hours
- [ ] Double-check Stripe webhooks
- [ ] Verify database backups
- [ ] Test error monitoring
- [ ] Test analytics tracking
- [ ] Prepare support email
- [ ] Set up Discord/Slack for support

### T-1 Hour
- [ ] Final smoke test
- [ ] Check all environment variables
- [ ] Verify SSL certificate
- [ ] Test from mobile device
- [ ] Prepare to monitor logs

### Launch (Tuesday 8:00 AM EST)
- [ ] Post to r/Sciatica
- [ ] Monitor Reddit post (respond to comments)
- [ ] Monitor error logs (Sentry)
- [ ] Monitor analytics (Plausible)
- [ ] Monitor Stripe dashboard
- [ ] Monitor database performance

### T+2 Hours
- [ ] Check conversion metrics
- [ ] Respond to all comments
- [ ] Fix any critical bugs
- [ ] Update FAQ based on questions

### T+24 Hours
- [ ] Analyze Day 1 metrics
- [ ] Collect testimonials
- [ ] Plan Day 2 improvements
- [ ] Prepare cross-post to r/ChronicPain

---

## SUCCESS METRICS

### Day 1 Targets
- 1,000+ sign-ups
- 500+ first entries (50% activation)
- 50+ Pro trials started
- 20+ Pro conversions (40% trial-to-paid)
- $780 MRR ($39 × 20)

### Week 1 Targets
- 5,000 total sign-ups
- 2,000 active users (3+ entries)
- 100 Pro subscribers
- $3,900 MRR

### Month 1 Targets
- 20,000 total sign-ups
- 8,000 active users
- 500 Pro subscribers
- $19,500 MRR

### Month 3 Targets (Profitability)
- 50,000 total sign-ups
- 20,000 active users
- 1,500 Pro subscribers
- $58,500 MRR
- **$702,000 ARR**

---

## ROLLBACK PLAN

### If Critical Bug Found

```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous commit
git revert HEAD
git push origin main
```

### If Database Issue

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup_YYYYMMDD_HHMMSS.sql
```

### If Stripe Issue

- Disable webhook endpoint
- Manually process subscriptions
- Contact Stripe support

---

## POST-LAUNCH MONITORING

### Daily Checks (First Week)
- [ ] Error rate (Sentry)
- [ ] Sign-up rate
- [ ] Activation rate
- [ ] Conversion rate
- [ ] Churn rate
- [ ] Support tickets

### Weekly Checks
- [ ] MRR growth
- [ ] User retention
- [ ] Feature usage
- [ ] Performance metrics
- [ ] Database size
- [ ] Cost analysis

### Monthly Checks
- [ ] Revenue vs. costs
- [ ] LTV:CAC ratio
- [ ] Churn analysis
- [ ] Feature requests
- [ ] Roadmap planning

---

## COST BREAKDOWN

### Month 1 (1,000 users)
- Supabase: $0 (free tier)
- Vercel: $0 (free tier)
- Stripe: ~$50 (fees)
- Domain: $12/year
- **Total: ~$50/month**

### Month 3 (10,000 users)
- Supabase: $25/month
- Vercel: $20/month
- Stripe: ~$500 (fees)
- Plausible: $9/month
- Sentry: $26/month
- **Total: ~$580/month**

### Month 6 (50,000 users)
- Supabase: $100/month
- Vercel: $20/month
- Stripe: ~$2,500 (fees)
- Plausible: $19/month
- Sentry: $80/month
- Support: $2,000/month (part-time)
- **Total: ~$4,720/month**

**Profit at Month 6:** $58,500 - $4,720 = **$53,780/month**

---

## EMERGENCY CONTACTS

### Technical Issues
- Supabase Support: support@supabase.io
- Vercel Support: support@vercel.com
- Stripe Support: support@stripe.com

### On-Call Rotation
- Week 1: CTO (you)
- Week 2: CTO (you)
- Week 3+: Hire support engineer

---

## FINAL CHECKLIST

### Before Posting to Reddit
- [ ] All features tested
- [ ] No critical bugs
- [ ] Error monitoring active
- [ ] Analytics tracking
- [ ] Stripe webhooks verified
- [ ] Database backups configured
- [ ] Support email ready
- [ ] Demo video uploaded
- [ ] Screenshots prepared
- [ ] Reddit post written
- [ ] Response templates ready

### Launch Readiness
- [ ] Team briefed
- [ ] Monitoring dashboards open
- [ ] Support channels ready
- [ ] Rollback plan documented
- [ ] Celebration champagne chilled 🍾

---

**YOU'RE READY TO LAUNCH. LET'S MAKE $780 MRR ON DAY 1.**
