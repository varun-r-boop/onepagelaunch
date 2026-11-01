-- Lets the API reach the waitlist table. Newer Supabase projects don't
-- automatically expose tables created in SQL to the anon/authenticated roles,
-- so without these grants every sign-up fails with "permission denied".
-- Safe to run more than once. Run after 20261030000000_waitlist_signups.sql.

grant insert on table public.waitlist_signups to anon, authenticated;
grant select, delete on table public.waitlist_signups to authenticated;

-- The insert rule checks that the page exists, so visitors must be able to read projects
grant select on table public.projects to anon, authenticated;
