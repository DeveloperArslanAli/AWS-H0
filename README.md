# AuroraGuard

**AI-powered database observability and query optimization.** AuroraGuard
monitors your database fleet, surfaces slow queries and anomalies, and uses AI
(with a deterministic static-analysis fallback) to recommend optimized rewrites
and indexes.

Built with Next.js 16 (App Router), Supabase (Postgres + Auth + RLS), and the
Vercel AI Gateway. Designed for a clean migration to AWS (Aurora + Bedrock)
when the team is ready — see [`docs/MIGRATION-AWS.md`](docs/MIGRATION-AWS.md).

---

## Features

- **Observability dashboard** — CPU, QPS, p95 latency, cache hit ratio, storage, and active connections as live time-series charts.
- **Connections** — register and manage Postgres/MySQL/Aurora connections with health status and SSL state.
- **Query insights** — sortable, filterable table of top queries by total/mean execution time, call volume, and rows read, classified healthy/slow/critical.
- **AI Query Optimizer** — paste SQL, get a diagnosis, an optimized rewrite, index suggestions, and an estimated improvement. Falls back to a built-in rule-based analyzer when AI is unavailable.
- **Alerts** — severity-graded alerts with acknowledge/resolve workflow.
- **Plans & billing** — Free / Pro / Enterprise tiers with usage meters (Stripe wiring deferred).
- **Auth** — Supabase email + password with email confirmation and per-user Row Level Security.

## Tech stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Framework    | Next.js 16 (App Router, Server Components, Actions)   |
| Language     | TypeScript                                            |
| UI           | Tailwind CSS v4, shadcn/ui (base-ui), Recharts        |
| Database     | Supabase Postgres with Row Level Security             |
| Auth         | Supabase Auth (email + password)                      |
| AI           | Vercel AI Gateway (`ai` SDK) + heuristic fallback     |
| Hosting      | Vercel                                                |
| CI/CD        | GitHub Actions + Vercel CLI                           |

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Supabase project

### Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in your Supabase values
pnpm dev
```

Apply the database schema (one time) by running
[`supabase/migrations/0001_core_schema.sql`](supabase/migrations/0001_core_schema.sql)
against your Supabase project (via the Supabase SQL editor or the Supabase CLI).

Demo data (connections, queries, metrics, alerts) is **seeded automatically**
on first dashboard load per user — no manual step required.

### Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start the dev server                 |
| `pnpm build`     | Production build                     |
| `pnpm start`     | Run the production build             |
| `pnpm lint`      | Lint with Next.js ESLint             |
| `pnpm typecheck` | Type-check with `tsc --noEmit`       |

## Environment variables

See [`.env.example`](.env.example). At minimum you need:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

The AI optimizer uses the Vercel AI Gateway and degrades gracefully to a
deterministic analyzer if no AI credits/keys are configured.

## Project structure

```
app/
  actions/         # Server Actions (auth, connections, alerts, optimize, profile, seed)
  auth/            # Login, sign-up, callback, error pages
  dashboard/       # Overview, connections, queries, optimizer, alerts, billing, settings
  page.tsx         # Marketing landing page
components/
  marketing/       # Landing page sections
  dashboard/       # Dashboard chrome, charts, tables, dialogs
  ui/              # shadcn/ui primitives
lib/
  supabase/        # Browser/server clients + session proxy
  ai/              # Swappable AI provider + heuristic analyzer
  data.ts          # User-scoped data access layer
  demo-data.ts     # Deterministic demo data generator
  plans.ts         # Plan tiers and limits
supabase/migrations/  # Version-controlled SQL schema
.github/workflows/    # CI, preview deploy, production deploy, CodeQL
```

## CI/CD

See [`docs/CI-CD.md`](docs/CI-CD.md) for the full pipeline description and the
required GitHub secrets.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## License

Proprietary — © AuroraGuard.
