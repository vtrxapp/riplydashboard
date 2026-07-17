import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function getUserIdFromAuthHeader(req: Request): string | null {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

async function hashCode(code: string, userId: string, deviceToken: string) {
  const enc = new TextEncoder();
  const data = enc.encode(`${code}:${userId}:${deviceToken}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const MAX_ATTEMPTS = 5;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  let body: { device_token?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const deviceToken = body.device_token;
  const code = body.code;
  if (!deviceToken || typeof deviceToken !== "string" || !code || typeof code !== "string") {
    return json({ error: "device_token and code are required" }, 400);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: pending, error: fetchError } = await supabaseAdmin
    .from("device_verifications")
    .select("*")
    .eq("user_id", userId)
    .eq("device_token", deviceToken)
    .maybeSingle();

  if (fetchError) return json({ error: fetchError.message }, 500);
  if (!pending) return json({ error: "No pending code for this device. Request a new one." }, 400);

  if (new Date(pending.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from("device_verifications").delete().eq("id", pending.id);
    return json({ error: "Code expired. Request a new one." }, 400);
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    await supabaseAdmin.from("device_verifications").delete().eq("id", pending.id);
    return json({ error: "Too many attempts. Request a new code." }, 429);
  }

  const submittedHash = await hashCode(code, userId, deviceToken);
  if (submittedHash !== pending.code_hash) {
    await supabaseAdmin
      .from("device_verifications")
      .update({ attempts: pending.attempts + 1 })
      .eq("id", pending.id);
    return json({ error: "Incorrect code." }, 400);
  }

  // Correct code — consume it and record trust. This is the only code path
  // in the whole app that can write to trusted_devices; clients have no
  // RLS grant to do it themselves.
  await supabaseAdmin.from("device_verifications").delete().eq("id", pending.id);

  const { error: trustError } = await supabaseAdmin
    .from("trusted_devices")
    .upsert(
      { user_id: userId, device_token: deviceToken },
      { onConflict: "user_id,device_token" },
    );
  if (trustError) return json({ error: trustError.message }, 500);

  return json({ success: true });
});
