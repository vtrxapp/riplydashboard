-- admin_profiles previously allowed any signed-in Clerk user to insert their
-- own row (self-service admin signup from 0005). is_admin() checks for
-- existence of an admin_profiles row, and 0007 just made is_admin() gate
-- platform-wide events read/write and tickets read — so self-service
-- admin_profiles inserts became a privilege-escalation path: any user could
-- grant themselves cross-user data access by signing up through the
-- dashboard's signup form.
--
-- Admin provisioning now requires the service_role key (i.e. done manually
-- via the Supabase dashboard/SQL editor by whoever operates this project),
-- not the browser's anon key. This is purely a tightening of admin_profiles
-- writes — reads stay public (admin_profiles_select is unchanged), and no
-- other table's policies are touched.
drop policy if exists admin_profiles_insert on public.admin_profiles;
create policy admin_profiles_insert on public.admin_profiles
  for insert
  with check (false);

drop policy if exists admin_profiles_update on public.admin_profiles;
create policy admin_profiles_update on public.admin_profiles
  for update
  using (false)
  with check (false);

drop policy if exists admin_profiles_delete on public.admin_profiles;
create policy admin_profiles_delete on public.admin_profiles
  for delete
  using (false);
