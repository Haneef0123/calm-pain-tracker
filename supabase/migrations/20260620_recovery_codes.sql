-- One active recovery code per user (regenerating replaces the row).
create table if not exists public.recovery_codes (
  user_id         uuid        primary key references auth.users(id) on delete cascade,
  code_hash       text        not null,
  synthetic_email text        not null,
  created_at      timestamptz not null default now()
);

-- Rate-limiting for the /api/recovery/redeem endpoint (no extra infra).
create table if not exists public.recovery_redeem_attempts (
  id           bigint      generated always as identity primary key,
  ip_hash      text        not null,
  attempted_at timestamptz not null default now(),
  succeeded    boolean     not null default false
);

create index if not exists idx_redeem_attempts_ip_time
  on public.recovery_redeem_attempts(ip_hash, attempted_at);

-- Both tables: access only via service-role API routes; no client RLS grants.
alter table public.recovery_codes enable row level security;
alter table public.recovery_redeem_attempts enable row level security;
