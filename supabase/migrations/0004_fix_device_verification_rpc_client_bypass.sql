-- CRITICAL FIX: the previous request_device_code/confirm_device_code took a
-- client-supplied p_code_hash and were EXECUTE-granted to `authenticated`.
-- That meant any signed-in browser could call request_device_code with a
-- hash of its own choosing, then immediately call confirm_device_code with
-- the same hash — creating trust without ever receiving or knowing a real
-- code. Fixed by: hashing the code *inside* Postgres (via pgcrypto) so the
-- client only ever supplies the raw code it received by email, and
-- restricting EXECUTE to service_role only — so the Edge Functions (which
-- validate the Clerk JWT themselves and pass a verified user id) are the
-- only possible caller.
--
-- Also fixes: the cooldown in request_device_code was keyed on
-- (user_id, device_token), so rotating device_token bypassed it entirely.
-- Now keyed on user_id alone (most recent pending code across all that
-- user's devices).
drop function if exists public.request_device_code(text, text, timestamptz);
drop function if exists public.confirm_device_code(text, text);

create or replace function public.request_device_code(
  p_user_id text,
  p_device_token text,
  p_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_existing record;
  v_code_hash text;
begin
  if p_user_id is null or p_device_token is null or p_code is null then
    raise exception 'invalid arguments';
  end if;

  -- Locked per-user (not per-device) so rotating device_token can't be used
  -- to dodge the cooldown below.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id, 0));

  delete from public.device_verifications
  where user_id = p_user_id and expires_at < now();

  select * into v_existing
  from public.device_verifications
  where user_id = p_user_id
  order by created_at desc
  limit 1
  for update;

  if found and v_existing.created_at > now() - interval '30 seconds' then
    return false; -- cooldown active; caller should not send another email
  end if;

  v_code_hash := encode(digest(p_code || ':' || p_user_id || ':' || p_device_token, 'sha256'), 'hex');

  insert into public.device_verifications (user_id, device_token, code_hash, attempts, expires_at, created_at)
  values (p_user_id, p_device_token, v_code_hash, 0, now() + interval '10 minutes', now())
  on conflict (user_id, device_token)
  do update set code_hash = excluded.code_hash, attempts = 0, expires_at = excluded.expires_at, created_at = now();

  return true;
end;
$$;

revoke all on function public.request_device_code(text, text, text) from public, authenticated, anon;
grant execute on function public.request_device_code(text, text, text) to service_role;

create or replace function public.confirm_device_code(
  p_user_id text,
  p_device_token text,
  p_code text
)
returns text -- 'ok' | 'not_found' | 'expired' | 'too_many_attempts' | 'incorrect'
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row record;
  v_code_hash text;
begin
  if p_user_id is null or p_device_token is null or p_code is null then
    raise exception 'invalid arguments';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id || ':' || p_device_token, 1));

  select * into v_row
  from public.device_verifications
  where user_id = p_user_id and device_token = p_device_token
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

  v_code_hash := encode(digest(p_code || ':' || p_user_id || ':' || p_device_token, 'sha256'), 'hex');

  if v_row.code_hash <> v_code_hash then
    update public.device_verifications set attempts = attempts + 1 where id = v_row.id;
    return 'incorrect';
  end if;

  delete from public.device_verifications where id = v_row.id;
  insert into public.trusted_devices (user_id, device_token)
  values (p_user_id, p_device_token)
  on conflict (user_id, device_token) do update set trusted_at = now();

  return 'ok';
end;
$$;

revoke all on function public.confirm_device_code(text, text, text) from public, authenticated, anon;
grant execute on function public.confirm_device_code(text, text, text) to service_role;

-- Scheduled sweep for abandoned codes nobody ever came back to confirm
-- (the opportunistic per-user cleanup above only fires for users who make
-- another request).
select cron.schedule(
  'cleanup-expired-device-verifications',
  '*/15 * * * *',
  $$delete from public.device_verifications where expires_at < now()$$
);
