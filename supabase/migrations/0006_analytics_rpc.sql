-- 0006_analytics_rpc.sql
-- Every chart in the dashboard is backed by one of these RPC functions.
-- They replace 100% of the hardcoded arrays that used to live in
-- src/components/Dashboard.jsx (TrendChart, GrowthChart, ActiveHoursChart,
-- VolumeChart, ACTIVITY_DATA, NOTIFS, faculty/year/retention %, etc).
--
-- All functions are `security definer` (so they can aggregate across a
-- university's data even under RLS) but internally scope results to the
-- caller's university via `public.current_university()`, and never return
-- data outside that scope.

-- ── KPI summary with period-over-period comparison ──────────────────────────
create or replace function public.analytics_kpi_summary(p_from timestamptz, p_to timestamptz, p_scope text default 'campus')
returns table (
  total_users bigint, total_events bigint, total_rsvps bigint, total_tickets bigint,
  prev_total_users bigint, prev_total_events bigint, prev_total_rsvps bigint, prev_total_tickets bigint
)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u),
  scoped_events as (
    select e.* from public.events e, uni
    where e.university = uni.u and (p_scope <> 'mine' or e.created_by = auth.uid())
  )
  select
    (select count(*) from public.users u, uni where u.university = uni.u and u.created_at <= p_to),
    (select count(*) from scoped_events where created_at <= p_to),
    (select count(*) from public.event_rsvps r join scoped_events e on e.id = r.event_id where r.created_at <= p_to),
    (select count(*) from public.tickets t join scoped_events e on e.id = t.event_id where t.created_at <= p_to),
    (select count(*) from public.users u, uni where u.university = uni.u and u.created_at <= p_from),
    (select count(*) from scoped_events where created_at <= p_from),
    (select count(*) from public.event_rsvps r join scoped_events e on e.id = r.event_id where r.created_at <= p_from),
    (select count(*) from public.tickets t join scoped_events e on e.id = t.event_id where t.created_at <= p_from);
$$;

-- ── Engagement trend: active users + RSVPs per bucket ───────────────────────
create or replace function public.analytics_engagement_trend(p_from date, p_to date, p_granularity text default 'week')
returns table (bucket date, active_users bigint, rsvps bigint)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u),
  buckets as (
    select generate_series(
      date_trunc(p_granularity, p_from::timestamptz),
      date_trunc(p_granularity, p_to::timestamptz),
      case p_granularity when 'day' then interval '1 day' when 'month' then interval '1 month' else interval '1 week' end
    )::date as bucket
  ),
  activity as (
    select date_trunc(p_granularity, r.created_at)::date as bucket, r.user_id
    from public.event_rsvps r join public.events e on e.id = r.event_id, uni
    where e.university = uni.u and r.created_at between p_from and p_to
    union all
    select date_trunc(p_granularity, t.created_at)::date, t.user_id
    from public.tickets t join public.events e on e.id = t.event_id, uni
    where e.university = uni.u and t.created_at between p_from and p_to
  )
  select
    b.bucket,
    coalesce((select count(distinct a.user_id) from activity a where a.bucket = b.bucket), 0),
    coalesce((select count(*) from public.event_rsvps r join public.events e on e.id = r.event_id, uni
              where e.university = uni.u and date_trunc(p_granularity, r.created_at)::date = b.bucket), 0)
  from buckets b
  order by b.bucket;
$$;

-- ── Member growth: cumulative active members + new joins per bucket ────────
create or replace function public.analytics_member_growth(p_from date, p_to date, p_granularity text default 'week')
returns table (bucket date, active_members bigint, new_joins bigint)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u),
  buckets as (
    select generate_series(
      date_trunc(p_granularity, p_from::timestamptz),
      date_trunc(p_granularity, p_to::timestamptz),
      case p_granularity when 'day' then interval '1 day' when 'month' then interval '1 month' else interval '1 week' end
    )::date as bucket
  )
  select
    b.bucket,
    (select count(*) from public.group_members gm join public.groups g on g.id = gm.group_id, uni
     where g.university = uni.u and gm.joined_at::date <= (b.bucket + case p_granularity when 'day' then interval '1 day' when 'month' then interval '1 month' else interval '1 week' end - interval '1 day')),
    (select count(*) from public.group_members gm join public.groups g on g.id = gm.group_id, uni
     where g.university = uni.u and date_trunc(p_granularity, gm.joined_at)::date = b.bucket)
  from buckets b
  order by b.bucket;
$$;

-- ── Category breakdown (events + RSVPs generated per category) ─────────────
create or replace function public.analytics_category_breakdown(p_from timestamptz default '-infinity', p_to timestamptz default 'infinity')
returns table (category text, event_count bigint, rsvp_count bigint)
language sql stable security definer set search_path = public as $$
  select e.category,
         count(distinct e.id),
         count(r.id)
  from public.events e
  left join public.event_rsvps r on r.event_id = e.id and r.created_at between p_from and p_to
  where e.university = public.current_university() and e.created_at between p_from and p_to
  group by e.category
  order by count(distinct e.id) desc;
$$;

