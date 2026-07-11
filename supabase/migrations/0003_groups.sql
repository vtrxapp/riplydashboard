-- 0003_groups.sql
-- Groups/communities + membership, kept in sync so list queries stay cheap.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  privacy text not null default 'public' check (privacy in ('public', 'private', 'invite')),
  category text default 'social',
  logo_color text,
  initial text,
  member_count int not null default 0,
  post_count int not null default 0,
  event_count int not null default 0,
  university text not null default '',
  archived boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.groups add column if not exists university text not null default '';

create index if not exists groups_member_count_idx on public.groups (member_count desc);
create index if not exists groups_privacy_idx on public.groups (privacy);
create index if not exists groups_archived_idx on public.groups (archived);
create index if not exists groups_university_idx on public.groups (university);

create table if not exists public.group_members (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);
create index if not exists group_members_group_idx on public.group_members (group_id);
create index if not exists group_members_joined_at_idx on public.group_members (joined_at);

create table if not exists public.group_posts (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists group_posts_group_idx on public.group_posts (group_id);

create table if not exists public.group_events (
  group_id uuid not null references public.groups (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  primary key (group_id, event_id)
);

create or replace function public.sync_group_member_count()
returns trigger language plpgsql as $$
begin
  update public.groups set member_count = (select count(*) from public.group_members where group_id = coalesce(new.group_id, old.group_id))
  where id = coalesce(new.group_id, old.group_id);
  return null;
end;
$$;
drop trigger if exists group_members_sync on public.group_members;
create trigger group_members_sync after insert or delete on public.group_members
  for each row execute procedure public.sync_group_member_count();

create or replace function public.sync_group_post_count()
returns trigger language plpgsql as $$
begin
  update public.groups set post_count = (select count(*) from public.group_posts where group_id = coalesce(new.group_id, old.group_id))
  where id = coalesce(new.group_id, old.group_id);
  return null;
end;
$$;
drop trigger if exists group_posts_sync on public.group_posts;
create trigger group_posts_sync after insert or delete on public.group_posts
  for each row execute procedure public.sync_group_post_count();

create or replace function public.sync_group_event_count()
returns trigger language plpgsql as $$
begin
  update public.groups set event_count = (select count(*) from public.group_events where group_id = coalesce(new.group_id, old.group_id))
  where id = coalesce(new.group_id, old.group_id);
  return null;
end;
$$;
drop trigger if exists group_events_sync on public.group_events;
create trigger group_events_sync after insert or delete on public.group_events
  for each row execute procedure public.sync_group_event_count();
