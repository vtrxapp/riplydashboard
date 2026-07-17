-- Pending one-time codes for device verification. No RLS policies are
-- granted to anon/authenticated directly — the only way in is the
-- request_device_code/confirm_device_code SECURITY DEFINER functions
-- (see 0003_device_verification_rpc_functions.sql), invoked by the
-- device-verify-* Edge Functions using the caller's own JWT.
create table public.device_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  device_token text not null,
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create unique index device_verifications_user_device_idx
  on public.device_verifications(user_id, device_token);

alter table public.device_verifications enable row level security;

-- Confirmed device trust. Clients may SELECT their own rows (to check
-- "is this device trusted") but have no INSERT/UPDATE/DELETE grants —
-- only confirm_device_code() can write, after independently checking the
-- submitted code against the hash above under a row lock.
create table public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  device_token text not null,
  trusted_at timestamptz not null default now(),
  unique (user_id, device_token)
);

alter table public.trusted_devices enable row level security;

create policy trusted_devices_select on public.trusted_devices
  for select using (auth.uid()::text = user_id);
