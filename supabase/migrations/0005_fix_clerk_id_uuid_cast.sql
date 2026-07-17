-- CRITICAL FIX: Supabase's built-in auth.uid() casts the JWT `sub` claim to
-- `uuid`. Clerk user ids (e.g. "user_3GdsHRXCyahfrgp2oI1ytxPU9xP") are never
-- valid UUIDs, so every RLS policy / function that called auth.uid() was
-- throwing "invalid input syntax for type uuid" instead of just denying
-- access -- breaking is_admin(), the users/admin_profiles insert policies
-- used by admin signup, and the trusted_devices select policy used by
-- device-verification checks, for every Clerk-authenticated request.
--
-- Confirmed in production Postgres logs immediately after a real signup
-- attempt: two "invalid input syntax for type uuid" errors at the moment
-- PrivateRoute called is_admin() post-signup.
--
-- Fix: read the JWT `sub` claim directly via auth.jwt()->>'sub' (jsonb
-- extraction, no cast) instead of auth.uid(), everywhere a Clerk user id is
-- needed as text.
create or replace function public.current_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt()->>'sub', '');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where user_id = public.current_user_id()
  );
$$;

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
  for insert with check (public.current_user_id() = id);

drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update using (public.current_user_id() = id)
  with check (public.current_user_id() = id);

drop policy if exists users_delete on public.users;
create policy users_delete on public.users
  for delete using (public.current_user_id() = id);

drop policy if exists admin_profiles_insert on public.admin_profiles;
create policy admin_profiles_insert on public.admin_profiles
  for insert with check (public.current_user_id() = user_id);

drop policy if exists admin_profiles_update on public.admin_profiles;
create policy admin_profiles_update on public.admin_profiles
  for update using (public.current_user_id() = user_id)
  with check (public.current_user_id() = user_id);

drop policy if exists admin_profiles_delete on public.admin_profiles;
create policy admin_profiles_delete on public.admin_profiles
  for delete using (public.current_user_id() = user_id);

drop policy if exists trusted_devices_select on public.trusted_devices;
create policy trusted_devices_select on public.trusted_devices
  for select using (public.current_user_id() = user_id);
