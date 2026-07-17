create index device_verifications_expires_at_idx
  on public.device_verifications(expires_at);

-- Atomically claims a slot to send a new device-verification code.
-- Uses an advisory lock (keyed on user+device) to fully serialize concurrent
-- calls even before any row exists, plus a 30s cooldown against repeat
-- requests, closing the "unlimited requests / email bombing" gap. Runs as
-- the calling user (auth.uid()) via SECURITY DEFINER so it can write to
-- device_verifications despite that table having zero client-facing RLS
-- grants.
create or replace function public.request_device_code(
  p_device_token text,
  p_code_hash text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_existing record;
begin
  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id || ':' || p_device_token, 0));

  -- Opportunistic cleanup of this user's own expired codes.
  delete from public.device_verifications
  where user_id = v_user_id and expires_at < now();

  select * into v_existing
  from public.device_verifications
  where user_id = v_user_id and device_token = p_device_token
  for update;

  if found and v_existing.created_at > now() - interval '30 seconds' then
    return false; -- cooldown active; caller should not send another email
  end if;

  insert into public.device_verifications (user_id, device_token, code_hash, attempts, expires_at, created_at)
  values (v_user_id, p_device_token, p_code_hash, 0, p_expires_at, now())
  on conflict (user_id, device_token)
  do update set code_hash = excluded.code_hash, attempts = 0, expires_at = excluded.expires_at, created_at = now();

  return true;
end;
$$;

revoke all on function public.request_device_code(text, text, timestamptz) from public;
grant execute on function public.request_device_code(text, text, timestamptz) to authenticated;

-- Atomically checks a submitted code against the stored hash and, on match,
-- consumes it and records trust — all under a row lock (plus an advisory
-- lock) so concurrent guesses can't all read the same `attempts` value and
-- defeat the 5-attempt limit, and a failed trust insert can't happen after
-- the code was already consumed (single transaction, single statement
-- sequence, no separate delete-then-upsert round trip from the client).
create or replace function public.confirm_device_code(
  p_device_token text,
  p_code_hash text
)
returns text -- 'ok' | 'not_found' | 'expired' | 'too_many_attempts' | 'incorrect'
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_row record;
begin
  if v_user_id is null then
    raise exception 'unauthorized';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id || ':' || p_device_token, 1));

  select * into v_row
  from public.device_verifications
  where user_id = v_user_id and device_token = p_device_token
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_row.expires_at < now() then
    delete from public.device_verifications where id = v_row.id;
    return 'expired';
  end if;

  if v_row.attempts >= 5 then
    delete from public.device_verifications where id = v_row.id;
    return 'too_many_attempts';
  end if;

  if v_row.code_hash <> p_code_hash then
    update public.device_verifications set attempts = attempts + 1 where id = v_row.id;
    return 'incorrect';
  end if;

  delete from public.device_verifications where id = v_row.id;
  insert into public.trusted_devices (user_id, device_token)
  values (v_user_id, p_device_token)
  on conflict (user_id, device_token) do update set trusted_at = now();

  return 'ok';
end;
$$;

revoke all on function public.confirm_device_code(text, text) from public;
grant execute on function public.confirm_device_code(text, text) to authenticated;
