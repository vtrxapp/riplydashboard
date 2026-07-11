#!/usr/bin/env node
/**
 * Auth smoke test for dashboard admin signup/signin.
 * Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD, or pass as args.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL ?? 'https://mhraqpmlvviyrkkqdxcd.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocmFxcG1sdnZpeXJra3FkeGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNDA4MzUsImV4cCI6MjA5NzkxNjgzNX0.af-sbDaKDcoxQ_SEgEeEJiJJaasdSEsams0t3e6pCrE';

const email = process.argv[2] ?? process.env.TEST_ADMIN_EMAIL;
const password = process.argv[3] ?? process.env.TEST_ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Usage: npm run test:auth -- <email> <password>');
  console.error('Or set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

console.log(`Auth test for ${email}\n`);

// Try sign-in first (works if account already exists + confirmed)
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

if (!signInError && signInData.session) {
  console.log('✓ Sign-in succeeded');
  const userId = signInData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, name, university, role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.log(`✗ Profile lookup failed: ${profileError.message}`);
    process.exit(1);
  }

  if (profile) {
    console.log(`✓ Profile found: role=${profile.role}, university=${profile.university || '(none)'}`);
  } else {
    console.log('⚠ Signed in but no public.users profile — run supabase/migrations/0001_link_riplyrepo_dashboard.sql');
  }

  const { data: isAdmin } = await supabase.rpc('is_admin');
  console.log(`✓ is_admin() = ${isAdmin}`);

  await supabase.auth.signOut();
  console.log('\nAuth test passed.');
  process.exit(0);
}

console.log(`Sign-in: ${signInError?.message ?? 'no session'}`);

// Try signup for new test accounts
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name: 'Cursor Test Admin',
      university: 'University of Manitoba',
      campus: 'Fort Garry',
      role: 'UMSU Administrator',
    },
  },
});

if (signUpError) {
  console.error(`✗ Signup failed: ${signUpError.message}`);
  process.exit(1);
}

if (signUpData.session) {
  console.log('✓ Signup succeeded with immediate session');
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, university')
    .eq('id', signUpData.user.id)
    .maybeSingle();
  console.log(profile ? `✓ Profile: role=${profile.role}` : '⚠ No profile row yet — apply migration SQL');
  await supabase.auth.signOut();
} else {
  console.log('✓ Signup accepted — confirm email before sign-in (check inbox / disable confirmation in Supabase Auth settings for dev).');
}

console.log('\nAuth test completed.');