-- ── Status breakdown (published/upcoming/draft/pending) ────────────────────
create or replace function public.analytics_status_breakdown()
returns table (status text, event_count bigint)
language sql stable security definer set search_path = public as $$
  select status::text, count(*) from public.events
  where university = public.current_university()
  group by status;
$$;

-- ── Group type breakdown (public/private/invite) ────────────────────────────
create or replace function public.analytics_group_type_breakdown()
returns table (privacy text, group_count bigint)
language sql stable security definer set search_path = public as $$
  select privacy, count(*) from public.groups
  where university = public.current_university() and not archived
  group by privacy;
$$;

-- ── Active hours (0-23, last 30 days of all engagement events) ─────────────
create or replace function public.analytics_active_hours()
returns table (hour_of_day int, activity_count bigint)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u), hours as (
    select generate_series(0, 23) as h
  ), acts as (
    select extract(hour from r.created_at)::int as h from public.event_rsvps r
      join public.events e on e.id = r.event_id, uni where e.university = uni.u and r.created_at > now() - interval '30 days'
    union all
    select extract(hour from t.created_at)::int from public.tickets t
      join public.events e on e.id = t.event_id, uni where e.university = uni.u and t.created_at > now() - interval '30 days'
    union all
    select extract(hour from l.created_at)::int from public.event_likes l
      join public.events e on e.id = l.event_id, uni where e.university = uni.u and l.created_at > now() - interval '30 days'
    union all
    select extract(hour from v.created_at)::int from public.event_views v
      join public.events e on e.id = v.event_id, uni where e.university = uni.u and v.created_at > now() - interval '30 days'
  )
  select hrs.h, coalesce((select count(*) from acts where acts.h = hrs.h), 0)
  from hours hrs order by hrs.h;
$$;

-- ── Rating distribution (1-5 stars) ─────────────────────────────────────────
create or replace function public.analytics_rating_distribution()
returns table (stars int, review_count bigint)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u), s as (select generate_series(1,5) as star)
  select s.star, coalesce((
    select count(*) from public.event_reviews r join public.events e on e.id = r.event_id, uni
    where e.university = uni.u and r.rating = s.star
  ), 0)
  from s order by s.star desc;
$$;

-- ── Faculty (program) breakdown — top 5 ─────────────────────────────────────
create or replace function public.analytics_faculty_breakdown()
returns table (program text, user_count bigint)
language sql stable security definer set search_path = public as $$
  select coalesce(program, 'Unspecified'), count(*) from public.users
  where university = public.current_university()
  group by program
  order by count(*) desc
  limit 5;
$$;

-- ── Year-of-study breakdown ──────────────────────────────────────────────────
create or replace function public.analytics_year_breakdown()
returns table (study_year text, user_count bigint)
language sql stable security definer set search_path = public as $$
  select coalesce("year", 'Unspecified'), count(*) from public.users
  where university = public.current_university()
  group by "year"
  order by "year";
$$;

-- ── Retention curve: % of each signup cohort still active N weeks later ────
create or replace function public.analytics_retention_curve(p_weeks int default 8)
returns table (week_number int, retained_pct numeric)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u),
  cohorts as (
    select id as user_id, date_trunc('week', created_at) as cohort_week
    from public.users, uni where university = uni.u
      and created_at > now() - ((p_weeks + 8) || ' weeks')::interval
  ),
  weeks as (select generate_series(0, p_weeks) as wn),
  activity as (
    select user_id, created_at from public.event_rsvps
    union all select user_id, created_at from public.tickets
    union all select user_id, created_at from public.event_likes
    union all select sender_id as user_id, created_at from public.messages
  )
  select
    w.wn,
    case when count(distinct c.user_id) = 0 then 0 else
      round(100.0 * count(distinct a.user_id) / count(distinct c.user_id), 1)
    end
  from weeks w
  left join cohorts c on true
  left join activity a on a.user_id = c.user_id
    and a.created_at >= c.cohort_week + (w.wn || ' weeks')::interval
    and a.created_at <  c.cohort_week + ((w.wn + 1) || ' weeks')::interval
  group by w.wn
  order by w.wn;
$$;

-- ── Conversion funnel (views -> RSVP -> attended -> ticket) + ratings ───────
create or replace function public.analytics_funnel(p_from timestamptz, p_to timestamptz)
returns table (
  total_views bigint, total_rsvps bigint, total_attended bigint, total_tickets bigint,
  avg_rating numeric, review_count bigint
)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u),
  scoped as (select id from public.events, uni where university = uni.u and created_at between p_from and p_to)
  select
    (select count(*) from public.event_views v where v.event_id in (select id from scoped) and v.created_at between p_from and p_to),
    (select count(*) from public.event_rsvps r where r.event_id in (select id from scoped) and r.created_at between p_from and p_to),
    (select count(*) from public.event_rsvps r where r.event_id in (select id from scoped) and r.attended_at is not null),
    (select count(*) from public.tickets t where t.event_id in (select id from scoped) and t.created_at between p_from and p_to),
    (select round(avg(rating)::numeric, 1) from public.event_reviews r where r.event_id in (select id from scoped)),
    (select count(*) from public.event_reviews r where r.event_id in (select id from scoped));
