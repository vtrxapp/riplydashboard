import { supabase } from './supabase';

// A per-browser random identifier — not a trust flag. Whether this device
// is actually trusted lives server-side in the trusted_devices table;
// clients have no write access to it (see the device-verify-* Edge
// Functions). This token just tags which row belongs to this browser.
const TOKEN_KEY = 'riply_device_token';

let sessionFallbackToken = null;

export function getDeviceToken() {
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    // localStorage unavailable (private browsing, storage disabled, etc.) —
    // fall back to an in-memory token so the flow still works for this
    // session, just without persistence across reloads.
    if (!sessionFallbackToken) sessionFallbackToken = crypto.randomUUID();
    return sessionFallbackToken;
  }
}

export async function isDeviceTrusted() {
  const deviceToken = getDeviceToken();
  const { data, error } = await supabase
    .from('trusted_devices')
    .select('id')
    .eq('device_token', deviceToken)
    .maybeSingle();
  return !error && Boolean(data);
}

// supabase.functions.invoke() does NOT use the client's `accessToken`
// callback the way .from()/.rpc() do — it never attaches the Clerk-derived
// Authorization header on its own, so the Edge Functions' own auth check
// (which reads the `sub` claim from that header) always saw an unauthorized
// request. Fetch the Clerk token explicitly and pass it through.
async function authHeaders() {
  const token = await window.Clerk?.session?.getToken();
  if (!token) throw new Error('Not signed in');
  return { Authorization: `Bearer ${token}` };
}

export async function requestDeviceCode() {
  const deviceToken = getDeviceToken();
  const { data, error } = await supabase.functions.invoke('device-verify-request', {
    body: { device_token: deviceToken },
    headers: await authHeaders(),
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

export async function confirmDeviceCode(code) {
  const deviceToken = getDeviceToken();
  const { data, error } = await supabase.functions.invoke('device-verify-confirm', {
    body: { device_token: deviceToken, code },
    headers: await authHeaders(),
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
