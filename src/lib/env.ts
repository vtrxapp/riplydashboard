/**
 * Centralized, validated access to build-time environment variables.
 *
 * Vite only exposes variables prefixed with `VITE_` to client code (see
 * https://vite.dev/guide/env-and-mode.html). Reading them through this
 * module means a missing/misconfigured deployment fails fast with a clear
 * message instead of silently constructing a broken Supabase client.
 */

export class MissingEnvError extends Error {
  constructor(public readonly missing: string[]) {
    super(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.example to .env.local and fill in your Supabase project credentials.',
    );
    this.name = 'MissingEnvError';
  }
}

export interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  clerkPublishableKey: string;
  appName: string;
}

function readEnv(): AppEnv {
  const raw = import.meta.env;
  const missing: string[] = [];

  if (!raw.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!raw.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!raw.VITE_CLERK_PUBLISHABLE_KEY) missing.push('VITE_CLERK_PUBLISHABLE_KEY');

  if (missing.length > 0) {
    throw new MissingEnvError(missing);
  }

  return {
    supabaseUrl: raw.VITE_SUPABASE_URL,
    supabaseAnonKey: raw.VITE_SUPABASE_ANON_KEY,
    clerkPublishableKey: raw.VITE_CLERK_PUBLISHABLE_KEY,
    appName: raw.VITE_APP_NAME || 'Riply Admin',
  };
}

let cached: AppEnv | null = null;

/** Returns the validated app environment, throwing MissingEnvError once if invalid. */
export function getEnv(): AppEnv {
  if (!cached) {
    cached = readEnv();
  }
  return cached;
}