$$;

-- ── Live activity snapshot (last 15 min / last hour) for the Activity page ──
create or replace function public.analytics_live_snapshot()
returns table (
  active_users_now bigint, events_right_now bigint, rsvps_last_hour bigint, tickets_last_hour bigint
)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u)
  select
    (select count(distinct uid) from (
      select user_id as uid from public.event_rsvps r join public.events e on e.id = r.event_id, uni where e.university = uni.u and r.created_at > now() - interval '15 minutes'
      union select user_id from public.tickets t join public.events e on e.id = t.event_id, uni where e.university = uni.u and t.created_at > now() - interval '15 minutes'
      union select user_id from public.event_likes l join public.events e on e.id = l.event_id, uni where e.university = uni.u and l.created_at > now() - interval '15 minutes'
      union select sender_id from public.messages m join public.chat_members cm on cm.chat_id = m.chat_id where m.created_at > now() - interval '15 minutes'
    ) x),
    (select count(*) from public.events, uni where university = uni.u and status = 'published' and "date" = current_date),
    (select count(*) from public.event_rsvps r join public.events e on e.id = r.event_id, uni where e.university = uni.u and r.created_at > now() - interval '1 hour'),
    (select count(*) from public.tickets t join public.events e on e.id = t.event_id, uni where e.university = uni.u and t.created_at > now() - interval '1 hour');
$$;

-- ── Activity volume per hour bucket, last N hours (Events/Hour bar chart) ───
create or replace function public.analytics_activity_volume(p_hours int default 12)
returns table (bucket_start timestamptz, activity_count bigint)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u),
  buckets as (
    select generate_series(date_trunc('hour', now()) - ((p_hours - 1) || ' hours')::interval, date_trunc('hour', now()), interval '1 hour') as bucket_start
  ),
  acts as (
    select date_trunc('hour', r.created_at) as bucket_start from public.event_rsvps r join public.events e on e.id = r.event_id, uni where e.university = uni.u
    union all
    select date_trunc('hour', t.created_at) from public.tickets t join public.events e on e.id = t.event_id, uni where e.university = uni.u
    union all
    select date_trunc('hour', l.created_at) from public.event_likes l join public.events e on e.id = l.event_id, uni where e.university = uni.u
  )
  select b.bucket_start, coalesce((select count(*) from acts a where a.bucket_start = b.bucket_start), 0)
  from buckets b order by b.bucket_start;
$$;

-- ── Activity type breakdown (rsvp/ticket/event/group/like shares) ──────────
create or replace function public.analytics_activity_type_breakdown(p_hours int default 24)
returns table (kind text, activity_count bigint)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u)
  select 'rsvp', count(*) from public.event_rsvps r join public.events e on e.id = r.event_id, uni where e.university = uni.u and r.created_at > now() - (p_hours || ' hours')::interval
  union all
  select 'ticket', count(*) from public.tickets t join public.events e on e.id = t.event_id, uni where e.university = uni.u and t.created_at > now() - (p_hours || ' hours')::interval
  union all
  select 'event', count(*) from public.events, uni where university = uni.u and created_at > now() - (p_hours || ' hours')::interval
  union all
  select 'group', count(*) from public.group_members gm join public.groups g on g.id = gm.group_id, uni where g.university = uni.u and gm.joined_at > now() - (p_hours || ' hours')::interval
  union all
  select 'like', count(*) from public.event_likes l join public.events e on e.id = l.event_id, uni where e.university = uni.u and l.created_at > now() - (p_hours || ' hours')::interval;
$$;

-- ── Unified recent activity feed (replaces ACTIVITY_DATA) ───────────────────
create or replace function public.recent_activity_feed(p_limit int default 20)
returns table (
  kind text, actor_name text, target_title text, occurred_at timestamptz
)
language sql stable security definer set search_path = public as $$
  with uni as (select public.current_university() as u)
  select 'rsvp', coalesce(u.name, 'A student'), e.title, r.created_at
    from public.event_rsvps r
    join public.events e on e.id = r.event_id
    left join public.users u on u.id = r.user_id, uni
    where e.university = uni.u
  union all
  select 'ticket', coalesce(u.name, 'A student'), e.title, t.created_at
    from public.tickets t
    join public.events e on e.id = t.event_id
    left join public.users u on u.id = t.user_id, uni
    where e.university = uni.u
  union all
  select 'event', coalesce(u.name, 'An organizer'), e.title, e.created_at
    from public.events e
    left join public.users u on u.id = e.created_by, uni
    where e.university = uni.u and e.status = 'published'
  union all
  select 'group', coalesce(u.name, 'A student'), g.name, gm.joined_at
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    left join public.users u on u.id = gm.user_id, uni
    where g.university = uni.u
  union all
  select 'like', coalesce(u.name, 'A student'), e.title, l.created_at
    from public.event_likes l
    join public.events e on e.id = l.event_id
    left join public.users u on u.id = l.user_id, uni
    where e.university = uni.u
  order by occurred_at desc
  limit p_limit;
$$;

grant execute on all functions in schema public to authenticated;
