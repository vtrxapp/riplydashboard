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

// The Authorization header carries the Clerk-issued JWT that Supabase's
// third-party auth integration already validated before invoking this
// function (verify_jwt: true). We only need to read the `sub` claim — no
// need to re-verify the signature ourselves.
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

function generateCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const n = 100000 + (buf[0] % 900000);
  return String(n);
}

// Fetch the account's real registered email from Clerk's Backend API —
// never trust a client-supplied email address here, or an attacker could
// redirect the code to an inbox they control.
async function fetchClerkEmail(userId: string): Promise<string | null> {
  const secretKey = Deno.env.get("CLERK_SECRET_KEY");
  if (!secretKey) throw new Error("CLERK_SECRET_KEY not configured");
  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  const primaryId = user.primary_email_address_id;
  const match = (user.email_addresses ?? []).find((e: { id: string }) => e.id === primaryId);
  return match?.email_address ?? user.email_addresses?.[0]?.email_address ?? null;
}

async function sendEmail(to: string, code: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Deno.env.get("DEVICE_CODE_FROM_EMAIL") ?? "Riply Admin <onboarding@resend.dev>",
      to,
      subject: "Your Riply device verification code",
      html: `<p>Your verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error: ${res.status} ${text}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const userId = getUserIdFromAuthHeader(req);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  let body: { device_token?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const deviceToken = body.device_token;
  if (!deviceToken || typeof deviceToken !== "string") {
    return json({ error: "device_token is required" }, 400);
  }

  const email = await fetchClerkEmail(userId);
  if (!email) return json({ error: "Could not resolve account email" }, 400);

  const code = generateCode();
  const codeHash = await hashCode(code, userId, deviceToken);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error: upsertError } = await supabaseAdmin
    .from("device_verifications")
    .upsert(
      { user_id: userId, device_token: deviceToken, code_hash: codeHash, attempts: 0, expires_at: expiresAt },
      { onConflict: "user_id,device_token" },
    );
  if (upsertError) return json({ error: upsertError.message }, 500);

  try {
    await sendEmail(email, code);
  } catch (err) {
    return json({ error: (err as Error).message }, 502);
  }

  return json({ success: true });
});
