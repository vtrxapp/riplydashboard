-- 0005_notifications_and_triggers.sql
-- Real notification generation — replaces the old hardcoded NOTIFS array.

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id text not null references public.users (id) on delete cascade,
  kind text not null default 'event',
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where not read;

-- ── Event status changes → notify the event's creator ──────────────────────
create or replace function public.notify_event_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.created_by is not null then
    if new.status = 'published' then
      insert into public.notifications (user_id, kind, title, body)
      values (new.created_by, 'event', 'Event approved', format('"%s" was approved and published.', new.title));
    elsif new.status = 'draft' and old.status = 'pending' then
      insert into public.notifications (user_id, kind, title, body)
      values (new.created_by, 'event', 'Event needs changes', format('"%s" was sent back to draft — please review and resubmit.', new.title));
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists events_notify_status on public.events;
create trigger events_notify_status after update on public.events
  for each row execute procedure public.notify_event_status_change();

-- ── RSVP milestones (50 / 100 / 250 / 500 / 1000 / 5000 …) ──────────────────
create or replace function public.notify_rsvp_milestone()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count int;
  v_title text;
  v_owner text;
  v_milestones int[] := array[50, 100, 250, 500, 1000, 2500, 5000, 10000];
  v_m int;
begin
  select attendee_count, title, created_by into v_count, v_title, v_owner
  from public.events where id = new.event_id;

  if v_owner is null then
    return new;
  end if;

  foreach v_m in array v_milestones loop
    if v_count = v_m then
      insert into public.notifications (user_id, kind, title, body)
      values (v_owner, 'rsvp', 'RSVP milestone reached', format('Your event "%s" passed %s RSVPs.', v_title, v_m));
    end if;
  end loop;

  return new;
end;
$$;
drop trigger if exists event_rsvps_notify on public.event_rsvps;
create trigger event_rsvps_notify after insert on public.event_rsvps
  for each row execute procedure public.notify_rsvp_milestone();

-- ── New ticket sales → notify the organizer ─────────────────────────────────
create or replace function public.notify_ticket_sold()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_owner text;
begin
  select title, created_by into v_title, v_owner from public.events where id = new.event_id;
  if v_owner is not null then
    insert into public.notifications (user_id, kind, title, body)
    values (v_owner, 'ticket', 'Ticket sold', format('A new ticket was sold for "%s".', v_title));
  end if;
  return new;
end;
$$;
drop trigger if exists tickets_notify on public.tickets;
create trigger tickets_notify after insert on public.tickets
  for each row execute procedure public.notify_ticket_sold();

-- ── New group members ────────────────────────────────────────────────────────
create or replace function public.notify_new_group_member()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_owner text;
begin
  select name, created_by into v_name, v_owner from public.groups where id = new.group_id;
  if v_owner is not null and v_owner <> new.user_id then
    insert into public.notifications (user_id, kind, title, body)
    values (v_owner, 'group', 'New member joined', format('Someone new joined "%s".', v_name));
  end if;
  return new;
end;
$$;
drop trigger if exists group_members_notify on public.group_members;
create trigger group_members_notify after insert on public.group_members
  for each row execute procedure public.notify_new_group_member();
