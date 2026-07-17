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

  const codeHash = await hashCode(code, userId, deviceToken);

  // Invoke as the caller so auth.uid() inside the function matches — the
  // function does the compare/consume/trust-write atomically under a row
  // lock, so concurrent guesses can't defeat the attempt limit and a failed
  // trust insert can't happen after the code was already consumed.
  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
  );

  const { data: outcome, error: rpcError } = await supabaseUser.rpc("confirm_device_code", {
    p_device_token: deviceToken,
    p_code_hash: codeHash,
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
