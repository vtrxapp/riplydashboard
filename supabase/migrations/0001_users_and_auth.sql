-- 0001_users_and_auth.sql
-- Core `users` profile table + role-based access control.
--
-- Identity for this app is provided by Clerk, configured in the Supabase
-- dashboard as a Third-Party Auth provider (Authentication -> Sign In / Up
-- -> Third-Party Auth -> Clerk). Supabase verifies Clerk-issued JWTs
-- directly against Clerk's JWKS endpoint and stamps them with
-- `"role": "authenticated"` — there is no `auth.users` row for these users
-- (that table belongs to Supabase's own GoTrue auth, which this app does
-- not use). Because of that, `users.id` stores Clerk's user id
-- (e.g. `user_2abC...`) as plain text rather than a uuid FK to `auth.users`.
--
-- Written idempotently so it is safe to run against a project that already
-- has some of this schema in place.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('organizer', 'staff', 'umsu_admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id text primary key,
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

comment on table public.users is 'Application profile row for every admin/organizer user, keyed by Clerk user id.';
comment on column public.users.id is 'Clerk user id (the "sub" claim of the Clerk-issued JWT), not a Supabase auth.users id.';

alter table public.users add column if not exists email text;
alter table public.users add column if not exists program text;
alter table public.users add column if not exists "year" text;
alter table public.users add column if not exists avatar_color text;

create index if not exists users_university_idx on public.users (university);
create index if not exists users_created_at_idx on public.users (created_at);
create index if not exists users_role_idx on public.users (role);

alter table public.users enable row level security;

-- ── Clerk identity helpers used throughout RLS policies + RPCs ─────────────

-- The Clerk user id for the current request, read from the verified JWT's
-- `sub` claim (set by Supabase's Clerk Third-Party Auth integration).
create or replace function public.clerk_user_id()
returns text
language sql stable
as $$
  select (auth.jwt()->>'sub');
$$;

-- Is the current user an UMSU admin?
create or replace function public.is_admin(p_uid text default public.clerk_user_id())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users u where u.id = p_uid and u.role = 'umsu_admin'
  );
$$;

-- Current user's university (used to scope multi-tenant queries).
create or replace function public.current_university(p_uid text default public.clerk_user_id())
returns text
language sql stable security definer set search_path = public
as $$
  select u.university from public.users u where u.id = p_uid;
$$;

-- Does the current Clerk user already have a completed profile row? The
-- client uses this to decide whether to route to the onboarding screen
-- (university/campus/role) right after a Clerk sign-up.
create or replace function public.has_profile()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = public.clerk_user_id());
$$;
