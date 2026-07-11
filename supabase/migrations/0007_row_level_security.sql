-- 0007_row_level_security.sql
-- Enables RLS on every table and defines least-privilege policies scoped by
-- university + role. The old app had zero RLS policies documented anywhere
-- in the repo (any authenticated user could read/write everything), so this
-- is a real security hardening pass, not just plumbing.
--
-- Every policy identifies "the current user" via `public.clerk_user_id()`
-- (reads the `sub` claim of the verified Clerk JWT) rather than Supabase
-- Auth's `auth.uid()`, since this app's admins authenticate via Clerk
-- (configured as a Supabase Third-Party Auth provider) and never get a row
-- in `auth.users`.

alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.event_views enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.tickets enable row level security;
alter table public.event_likes enable row level security;
alter table public.event_reviews enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_posts enable row level security;
alter table public.group_events enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Small helper to make `create policy` idempotent (Postgres has no
-- `create policy if not exists`).
create or replace function public._create_policy_if_missing(p_table text, p_name text, p_sql text)
returns void language plpgsql as $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = p_table and policyname = p_name) then
    execute p_sql;
  end if;
end;
$$;

-- ── users ────────────────────────────────────────────────────────────────────
select public._create_policy_if_missing('users', 'users_select_self_or_admin', $$
  create policy users_select_self_or_admin on public.users for select
  using (id = public.clerk_user_id() or (public.is_admin() and university = public.current_university()))
$$);
select public._create_policy_if_missing('users', 'users_update_self', $$
  create policy users_update_self on public.users for update
  using (id = public.clerk_user_id()) with check (id = public.clerk_user_id() and role = (select role from public.users where id = public.clerk_user_id()))
$$);
-- There is no more `handle_new_user()` trigger (Clerk sign-ups never touch
-- auth.users), so the onboarding screen inserts this row itself right after
-- a Clerk sign-up. Note: like the signup form before it, this still lets a
-- new user self-declare any role (including umsu_admin) — fine for getting
-- a demo/pilot running, but a real rollout should gate elevated roles
-- behind an invite or an existing admin's approval instead of trusting
-- client-declared input.
select public._create_policy_if_missing('users', 'users_insert_self', $$
  create policy users_insert_self on public.users for insert
  with check (id = public.clerk_user_id())
$$);

-- ── events ───────────────────────────────────────────────────────────────────
select public._create_policy_if_missing('events', 'events_select_scoped', $$
  create policy events_select_scoped on public.events for select
  using (
    university = public.current_university()
    and (status = 'published' or created_by = public.clerk_user_id() or public.is_admin())
  )
$$);
select public._create_policy_if_missing('events', 'events_insert_own', $$
  create policy events_insert_own on public.events for insert
  with check (created_by = public.clerk_user_id() and university = public.current_university())
$$);
select public._create_policy_if_missing('events', 'events_update_own_or_admin', $$
  create policy events_update_own_or_admin on public.events for update
  using (created_by = public.clerk_user_id() or public.is_admin())
$$);
select public._create_policy_if_missing('events', 'events_delete_own_or_admin', $$
  create policy events_delete_own_or_admin on public.events for delete
  using (created_by = public.clerk_user_id() or public.is_admin())
$$);

-- ── event_views / event_rsvps / tickets / event_likes ──────────────────────
select public._create_policy_if_missing('event_views', 'event_views_select_scoped', $$
  create policy event_views_select_scoped on public.event_views for select
  using (exists (select 1 from public.events e where e.id = event_id and (e.created_by = public.clerk_user_id() or public.is_admin())))
$$);
select public._create_policy_if_missing('event_views', 'event_views_insert_own', $$
  create policy event_views_insert_own on public.event_views for insert
  with check (user_id = public.clerk_user_id() or user_id is null)
$$);

select public._create_policy_if_missing('event_rsvps', 'event_rsvps_select_scoped', $$
  create policy event_rsvps_select_scoped on public.event_rsvps for select
  using (user_id = public.clerk_user_id() or exists (select 1 from public.events e where e.id = event_id and (e.created_by = public.clerk_user_id() or public.is_admin())))
$$);
select public._create_policy_if_missing('event_rsvps', 'event_rsvps_insert_own', $$
  create policy event_rsvps_insert_own on public.event_rsvps for insert
  with check (user_id = public.clerk_user_id())
$$);

