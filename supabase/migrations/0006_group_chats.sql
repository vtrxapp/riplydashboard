-- Link chats to a group so the admin dashboard can start/reuse a single
-- chat per group instead of creating duplicate chats or matching by name.
alter table public.chats add column if not exists group_id uuid references public.groups (id) on delete cascade;

-- One chat per group — the dashboard looks up an existing group chat by
-- group_id before creating a new one, so this also prevents a race from
-- ever producing duplicates.
create unique index if not exists chats_group_id_key on public.chats (group_id) where group_id is not null;
