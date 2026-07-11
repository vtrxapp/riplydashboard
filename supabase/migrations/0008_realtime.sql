-- 0008_realtime.sql
-- Ensure the tables the dashboard subscribes to via Supabase Realtime are
-- part of the realtime publication (required for postgres_changes events).

do $$
declare
  t text;
begin
  foreach t in array array['messages', 'event_rsvps', 'tickets', 'event_likes', 'group_members', 'notifications', 'events']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
