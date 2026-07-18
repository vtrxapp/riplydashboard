-- The shared Supabase project's RLS policies were tightened to per-user
-- scoping (student sees/edits only their own rows). That's correct for the
-- student app, but the admin dashboard needs to see and moderate every
-- user's data, not just the admin's own. Postgres OR's multiple permissive
-- policies together, so these are purely additive — they grant admins (per
-- is_admin(), based on an admin_profiles row) extra visibility without
-- touching or narrowing any of the app's existing per-user policies.

-- Events: admins need to see every event (including other users' pending
-- submissions) to moderate the approval queue, and to approve/reject them.
drop policy if exists events_select_admin on public.events;
create policy events_select_admin on public.events
  for select
  using (public.is_admin());

-- WITH CHECK omitted intentionally: Postgres defaults it to the USING
-- expression, and is_admin() doesn't reference row data either way, so a
-- second explicit call would be a no-op.
drop policy if exists events_update_admin on public.events;
create policy events_update_admin on public.events
  for update
  using (public.is_admin());

-- Tickets: admin KPIs/funnel need the true platform-wide ticket count, not
-- just tickets the admin personally purchased.
drop policy if exists tickets_select_admin on public.tickets;
create policy tickets_select_admin on public.tickets
  for select
  using (public.is_admin());
