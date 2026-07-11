# Supabase schema & migrations

This folder contains the full, version-controlled schema for the Riply Admin
dashboard. These migrations formalize the schema (reverse-engineered from
every field `src/services/*` reads/writes) and add what was missing: real
analytics RPCs, notification triggers, and row-level security.

## Authentication: Clerk as a Third-Party Auth provider

This app authenticates admins via **Clerk**, not Supabase's own email/password
auth. Supabase supports this natively via
[Third-Party Auth](https://supabase.com/docs/guides/auth/third-party/clerk) —
it verifies Clerk-issued JWTs directly against Clerk's JWKS endpoint. There is
**no `auth.users` row** for these admins and no shared JWT secret; that's why
`public.users.id` is plain `text` holding Clerk's user id (e.g. `user_2abC...`)
rather than a uuid foreign key into `auth.users`.

**You must configure this link yourself in both dashboards before the app can
authenticate against this project:**

1. In the **Clerk Dashboard**, open the
   [Supabase integration setup page](https://dashboard.clerk.com/setup/supabase),
   activate it, and copy the **Clerk domain** it shows you (this is your
   publishable key's frontend API host — e.g. for
   `pk_test_YmVsb3ZlZC1zY29ycGlvbi03MS5jbGVyay5hY2NvdW50cy5kZXYk` that's
   `beloved-scorpion-71.clerk.accounts.dev`).
2. In the **Supabase Dashboard**, for *this* project, go to
   Authentication → Sign In / Up → Third-Party Auth → **Add provider → Clerk**,
   and paste that domain.
3. If you use the Supabase CLI locally, also add to `supabase/config.toml`:
   ```toml
   [auth.third_party.clerk]
   enabled = true
   domain = "beloved-scorpion-71.clerk.accounts.dev"
   ```

Every RLS policy and RPC function reads the current user's id via
`public.clerk_user_id()` (the JWT's `sub` claim) instead of Supabase Auth's
`auth.uid()` — see `0001_users_and_auth.sql`.

There is no more signup trigger populating `public.users` (nothing ever
inserts into `auth.users` for a Clerk login, so a trigger on that table would
never fire). Instead, the app's onboarding screen
(`src/features/auth/OnboardingPage.tsx`) inserts the profile row itself,
right after a new Clerk sign-up, via the `users_insert_self` RLS policy.

## Applying the migrations

You need the [Supabase CLI](https://supabase.com/docs/guides/cli) and a
personal access token / project link.

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

If you don't want to install the CLI, you can instead paste each file in
`supabase/migrations/` (in numeric order) into the Supabase Dashboard's
SQL Editor and run it once.

All migrations are written to be **idempotent** — safe to re-run, and safe
to run against a project that already has some of these tables (they use
`create table if not exists`, `add column if not exists`,
`create or replace function`, and a small helper for
`create policy`-if-missing).

## What's in here

| File | Purpose |
| --- | --- |
| `0001_users_and_auth.sql` | `users` profile table (Clerk-keyed, `text` id), `role` enum, `clerk_user_id()`/`is_admin()`/`current_university()`/`has_profile()` helpers |
| `0002_events_and_engagement.sql` | `events`, `event_views`, `event_rsvps` (+ `attended_at`), `tickets`, `event_likes`, `event_reviews`, count-sync triggers |
| `0003_groups.sql` | `groups`, `group_members`, `group_posts`, `group_events`, count-sync triggers |
| `0004_messaging.sql` | `chats`, `chat_members`, `messages`, last-message-sync trigger |
| `0005_notifications_and_triggers.sql` | `notifications` table + triggers that generate real notifications (event approved/rejected, RSVP milestones, ticket sales, new group members) |
| `0006_analytics_rpc.sql` | Every RPC function the dashboard calls for charts/KPIs — no more hardcoded numbers |
| `0007_row_level_security.sql` | RLS enabled + policies on every table, scoped by university/role, keyed off the Clerk JWT |
| `0008_realtime.sql` | Adds tables to the `supabase_realtime` publication |

## Required environment variables

See [.env.example](../.env.example) at the repo root:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_CLERK_PUBLISHABLE_KEY=...
```

## Security notes

- The Supabase anon key that shipped in a previous version of this repo was
  hardcoded directly in source and committed to git history. **Rotate that
  key in the Supabase dashboard** (Project Settings → API), then set the new
  value via environment variables / Cursor secrets — never commit it again.
- The onboarding insert policy (`users_insert_self`) currently lets a
  newly-signed-up admin self-declare any role, including `umsu_admin` — this
  matches the original app's signup form (a plain "select your role"
  dropdown, unverified). Fine for a pilot; a real rollout should gate
  elevated roles behind an invite or an existing admin's approval instead.
