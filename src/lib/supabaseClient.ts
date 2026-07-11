import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env';

const env = getEnv();

/**
 * Single shared Supabase client for the whole app. Auth tokens are persisted
 * and refreshed automatically by supabase-js (silent refresh before expiry),
 * and `onAuthStateChange` (wired in `features/auth`) keeps React state in
 * sync with that refresh cycle.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
