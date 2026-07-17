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

  // confirm_device_code is service_role-only and hashes+compares the
  // submitted code itself — the client only ever supplies the plaintext
  // code it received by email, never anything that could substitute for
  // server-side verification.
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: outcome, error: rpcError } = await supabaseAdmin.rpc("confirm_device_code", {
    p_user_id: userId,
    p_device_token: deviceToken,
    p_code: code,
  });
  if (rpcError) return json({ error: rpcError.message }, 500);

  switch (outcome) {
    case "ok":
      return json({ success: true });
    case "not_found":
      return json({ error: "No pending code for this device. Request a new one." }, 400);
    case "expired":
      return json({ error: "Code expired. Request a new one." }, 400);
    case "too_many_attempts":
      return json({ error: "Too many attempts. Request a new code." }, 429);
    case "incorrect":
      return json({ error: "Incorrect code." }, 400);
    default:
      return json({ error: "Unexpected error" }, 500);
  }
});
