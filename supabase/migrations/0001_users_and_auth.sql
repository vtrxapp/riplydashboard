-- 0001_users_and_auth.sql
-- Core `users` profile table (1:1 with auth.users) + role-based access control.
-- Written idempotently so it is safe to run against a project that already
-- has some of this schema in place.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('organizer', 'staff', 'umsu_admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text,
  university text not null default '',
  campus text default '',
  program text,
  "year" text,
  role public.user_role not null default 'organizer',
  avatar_color text,
  created_at timestamptz not null default now()
);

comment on table public.users is 'Application profile row for every authenticated admin/organizer user.';

alter table public.users add column if not exists email text;
alter table public.users add column if not exists program text;
alter table public.users add column if not exists "year" text;
alter table public.users add column if not exists avatar_color text;

create index if not exists users_university_idx on public.users (university);
create index if not exists users_created_at_idx on public.users (created_at);
create index if not exists users_role_idx on public.users (role);

alter table public.users enable row level security;

-- ── handle_new_user(): populate public.users automatically after signup ────
-- Reads the metadata passed via supabase.auth.signUp({ options: { data } }).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, university, campus, role, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'university', ''),
    coalesce(new.raw_user_meta_data->>'campus', ''),
    coalesce(
      (new.raw_user_meta_data->>'role'),
      'organizer'
    )::public.user_role,
    now()
  )
  on conflict (id) do nothing;
  return new;
exception when invalid_text_representation then
  -- role text didn't map to a known enum value (e.g. free-form "Club Organizer") — default safely.
  insert into public.users (id, name, email, university, campus, role, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'university', ''),
    coalesce(new.raw_user_meta_data->>'campus', ''),
    'organizer',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper used throughout RLS policies: is the current user an UMSU admin?
create or replace function public.is_admin(p_uid uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users u where u.id = p_uid and u.role = 'umsu_admin'
  );
$$;

-- Helper: current user's university (used to scope multi-tenant queries).
create or replace function public.current_university(p_uid uuid default auth.uid())
returns text
language sql stable security definer set search_path = public
as $$
  select u.university from public.users u where u.id = p_uid;
$$;
