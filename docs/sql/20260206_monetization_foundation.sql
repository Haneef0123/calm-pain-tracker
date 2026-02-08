-- PainMap monetization foundation
-- Apply in Supabase SQL editor (or migration pipeline) before enabling billing/report routes.

create extension if not exists "pgcrypto";

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_type text not null default 'free' check (plan_type in ('free', 'pro', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  payment_provider text not null default 'razorpay' check (payment_provider in ('razorpay', 'manual')),
  provider_customer_id text,
  provider_subscription_id text,
  provider_plan_id text,
  billing_metadata jsonb not null default '{}'::jsonb,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_status on public.user_subscriptions(status);
create index if not exists idx_user_subscriptions_provider on public.user_subscriptions(payment_provider);
create unique index if not exists idx_user_subscriptions_provider_customer
  on public.user_subscriptions(payment_provider, provider_customer_id)
  where provider_customer_id is not null;
create unique index if not exists idx_user_subscriptions_provider_subscription
  on public.user_subscriptions(payment_provider, provider_subscription_id)
  where provider_subscription_id is not null;

alter table public.user_subscriptions enable row level security;

drop policy if exists "select_own_subscription" on public.user_subscriptions;
create policy "select_own_subscription"
on public.user_subscriptions for select
using (auth.uid() = user_id);

create table if not exists public.shareable_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  share_token uuid not null unique default gen_random_uuid(),
  title text not null default 'Pain Report',
  date_start date not null,
  date_end date not null,
  payload jsonb not null,
  password_hash text,
  expires_at timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shareable_reports_user_id on public.shareable_reports(user_id);
create index if not exists idx_shareable_reports_share_token on public.shareable_reports(share_token);
create index if not exists idx_shareable_reports_expires_at on public.shareable_reports(expires_at);

alter table public.shareable_reports enable row level security;

drop policy if exists "manage_own_reports" on public.shareable_reports;
create policy "manage_own_reports"
on public.shareable_reports for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "public_select_by_token" on public.shareable_reports;

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  event_props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_event_name on public.analytics_events(event_name);
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "insert_own_analytics_events" on public.analytics_events;
create policy "insert_own_analytics_events"
on public.analytics_events for insert
with check (auth.uid() = user_id);

drop policy if exists "select_own_analytics_events" on public.analytics_events;
create policy "select_own_analytics_events"
on public.analytics_events for select
using (auth.uid() = user_id);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('razorpay')),
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists idx_billing_webhook_events_created_at on public.billing_webhook_events(created_at desc);
create index if not exists idx_billing_webhook_events_provider on public.billing_webhook_events(provider);

create or replace function public.increment_report_view_count(token uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  update public.shareable_reports
  set view_count = view_count + 1
  where share_token = token
    and (expires_at is null or expires_at > now())
  returning view_count into next_count;

  return coalesce(next_count, 0);
end;
$$;

grant execute on function public.increment_report_view_count(uuid) to anon, authenticated;

drop trigger if exists trg_user_subscriptions_touch_updated_at on public.user_subscriptions;
create trigger trg_user_subscriptions_touch_updated_at
before update on public.user_subscriptions
for each row execute function public.touch_updated_at();

drop trigger if exists trg_shareable_reports_touch_updated_at on public.shareable_reports;
create trigger trg_shareable_reports_touch_updated_at
before update on public.shareable_reports
for each row execute function public.touch_updated_at();

insert into public.user_subscriptions (user_id, plan_type, status, payment_provider)
select id, 'free', 'active', 'manual'
from auth.users
where id not in (select user_id from public.user_subscriptions);
