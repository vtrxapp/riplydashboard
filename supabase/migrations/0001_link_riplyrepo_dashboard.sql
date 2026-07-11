-- Link riplyrepo (student app) + riplydashboard (admin app) on one Supabase project.
-- Idempotent: safe to re-run against riply's Project (ref: mhraqpmlvviyrkkqdxcd).

create extension if not exists pgcrypto;

-- ── Identity helpers (Supabase Auth admins + Clerk students) ─────────────────

create or replace function public.current_user_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt()->>'sub', ''),
    nullif(auth.uid()::text, '')
  );
$$;

create or replace function public.map_admin_role(p_role text)
returns text
language sql
immutable
as $$
  select case p_role
    when 'UMSU Administrator' then 'umsu_admin'
    when 'Department Staff' then 'staff'
    when 'Club Organizer' then 'organizer'
    when 'umsu_admin' then 'umsu_admin'
    when 'staff' then 'staff'
    when 'organizer' then 'organizer'
    when 'admin' then 'umsu_admin'
    else 'organizer'
  end;
$$;

create or replace function public.is_admin(p_uid text default public.current_user_id())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = p_uid
      and u.role in ('umsu_admin', 'staff', 'organizer', 'admin')
  );
$$;

-- ── Auto-create admin profile rows on dashboard signup ───────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := public.map_admin_role(coalesce(new.raw_user_meta_data->>'role', 'organizer'));

  insert into public.users (
    id,
    email,
    name,
    university,
    campus,
    role
  )
  values (
    new.id::text,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'university', ''),
    coalesce(new.raw_user_meta_data->>'campus', ''),
    v_role
  )
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        university = excluded.university,
        campus = excluded.campus,
        role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ── Optional columns used by the dashboard (riplyrepo-safe) ─────────────────

alter table public.users add column if not exists avatar_color text;
alter table public.events add column if not exists university text;
alter table public.groups add column if not exists university text;
alter table public.groups add column if not exists created_by text;

-- Dashboard notifications use "kind"; riplyrepo uses "type". Keep both.
alter table public.notifications add column if not exists kind text;
update public.notifications
  set kind = type
  where kind is null and type is not null;

-- ── Tables the dashboard expects but riplyrepo may not have yet ─────────────

create table if not exists public.event_views (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id text references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists event_views_event_idx on public.event_views (event_id);

create table if not exists public.chat_members (
  id bigint generated always as identity primary key,
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (chat_id, user_id)
);

create table if not exists public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id text references public.users (id) on delete set null,
  content text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.group_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, event_id)
);

-- ── Realtime (dashboard live activity) ───────────────────────────────────────

do $$
begin
  alter publication supabase_realtime add table public.event_rsvps;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.event_likes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.group_members;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
