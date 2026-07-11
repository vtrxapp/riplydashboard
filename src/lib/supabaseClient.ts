import { createClient } from '@supabase/supabase-js';
import { getToken } from '@clerk/react';
import { getEnv } from './env';

const env = getEnv();

/**
 * Single shared Supabase client for the whole app.
 *
 * Auth is handled entirely by Clerk (see `features/auth`), configured in the
 * Supabase dashboard as a Third-Party Auth provider (Authentication -> Sign
 * In / Up -> Third-Party Auth -> Clerk). Supabase verifies Clerk's
 * session token directly against Clerk's JWKS endpoint — there is no
 * shared secret and no custom JWT template involved.
 *
 * `accessToken` is called by supabase-js before every request, so this
 * client can be a module-level singleton even though the token itself comes
 * from React state managed by ClerkProvider: `getToken()` (the standalone,
 * outside-React export from `@clerk/react`) waits for Clerk to finish
 * loading and always returns the current session's token.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  accessToken: async () => (await getToken()) ?? null,
});
