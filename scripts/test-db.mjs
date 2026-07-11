#!/usr/bin/env node
/**
 * Read-only smoke test: verifies riplydashboard can read riplyrepo data.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL ?? 'https://mhraqpmlvviyrkkqdxcd.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocmFxcG1sdnZpeXJra3FkeGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNDA4MzUsImV4cCI6MjA5NzkxNjgzNX0.af-sbDaKDcoxQ_SEgEeEJiJJaasdSEsams0t3e6pCrE';

const supabase = createClient(url, key);

const checks = [
  ['users', () => supabase.from('users').select('id, email, role', { count: 'exact', head: true })],
  ['groups', () => supabase.from('groups').select('id, name', { count: 'exact', head: true })],
  ['events', () => supabase.from('events').select('id, title, status', { count: 'exact', head: true })],
  ['event_rsvps', () => supabase.from('event_rsvps').select('event_id', { count: 'exact', head: true })],
  ['group_members', () => supabase.from('group_members').select('id', { count: 'exact', head: true })],
  ['notifications', () => supabase.from('notifications').select('id', { count: 'exact', head: true })],
  ['is_admin rpc', () => supabase.rpc('is_admin')],
];

let failed = 0;

console.log(`Testing Supabase connection: ${url}\n`);

for (const [name, run] of checks) {
  const { data, error, count } = await run();
  if (error) {
    console.log(`✗ ${name}: ${error.message}`);
    failed += 1;
  } else if (name === 'is_admin rpc') {
    console.log(`✓ ${name}: ${data}`);
  } else {
    console.log(`✓ ${name}: ${count ?? 0} rows`);
  }
}

if (failed) {
  console.log(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log('\nAll connectivity checks passed. riplydashboard can read shared riplyrepo tables.');
