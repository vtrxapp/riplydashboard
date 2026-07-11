-- 0004_messaging.sql
-- Chats/messages, properly scoped by membership (the old schema had no
-- concept of chat membership, so any signed-in user could read any chat).

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initial text,
  color text,
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_members (
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);
create index if not exists chat_members_user_idx on public.chat_members (user_id);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  chat_id uuid not null references public.chats (id) on delete cascade,
  sender_id uuid references public.users (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_chat_idx on public.messages (chat_id, created_at);

create or replace function public.touch_chat_last_message()
returns trigger language plpgsql as $$
begin
  update public.chats
  set last_message = new.content, last_message_at = new.created_at
  where id = new.chat_id;
  return new;
end;
$$;
drop trigger if exists messages_touch_chat on public.messages;
create trigger messages_touch_chat after insert on public.messages
  for each row execute procedure public.touch_chat_last_message();
