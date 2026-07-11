-- 0002_events_and_engagement.sql
-- Events + every engagement signal needed to compute *real* analytics
-- (views, RSVPs, tickets, likes, reviews, attendance) instead of the
-- hardcoded numbers the old dashboard rendered.

do $$ begin
  create type public.event_status as enum ('draft', 'pending', 'published', 'upcoming', 'archived');
exception when duplicate_object then null;
end $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'social',
  description text default '',
  venue text default '',
  "date" date,
  start_time text,
  end_time text,
  status public.event_status not null default 'pending',
  price text default 'Free',
  capacity int default 0,
  attendee_count int not null default 0,
  likes int not null default 0,
  image_url text,
  org text,
  university text not null default '',
  created_by text references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists university text not null default '';
alter table public.events add column if not exists updated_at timestamptz not null default now();

create index if not exists events_status_idx on public.events (status);
create index if not exists events_category_idx on public.events (category);
create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_university_idx on public.events (university);
create index if not exists events_created_by_idx on public.events (created_by);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events
  for each row execute procedure public.set_updated_at();

-- ── Views (real event-detail impressions, replaces the old "likes * 100") ──
create table if not exists public.event_views (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id text references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists event_views_event_idx on public.event_views (event_id);
create index if not exists event_views_created_at_idx on public.event_views (created_at);

-- ── RSVPs, now with a real attendance signal ────────────────────────────────
create table if not exists public.event_rsvps (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id text references public.users (id) on delete set null,
  attended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
alter table public.event_rsvps add column if not exists attended_at timestamptz;
create index if not exists event_rsvps_event_idx on public.event_rsvps (event_id);
create index if not exists event_rsvps_created_at_idx on public.event_rsvps (created_at);

-- ── Tickets ──────────────────────────────────────────────────────────────────
create table if not exists public.tickets (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id text references public.users (id) on delete set null,
  price_cents int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists tickets_event_idx on public.tickets (event_id);
create index if not exists tickets_created_at_idx on public.tickets (created_at);

-- ── Likes ────────────────────────────────────────────────────────────────────
create table if not exists public.event_likes (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id text references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists event_likes_event_idx on public.event_likes (event_id);

-- ── Reviews ──────────────────────────────────────────────────────────────────
create table if not exists public.event_reviews (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  event_title text,
  user_id text references public.users (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now()
);
create index if not exists event_reviews_event_idx on public.event_reviews (event_id);
create index if not exists event_reviews_created_at_idx on public.event_reviews (created_at desc);

-- Keep events.likes / events.attendee_count in sync so simple list queries
-- (fetchEvents) stay cheap without needing a join on every render.
create or replace function public.sync_event_like_count()
returns trigger language plpgsql as $$
begin
  update public.events set likes = (select count(*) from public.event_likes where event_id = coalesce(new.event_id, old.event_id))
  where id = coalesce(new.event_id, old.event_id);
  return null;
end;
$$;
drop trigger if exists event_likes_sync on public.event_likes;
create trigger event_likes_sync after insert or delete on public.event_likes
  for each row execute procedure public.sync_event_like_count();

create or replace function public.sync_event_attendee_count()
returns trigger language plpgsql as $$
begin
  update public.events set attendee_count = (select count(*) from public.event_rsvps where event_id = coalesce(new.event_id, old.event_id))
  where id = coalesce(new.event_id, old.event_id);
  return null;
end;
$$;
drop trigger if exists event_rsvps_sync on public.event_rsvps;
create trigger event_rsvps_sync after insert or delete on public.event_rsvps
  for each row execute procedure public.sync_event_attendee_count();
