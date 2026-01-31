# CTO TECHNICAL EXECUTION PLAN - PART 2
## Database Schema Design

---

## CURRENT SCHEMA (Inferred from Code)

```sql
-- pain_entries table
CREATE TABLE pain_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pain_level INTEGER NOT NULL CHECK (pain_level >= 0 AND pain_level <= 10),
  locations TEXT[] NOT NULL DEFAULT '{}',
  types TEXT[] NOT NULL DEFAULT '{}',
  radiating BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pain_entries_user_id ON pain_entries(user_id);
CREATE INDEX idx_pain_entries_timestamp ON pain_entries(timestamp DESC);
CREATE INDEX idx_pain_entries_user_timestamp ON pain_entries(user_id, timestamp DESC);

-- RLS policies
ALTER TABLE pain_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entries"
  ON pain_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON pain_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
  ON pain_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON pain_entries FOR DELETE
  USING (auth.uid() = user_id);
```

---

## NEW SCHEMA REQUIREMENTS

### 1. Shareable Reports Table

```sql
CREATE TABLE shareable_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,
  password_hash TEXT, -- Optional password protection
  expires_at TIMESTAMPTZ NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shareable_reports_user_id ON shareable_reports(user_id);
CREATE INDEX idx_shareable_reports_share_token ON shareable_reports(share_token);
CREATE INDEX idx_shareable_reports_expires_at ON shareable_reports(expires_at);

-- RLS for shareable reports
ALTER TABLE shareable_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reports"
  ON shareable_reports FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view with valid token"
  ON shareable_reports FOR SELECT
  USING (expires_at > NOW());
```

### 2. User Subscriptions Table

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- RLS for subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only backend can modify subscriptions (via service role)
```

### 3. User Devices Table

```sql
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT, -- "iPhone 13", "MacBook Pro", etc.
  device_type TEXT, -- "mobile", "tablet", "desktop"
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_last_seen ON user_devices(last_seen_at DESC);

-- RLS for devices
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON user_devices FOR UPDATE
  USING (auth.uid() = user_id);
```

### 4. Analytics Events Table

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_properties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- No RLS - analytics are internal only (accessed via service role)
```

---

## DATABASE FUNCTIONS

### Check if User is Pro

```sql
CREATE OR REPLACE FUNCTION is_pro_user(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = check_user_id
    AND plan_type IN ('pro', 'enterprise')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Get Entry Count for Date Range

```sql
CREATE OR REPLACE FUNCTION get_entry_count_for_range(
  check_user_id UUID,
  days_back INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM pain_entries
    WHERE user_id = check_user_id
    AND timestamp > NOW() - (days_back || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Enforce Free Tier Limits

```sql
CREATE OR REPLACE FUNCTION enforce_free_tier_limits()
RETURNS TRIGGER AS $$
DECLARE
  is_pro BOOLEAN;
BEGIN
  -- Check if user is Pro
  is_pro := is_pro_user(NEW.user_id);
  
  IF NOT is_pro THEN
    -- Free tier: only keep last 30 days
    DELETE FROM pain_entries
    WHERE user_id = NEW.user_id
    AND timestamp < NOW() - INTERVAL '30 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce limits on insert
CREATE TRIGGER enforce_free_tier_on_insert
  AFTER INSERT ON pain_entries
  FOR EACH ROW
  EXECUTE FUNCTION enforce_free_tier_limits();
```

### Track Report Views

```sql
CREATE OR REPLACE FUNCTION increment_report_view_count(token UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shareable_reports
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE share_token = token
  AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## MIGRATION STRATEGY

### Step 1: Create New Tables (Non-Breaking)

```sql
-- Run these migrations in order
-- 1. Create shareable_reports
-- 2. Create user_subscriptions
-- 3. Create user_devices
-- 4. Create analytics_events
```

### Step 2: Create Functions & Triggers

```sql
-- 1. Create is_pro_user function
-- 2. Create get_entry_count_for_range function
-- 3. Create enforce_free_tier_limits function
-- 4. Create trigger on pain_entries
-- 5. Create increment_report_view_count function
```

### Step 3: Seed Default Subscriptions

```sql
-- Give all existing users free tier subscription
INSERT INTO user_subscriptions (user_id, plan_type, status)
SELECT id, 'free', 'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions);
```

### Step 4: Test RLS Policies

```sql
-- Test as authenticated user
SET request.jwt.claims.sub = '<test-user-id>';

-- Should return only user's data
SELECT * FROM pain_entries;
SELECT * FROM user_subscriptions;
SELECT * FROM user_devices;

-- Should work
INSERT INTO pain_entries (...) VALUES (...);

-- Should fail (wrong user_id)
INSERT INTO pain_entries (user_id, ...) VALUES ('<other-user-id>', ...);
```

---

## BACKUP & ROLLBACK PLAN

### Before Migration

```bash
# Backup production database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Test migration on staging
psql $STAGING_DATABASE_URL < migration.sql
```

### Rollback Script

```sql
-- If something goes wrong, rollback:
DROP TRIGGER IF EXISTS enforce_free_tier_on_insert ON pain_entries;
DROP FUNCTION IF EXISTS enforce_free_tier_limits();
DROP FUNCTION IF EXISTS increment_report_view_count(UUID);
DROP FUNCTION IF EXISTS get_entry_count_for_range(UUID, INTEGER);
DROP FUNCTION IF EXISTS is_pro_user(UUID);
DROP TABLE IF EXISTS analytics_events;
DROP TABLE IF EXISTS user_devices;
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS shareable_reports;
```

---

## PERFORMANCE OPTIMIZATION

### Query Optimization

```sql
-- Explain analyze critical queries
EXPLAIN ANALYZE
SELECT * FROM pain_entries
WHERE user_id = '<user-id>'
ORDER BY timestamp DESC
LIMIT 100;

-- Should use idx_pain_entries_user_timestamp
```

### Index Monitoring

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Vacuum & Analyze

```sql
-- Run after large data changes
VACUUM ANALYZE pain_entries;
VACUUM ANALYZE user_subscriptions;
```

---

## SECURITY CONSIDERATIONS

### RLS Testing Checklist

- [ ] Users can only see their own pain entries
- [ ] Users can only see their own subscription
- [ ] Users can only see their own devices
- [ ] Shared reports are accessible with valid token
- [ ] Expired reports are not accessible
- [ ] Analytics events are not accessible to users

### SQL Injection Prevention

- ✅ Using parameterized queries (Supabase client)
- ✅ RLS policies prevent unauthorized access
- ✅ Input validation in application layer

### Data Encryption

- ✅ Encryption at rest (Supabase default)
- ✅ Encryption in transit (HTTPS)
- ⚠️ Consider encrypting sensitive notes (future)

---

## MONITORING QUERIES

### Active Subscriptions

```sql
SELECT 
  plan_type,
  status,
  COUNT(*) as count
FROM user_subscriptions
GROUP BY plan_type, status;
```

### Daily Sign-ups

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as signups
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Conversion Rate

```sql
SELECT 
  (SELECT COUNT(*) FROM user_subscriptions WHERE plan_type = 'pro') * 100.0 /
  (SELECT COUNT(*) FROM auth.users) as conversion_rate_percent;
```

---

## NEXT STEPS

See PART 3 for feature implementation details
See PART 4 for deployment checklist
