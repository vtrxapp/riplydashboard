import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

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

// See device-verify-request for why this function verifies the Clerk JWT
// itself instead of relying on Supabase's gateway verify_jwt (which doesn't
// understand third-party JWKS trust and would 401 every real request).
const CLERK_ISSUER = Deno.env.get("CLERK_ISSUER") ?? "https://fit-turkey-96.clerk.accounts.dev";
const CLERK_JWKS = createRemoteJWKSet(new URL(`${CLERK_ISSUER}/.well-known/jwks.json`), {
  timeoutDuration: 5000,
});

// Per Clerk's manual-verification docs: signature + issuer alone don't
// enforce which frontend origin a session token was issued to — the `azp`
// claim (echoing the Origin header on the original Clerk request) must be
// checked against an allowlist, or a token that leaked to/was replayed from
// another app under the same Clerk instance would still be accepted here.
const ALLOWED_AZP_ORIGINS = (Deno.env.get("CLERK_ALLOWED_ORIGINS") ?? "https://riplydashboard.vercel.app")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowedOrigin(azp: string | undefined): boolean {
  if (!azp) return false;
  if (ALLOWED_AZP_ORIGINS.includes(azp)) return true;
  // Vercel preview deployments get a unique per-branch subdomain — allow
  // the whole preview pattern for this project/team rather than hardcoding
  // every branch URL.
  try {
    return new URL(azp).hostname.endsWith("-vtrxapps-projects.vercel.app");
  } catch {
    return false;
  }
}

class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Throws AuthError(401) for an invalid/expired/missing/wrong-origin token,
// or AuthError(503) if Clerk's JWKS endpoint itself couldn't be reached — a
// brief JWKS outage shouldn't look identical to a bad token, and either way
// we want it logged instead of silently swallowed.
async function getUserIdFromAuthHeader(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) throw new AuthError("Unauthorized", 401);
  try {
    const { payload } = await jwtVerify(token, CLERK_JWKS, { issuer: CLERK_ISSUER });
    if (typeof payload.sub !== "string") throw new AuthError("Unauthorized", 401);
    const azp = typeof payload.azp === "string" ? payload.azp : undefined;
    if (!isAllowedOrigin(azp)) {
      console.error("device-verify-confirm: rejected token with unrecognized azp", azp);
      throw new AuthError("Unauthorized", 401);
    }
    return payload.sub;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    const code = (err as { code?: string }).code ?? "";
    if (code.startsWith("ERR_JWKS")) {
      console.error("device-verify-confirm: JWKS fetch failed", err);
      throw new AuthError("Auth temporarily unavailable", 503);
    }
    throw new AuthError("Unauthorized", 401);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // See device-verify-request for why this is wrapped: an uncaught throw
  // here would produce a bare 500 with no CORS headers, which browsers
  // surface as an opaque "Failed to fetch" instead of the real message.
  try {
    const userId = await getUserIdFromAuthHeader(req);

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
  } catch (err) {
    if (err instanceof AuthError) return json({ error: err.message }, err.status);
    console.error("device-verify-confirm: unexpected error", err);
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});
