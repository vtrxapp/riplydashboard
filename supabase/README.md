# Supabase schema & migrations

This folder contains the full, version-controlled schema for the Riply Admin
dashboard. Previously none of this existed in the repo — the app talked to a
Supabase project whose schema, RLS policies, and triggers lived only in the
dashboard. These migrations formalize that schema (reverse-engineered from
every field `src/services/*` reads/writes) and add what was missing:
real analytics RPCs, notification triggers, and row-level security.

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
| `0001_users_and_auth.sql` | `users` profile table, `role` enum, `handle_new_user()` signup trigger, `is_admin()`/`current_university()` helpers |
| `0002_events_and_engagement.sql` | `events`, `event_views`, `event_rsvps` (+ `attended_at`), `tickets`, `event_likes`, `event_reviews`, count-sync triggers |
| `0003_groups.sql` | `groups`, `group_members`, `group_posts`, `group_events`, count-sync triggers |
| `0004_messaging.sql` | `chats`, `chat_members`, `messages`, last-message-sync trigger |
| `0005_notifications_and_triggers.sql` | `notifications` table + triggers that generate real notifications (event approved/rejected, RSVP milestones, ticket sales, new group members) |
| `0006_analytics_rpc.sql` | Every RPC function the dashboard calls for charts/KPIs — no more hardcoded numbers |
| `0007_row_level_security.sql` | RLS enabled + policies on every table, scoped by university/role |
| `0008_realtime.sql` | Adds tables to the `supabase_realtime` publication |

## Required environment variables

See [.env.example](../.env.example) at the repo root:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Security note

The Supabase anon key that shipped in a previous version of this repo was
hardcoded directly in `src/lib/supabase.js` and committed to git history.
**Rotate that key in the Supabase dashboard** (Project Settings → API) after
merging this change, then set the new value via environment variables /
Cursor secrets — never commit it again.
