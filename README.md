# Riply Admin

Production analytics dashboard for Riply university administrators — events,
groups, users, engagement funnel, real-time activity, and moderator
messaging, backed entirely by Supabase (Postgres + Auth + Realtime).

## Stack

- **React 18 + TypeScript + Vite** — SPA with route-level code splitting.
- **React Router v6** (`createBrowserRouter`) for routing.
- **TanStack Query** for server-state fetching, caching, and optimistic
  mutations.
- **Zustand** for small cross-cutting UI state (theme, scope, date range,
  toasts) — persisted to `localStorage`.
- **Zod** for runtime validation of every API/RPC response and every form.
- **Recharts** for charts (line/area, bar, donut).
- **Supabase** (Postgres, Auth, Realtime, RLS, RPC) as the entire backend —
  see [`supabase/README.md`](supabase/README.md) for schema/migrations.
- **Vitest + React Testing Library** for tests.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project credentials
npm run dev
```

### Required environment variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public API key |
| `VITE_APP_NAME` | Optional — overrides the app name shown in the UI |

The app fails fast with a clear error (see `src/lib/env.ts`) if these are
missing, instead of silently constructing a broken Supabase client.

### Database

Nothing in this app hits a custom backend server — all data access goes
through Supabase's PostgREST API, Postgres RPC functions (for analytics
aggregation), and Realtime (for live updates). The full schema, RLS
policies, triggers, and analytics RPCs are version-controlled under
[`supabase/migrations`](supabase/migrations). See
[`supabase/README.md`](supabase/README.md) for how to apply them.

## Scripts

```bash
npm run dev         # start the Vite dev server
npm run build       # type-check + production build
npm run typecheck   # tsc --noEmit
npm run lint         # ESLint
npm run test         # run the Vitest suite once
npm run test:watch  # Vitest in watch mode
npm run format       # Prettier
```

## Architecture

```
src/
  app/               App shell: router, providers, layout, sidebar/header
  features/          One folder per screen (auth, overview, events, groups,
                      funnel, users, activity, messages, create-event) —
                      each owns its page component + any page-specific
                      sub-components/schemas.
  components/
    ui/              Design-system primitives (Card, Button, Badge, Table
                      helpers, Skeleton, EmptyState, ErrorState, Toast, ...)
    charts/          Recharts wrappers (Sparkline, DualAreaChart,
                      SimpleBarChart, DonutChart)
  hooks/
    queries/         TanStack Query hooks + query-key factory, one module
                      per domain, plus the realtime -> cache bridge
    useDebouncedValue.ts, useMediaQuery.ts, usePagination.ts
  services/          Typed Supabase/RPC wrappers — the only files that
                      import the Supabase client directly
  types/             Zod schemas + inferred TS types (domain models)
  stores/             Zustand UI store
  lib/                supabaseClient, queryClient, env validation, error
                      normalization
  utils/              Formatters, shared constants, validation helpers
  styles/             CSS variable design tokens + global utility classes
supabase/
  migrations/         Versioned SQL schema, RLS, triggers, analytics RPCs
```

### Authentication & roles

- Supabase Auth handles sign-up/sign-in/password-reset/session refresh.
- `features/auth/AuthProvider` exposes `{ session, profile, role, status }`
  to the whole app; `RouteGuard` protects `/admin/dashboard/*`, and
  `RoleGuard`/`useHasRole` gate moderation actions (approve/reject events)
  to `umsu_admin`/`staff` roles.
- Roles (`organizer`, `staff`, `umsu_admin`) are enforced server-side via
  Postgres RLS policies, not just hidden in the UI.

### Data flow

Every chart/table is backed by a real query: either a filtered/paginated
PostgREST query (events, groups, users, messages) or a Postgres RPC function
written specifically for that chart (KPI deltas, engagement trend, member
growth, category/status breakdowns, active hours, retention curve, rating
distribution, funnel, live activity snapshot). Nothing in the UI reads from
a hardcoded array.