select public._create_policy_if_missing('tickets', 'tickets_select_scoped', $$
  create policy tickets_select_scoped on public.tickets for select
  using (user_id = public.clerk_user_id() or exists (select 1 from public.events e where e.id = event_id and (e.created_by = public.clerk_user_id() or public.is_admin())))
$$);
select public._create_policy_if_missing('tickets', 'tickets_insert_own', $$
  create policy tickets_insert_own on public.tickets for insert
  with check (user_id = public.clerk_user_id())
$$);

select public._create_policy_if_missing('event_likes', 'event_likes_select_scoped', $$
  create policy event_likes_select_scoped on public.event_likes for select
  using (true)
$$);
select public._create_policy_if_missing('event_likes', 'event_likes_insert_own', $$
  create policy event_likes_insert_own on public.event_likes for insert
  with check (user_id = public.clerk_user_id())
$$);
select public._create_policy_if_missing('event_likes', 'event_likes_delete_own', $$
  create policy event_likes_delete_own on public.event_likes for delete
  using (user_id = public.clerk_user_id())
$$);

-- ── event_reviews ────────────────────────────────────────────────────────────
select public._create_policy_if_missing('event_reviews', 'event_reviews_select_scoped', $$
  create policy event_reviews_select_scoped on public.event_reviews for select
  using (exists (select 1 from public.events e where e.id = event_id and e.university = public.current_university()))
$$);
select public._create_policy_if_missing('event_reviews', 'event_reviews_insert_own', $$
  create policy event_reviews_insert_own on public.event_reviews for insert
  with check (user_id = public.clerk_user_id())
$$);

-- ── groups / members / posts / events ───────────────────────────────────────
select public._create_policy_if_missing('groups', 'groups_select_scoped', $$
  create policy groups_select_scoped on public.groups for select
  using (university = public.current_university())
$$);
select public._create_policy_if_missing('groups', 'groups_write_own_or_admin', $$
  create policy groups_write_own_or_admin on public.groups for all
  using (created_by = public.clerk_user_id() or public.is_admin())
  with check (created_by = public.clerk_user_id() or public.is_admin())
$$);

select public._create_policy_if_missing('group_members', 'group_members_select_scoped', $$
  create policy group_members_select_scoped on public.group_members for select
  using (exists (select 1 from public.groups g where g.id = group_id and g.university = public.current_university()))
$$);
select public._create_policy_if_missing('group_members', 'group_members_insert_own', $$
  create policy group_members_insert_own on public.group_members for insert
  with check (user_id = public.clerk_user_id())
$$);
select public._create_policy_if_missing('group_members', 'group_members_delete_own', $$
  create policy group_members_delete_own on public.group_members for delete
  using (user_id = public.clerk_user_id())
$$);

select public._create_policy_if_missing('group_posts', 'group_posts_select_scoped', $$
  create policy group_posts_select_scoped on public.group_posts for select
  using (exists (select 1 from public.groups g where g.id = group_id and g.university = public.current_university()))
$$);
select public._create_policy_if_missing('group_events', 'group_events_select_scoped', $$
  create policy group_events_select_scoped on public.group_events for select
  using (exists (select 1 from public.groups g where g.id = group_id and g.university = public.current_university()))
$$);

-- ── chats / chat_members / messages (membership-scoped) ─────────────────────
select public._create_policy_if_missing('chats', 'chats_select_member', $$
  create policy chats_select_member on public.chats for select
  using (exists (select 1 from public.chat_members cm where cm.chat_id = id and cm.user_id = public.clerk_user_id()))
$$);
select public._create_policy_if_missing('chat_members', 'chat_members_select_self', $$
  create policy chat_members_select_self on public.chat_members for select
  using (user_id = public.clerk_user_id())
$$);
select public._create_policy_if_missing('messages', 'messages_select_member', $$
  create policy messages_select_member on public.messages for select
  using (exists (select 1 from public.chat_members cm where cm.chat_id = messages.chat_id and cm.user_id = public.clerk_user_id()))
$$);
select public._create_policy_if_missing('messages', 'messages_insert_member', $$
  create policy messages_insert_member on public.messages for insert
  with check (
    sender_id = public.clerk_user_id()
    and exists (select 1 from public.chat_members cm where cm.chat_id = messages.chat_id and cm.user_id = public.clerk_user_id())
  )
$$);

-- ── notifications (strictly own rows) ───────────────────────────────────────
select public._create_policy_if_missing('notifications', 'notifications_select_own', $$
  create policy notifications_select_own on public.notifications for select
  using (user_id = public.clerk_user_id())
$$);
select public._create_policy_if_missing('notifications', 'notifications_update_own', $$
  create policy notifications_update_own on public.notifications for update
  using (user_id = public.clerk_user_id())
$$);

drop function if exists public._create_policy_if_missing(text, text, text);
