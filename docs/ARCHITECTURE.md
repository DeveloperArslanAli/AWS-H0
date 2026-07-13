# Architecture

## High-level

AuroraGuard is a Next.js 16 App Router application. Server Components and Server
Actions talk directly to Supabase (Postgres + Auth). All data access is scoped
to the authenticated user by **Row Level Security**, with Server Actions adding
a defense-in-depth `auth.uid()` check.

```
┌──────────────┐     ┌─────────────────────────────┐     ┌───────────────┐
│   Browser    │◀───▶│  Next.js 16 (Vercel)        │◀───▶│   Supabase    │
│ (RSC + CSR)  │     │  - Server Components         │     │  - Postgres   │
│              │     │  - Server Actions           │     │  - Auth       │
│              │     │  - Middleware (session)     │     │  - RLS        │
└──────────────┘     └──────────────┬──────────────┘     └───────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │  Vercel AI Gateway     │
                        │  (query optimizer)     │
                        │  + heuristic fallback  │
                        └───────────────────────┘
```

## Data model

| Table            | Purpose                                              | Owner column |
| ---------------- | ---------------------------------------------------- | ------------ |
| `profiles`       | User profile + plan tier (1:1 with `auth.users`)     | `id`         |
| `db_connections` | Registered database connections                      | `user_id`    |
| `queries`        | Captured query stats (calls, exec time, rows, status)| `user_id`    |
| `metrics`        | Time-series resource metrics per connection          | `user_id`    |
| `alerts`         | Threshold/anomaly alerts with status workflow        | `user_id`    |
| `optimizations`  | History of AI/heuristic query optimizations          | `user_id`    |

Every table has RLS enabled with owner-scoped `select/insert/update/delete`
policies. A `security definer` trigger (`handle_new_user`) auto-creates a
`profiles` row on signup so the app never writes to a protected table before a
session exists.

See [`supabase/migrations/0001_core_schema.sql`](../supabase/migrations/0001_core_schema.sql).

## Key modules

- **`lib/supabase/`** — `client.ts` (browser), `server.ts` (RSC/actions), `proxy.ts` (session refresh in middleware).
- **`lib/data.ts`** — typed, user-scoped read helpers used by Server Components.
- **`lib/ai/provider.ts`** — single source of truth for the model string. Swapping to AWS Bedrock is a one-line change here.
- **`lib/ai/heuristic-analyzer.ts`** — deterministic SQL analyzer used as the fallback path (and as a useful baseline even with AI on).
- **`lib/demo-data.ts`** + **`app/actions/seed.ts`** — idempotent per-user seeding so every account has a live, demoable dashboard.
- **`lib/plans.ts`** — plan tiers, prices, and limits; consumed by pricing + billing.

## Request lifecycle

1. `middleware.ts` runs the Supabase session proxy to refresh tokens and gate `/dashboard/*`.
2. The dashboard layout fetches the user + profile and triggers idempotent seeding.
3. Server Components read user-scoped data via `lib/data.ts`.
4. Mutations (add connection, acknowledge alert, optimize query, update profile) run as Server Actions and `revalidatePath`.

## Security

- RLS on every table; Server Actions also verify `auth.uid()`.
- Email confirmation required before authenticated writes.
- Security headers set in `vercel.json` (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
- No secrets in the client bundle; service role key is server-only.
- CodeQL SAST in CI.

## Scalability notes

- Stateless app tier scales horizontally on Vercel.
- Indexes on all foreign keys and hot filter columns (`status`, `connection_id`, `ts`).
- Time-series `metrics` is the highest-volume table; partition by range on `ts` (or move to a TSDB) when volume grows.
- The AI optimizer is provider-agnostic and rate-limit tolerant via the fallback analyzer.
