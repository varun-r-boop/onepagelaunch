-- Waitlist sign-ups collected by published pages.
-- Run this once in the Supabase SQL editor (or with `supabase db push`).

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now(),
  unique (project_id, email)
);

create index if not exists waitlist_signups_project_created_idx
  on public.waitlist_signups (project_id, created_at desc);

alter table public.waitlist_signups enable row level security;

-- Anyone (including signed-out visitors) can join the waitlist of an existing page
drop policy if exists "Visitors can join a waitlist" on public.waitlist_signups;
create policy "Visitors can join a waitlist"
  on public.waitlist_signups for insert
  to anon, authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id));

-- Only the page owner can see and remove sign-ups
drop policy if exists "Owners can read their waitlist" on public.waitlist_signups;
create policy "Owners can read their waitlist"
  on public.waitlist_signups for select
  to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

drop policy if exists "Owners can delete from their waitlist" on public.waitlist_signups;
create policy "Owners can delete from their waitlist"
  on public.waitlist_signups for delete
  to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
