-- Free/Pro plans, page analytics and custom domains.
-- Run once in the Supabase SQL editor (safe to re-run).
-- The app writes subscriptions and page views with SUPABASE_SECRET_KEY, so that key must be set.

-- ---------- Plans ----------
-- One row per user who has ever subscribed. No row = Free.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  -- Lemon Squeezy: on_trial, active, paused, past_due, unpaid, cancelled, expired
  status text,
  ls_subscription_id text unique,
  ls_customer_id text,
  -- When a cancelled subscription stops giving Pro
  ends_at timestamptz,
  renews_at timestamptz,
  portal_url text,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can read their own subscription" on public.subscriptions;
create policy "Users can read their own subscription"
  on public.subscriptions for select
  to authenticated
  using (user_id = auth.uid());
-- No insert/update policies: only the billing webhook (secret key) changes plans.

grant select on table public.subscriptions to authenticated;

-- ---------- Analytics ----------
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Daily-rotating hash of IP + browser: counts unique visitors without storing either
  visitor_hash text not null,
  referrer_host text,
  country text
);

create index if not exists page_views_project_created_idx
  on public.page_views (project_id, created_at desc);

alter table public.page_views enable row level security;

drop policy if exists "Owners can read their page views" on public.page_views;
create policy "Owners can read their page views"
  on public.page_views for select
  to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
-- No insert policy: views are recorded by the server (secret key).

grant select on table public.page_views to authenticated;

-- ---------- Custom domains ----------
alter table public.projects add column if not exists custom_domain text;
create unique index if not exists projects_custom_domain_key on public.projects (lower(custom_domain));
