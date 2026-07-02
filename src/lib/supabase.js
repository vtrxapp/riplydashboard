import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mhraqpmlvviyrkkqdxcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocmFxcG1sdnZpeXJra3FkeGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNDA4MzUsImV4cCI6MjA5NzkxNjgzNX0.af-sbDaKDcoxQ_SEgEeEJiJJaasdSEsams0t3e6pCrE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
