# Riply Supabase setup (riplyrepo + riplydashboard)

Both apps share **riply's Project** (`mhraqpmlvviyrkkqdxcd`):

| App | Auth | User ids in `public.users` |
| --- | --- | --- |
| **riplyrepo** (student app) | Clerk | `user_…` Clerk ids |
| **riplydashboard** (admin app) | Supabase email/password | `auth.users` uuid as text |

## Apply migrations

### Option A — Supabase SQL Editor (quickest)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/mhraqpmlvviyrkkqdxcd/sql/new) → SQL Editor.
2. Paste and run `supabase/migrations/0001_link_riplyrepo_dashboard.sql`.

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref mhraqpmlvviyrkkqdxcd
npx supabase db push
```

### Option C — Node script (needs database password)

```bash
export DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
npm run db:migrate
```

Find the connection string under **Project Settings → Database → Connection string (URI)**.

## Dashboard environment variables

Copy `.env.example` to `.env.local`:

```
VITE_SUPABASE_URL=https://mhraqpmlvviyrkkqdxcd.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Get keys from **Project Settings → API**.

## Authentication flow

1. Admin signs up at `/admin/auth` with university, name, role, email, password.
2. Supabase Auth creates `auth.users` row.
3. `handle_new_user()` trigger inserts matching row into `public.users` with mapped role:
   - Club Organizer → `organizer`
   - Department Staff → `staff`
   - UMSU Administrator → `umsu_admin`
4. After email confirmation, admin signs in and the dashboard reads live riplyrepo data (users, groups, events, RSVPs, etc.).

## Test

```bash
npm install
npm run test:db      # read-only connectivity against shared tables
npm run test:auth    # signup/signin smoke test (optional TEST_ADMIN_* env vars)
npm run dev          # http://localhost:5173/admin/auth
```

## riplyrepo checklist

Ensure the student app uses the same project:

```
SUPABASE_URL=https://mhraqpmlvviyrkkqdxcd.supabase.co
SUPABASE_ANON_KEY=<same anon key>
```

Clerk must remain configured as a Supabase Third-Party Auth provider if riplyrepo uses Clerk JWTs.
