Here is the complete Technical Requirements Document (TRD) for AuroraGuard, incorporating all architectural, technical, and implementation details for the hackathon build.

---

# 🛠️ AuroraGuard — Technical Requirements Document (TRD)

**Document Version:** 1.0  
**Date:** 2026-06-17  
**Author:** Product Architect / Full-Stack Engineer  
**Project:** AuroraGuard – AI-Powered Database Cost & Performance Guardian  
**Hackathon:** H0: Hack the Zero Stack (Amazon + Vercel)  
**Track:** Track 2 – Monetizable B2B Application  
**Build Budget:** $0.00 (All free tiers + hackathon credits)

---

## 1. System Overview

AuroraGuard is a full‑stack SaaS application that monitors AWS database query performance, detects cost anomalies using AI, and provides one‑click optimizations. The system consists of:

- A Next.js 14 frontend deployed on Vercel (v0‑scaffolded, Tailwind + shadcn/ui)
- A serverless API layer (tRPC / Next.js API routes) co‑located with the frontend
- Amazon Aurora PostgreSQL as the primary database (free tier)
- Amazon Bedrock (Claude 3 Haiku) for AI‑powered query analysis
- Clerk for authentication
- External integrations: Resend (email), Slack/Discord webhooks, Stripe (test mode)

All components run entirely within free tiers and hackathon‑provided credits. The MVP focuses on Aurora PostgreSQL monitoring with simulated query data ingestion.

---

## 2. Architecture Diagrams

### 2.1 High‑Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      USER BROWSER                         │
│   Dashboard │ Query Optimizer │ Alerts │ Landing Page     │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │          Next.js 14 App Router                      │  │
│  │  • Pages (SSR / ISR / SSG)                         │  │
│  │  • tRPC API Routes                                  │  │
│  │  • Clerk Middleware (auth)                          │  │
│  │  • Edge Functions (rate limiting)                   │  │
│  └───────────────────┬────────────────────────────────┘  │
└──────────────────────┼───────────────────────────────────┘
                       │
           ┌───────────┴──────────────┐
           ▼                          ▼
┌──────────────────┐     ┌──────────────────────────┐
│   Clerk (Auth)   │     │    Amazon Bedrock         │
│   JWT / Session  │     │    Claude 3 Haiku         │
└──────────────────┘     └──────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                AWS CLOUD (Free Tier)                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │         Amazon Aurora PostgreSQL                     │  │
│  │  • db.t4g.medium, 20 GB                             │  │
│  │  • Extensions: pg_stat_statements, pgvector,         │  │
│  │    uuid‑ossp, pgcrypto                               │  │
│  │  • Row‑Level Security (multi‑tenant)                 │  │
│  │  • Partitioning on `captured_queries`                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────────────────┐                            │
│  │  AWS Lambda (optional)   │  Future: query log polling │
│  └──────────────────────────┘                            │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│            EXTERNAL SERVICES (Free Tiers)                  │
│  • Resend (email notifications)                           │
│  • Slack / Discord Webhooks                               │
│  • Stripe Test Mode (subscription simulation)             │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow (Query Optimization Request)

```
User pastes SQL → Next.js API route → Bedrock (Claude 3 Haiku)
       │                                        │
       │  Response: JSON with issues,            │
       │  optimized_query, index DDL             │
       ▼                                        │
   Cache result in memory (30 min TTL)          │
       │                                        │
       ▼                                        │
   Store analysis in Aurora (`query_analyses`)  │
       │                                        │
       ▼                                        │
   Return to frontend → Display in card layout
```

---

## 3. Technology Stack & Versions

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 14.x (App Router) | SSR/ISR, routing, API routes |
| | TypeScript | 5.x | Type safety |
| | Tailwind CSS | 3.x | Utility‑first styling |
| | shadcn/ui | latest | Accessible, pre‑built components |
| | lucide-react | latest | Icons |
| | Recharts | 2.x | Interactive charts |
| | SWR | 2.x | Client‑side data fetching & caching |
| **Backend** | tRPC | 10.x | End‑to‑end typesafe APIs |
| | Drizzle ORM | latest | Lightweight PostgreSQL ORM |
| | `pg` (node-postgres) | 8.x | Database driver |
| **Auth** | Clerk | latest | User management, JWT sessions |
| **AI** | `@aws-sdk/client-bedrock-runtime` | 3.x | Amazon Bedrock integration |
| **Email** | Resend | latest | Transactional email |
| **Payments** | Stripe | latest | Payment processing (test mode) |
| **Database** | Amazon Aurora PostgreSQL | 15.x (compatible) | Primary data store |
| | Extensions: pgvector, pg_stat_statements, uuid‑ossp, pgcrypto | | |
| **Infra** | Vercel (Hobby) | — | Hosting & deployment |
| | AWS Lambda (optional) | — | Future: background query polling |

---

## 4. Database Design (Technical)

### 4.1 Aurora Instance Specification

| Parameter | Value | Reason |
|-----------|-------|--------|
| Instance class | db.t4g.medium | Free tier eligible |
| vCPU | 2 | Sufficient for demo |
| RAM | 4 GB | Handles small working set |
| Storage | 20 GB (General Purpose SSD) | Free tier limit |
| Multi‑AZ | No | Free tier is single‑AZ |
| Encryption | Enabled (AES‑256) | Default, security requirement |
| Public access | Yes (restrict IP in prod) | Easier dev setup |

### 4.2 Schema Summary (Core Tables)

| Table | Primary Purpose | Key Features |
|-------|-----------------|--------------|
| `users` | User profiles | `clerk_id` unique, `preferences` JSONB |
| `db_connections` | Stored database endpoints | `db_type` enum, `health_score` calculated field |
| `captured_queries` | Query metrics | Partitioned by month, indexes on `avg_time_ms`, `query_hash` |
| `query_analyses` | AI analysis results | `embedding` vector(1536), issues & recommendations as JSONB |
| `cost_alerts` | Anomaly alerts | Severity level, acknowledge/resolve workflow |
| `optimizer_history` | Ad‑hoc optimization log | Stores original vs optimized query, user rating |
| `schema_validations` | Schema validator results | For DDL or DynamoDB JSON |
| `activity_log` | Audit trail | All user actions, IP, user agent |

### 4.3 Partitioning Strategy

`captured_queries` is partitioned by `RANGE` on `captured_at` (monthly). This allows efficient time‑based purging and keeps scans on recent data.

```sql
CREATE TABLE captured_queries (
    ...
) PARTITION BY RANGE (captured_at);

CREATE TABLE captured_queries_2026_06 PARTITION OF captured_queries
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
-- New partitions added programmatically
```

### 4.4 Row‑Level Security (Multi‑Tenancy)

Every user‑scoped table has RLS enabled and a policy that compares `app.current_clerk_id` with the stored `clerk_id` (or joins to `users`). The application sets this variable at the start of each database session.

```sql
SELECT set_config('app.current_clerk_id', 'user_2abc123', false);
```

This ensures strict tenant isolation even at the database level.

---

## 5. API Technical Specifications

### 5.1 API Style & Conventions

- Protocol: HTTPS + JSON
- Endpoint discovery: tRPC provides a single `/api/trpc` endpoint with procedure names
- Error format: `{ error: { code: string, message: string, details?: any } }`
- All procedures require authentication (except public landing page endpoints)

### 5.2 Key tRPC Routers

| Router | Main Procedures |
|--------|-----------------|
| `connection` | `list`, `create`, `getById`, `delete`, `getHealthScore` |
| `query` | `listByConnection`, `getById`, `getAnalysis`, `requestAnalysis` |
| `optimizer` | `analyze` (ad‑hoc), `getHistory` |
| `alert` | `list`, `acknowledge`, `resolve`, `getCount` |
| `report` | `generate` (PDF) |
| `user` | `getProfile`, `updateProfile`, `updatePreferences` |
| `billing` | `createCheckoutSession`, `createPortalSession` |

### 5.3 Example Procedure: `optimizer.analyze`

**Input:**
```ts
{
  query: string;
  dbType: 'aurora_postgresql' | 'dynamodb';
  schemas?: string;
}
```

**Process:**
1. Validate query not empty, check plan limits (Pro/Enterprise unlimited; Free 3/day).
2. Check in‑memory cache (30 min TTL).
3. If cache miss: build prompt → call Bedrock (Claude 3 Haiku, temperature 0.1, max_tokens 1024).
4. Parse JSON response (retry once on failure).
5. Store result in `optimizer_history` and return to client.

**Output:**
```ts
{
  id: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'optimal';
  riskScore: number; // 0-10
  issues: { type: string; severity: string; description: string; impact: string }[];
  optimizedQuery: string;
  improvementPercent: number;
  recommendations: { action: string; description: string; ddl?: string }[];
  estimatedSavings: number; // USD/month
}
```

### 5.4 Rate Limiting

Implemented as Next.js Middleware (`/api/*`), simple token bucket per user (identified by Clerk session). Limits:

- General API: 100 req / 15 min per user
- Query optimizer (ad‑hoc): 10 req / hour for Free; no limit for Pro+

---

## 6. Frontend Technical Implementation

### 6.1 Page Structure & Rendering Strategy

| Route | Rendering | Reason |
|-------|-----------|--------|
| `/` (landing) | SSG | Static content, fast load, SEO |
| `/dashboard` | SSR (initial), then SWR | Fresh data on first load, then real‑time feel |
| `/dashboard/connections` | SSR | Connection list quick fetch |
| `/connections/[id]` | SSR | Connection overview |
| `/optimizer` | CSR | Interactive tool, no SEO needed |
| `/alerts` | CSR (SWR polling 30s) | Live alert updates |
| `/settings` | CSR | User settings |

### 6.2 Component Library & Theming

All UI components are from **shadcn/ui** (built on Radix UI). The dark theme is achieved via Tailwind classes and a few CSS variables.

- Background: `slate-950` (deepest), `slate-900` (cards), `slate-800` (borders)
- Text: `slate-100` (primary), `slate-400` (secondary)
- Accent: `blue-600` / `blue-400`
- Status colors: `green-500` (ok), `yellow-500` (warning), `red-500` (critical)

### 6.3 State Handling Components

Every data‑dependent component implements:

- **Loading:** Skeleton placeholders (pulse animation) using `Skeleton` component
- **Empty:** Centered icon + message + CTA button (e.g., “Connect your first database”)
- **Error:** Amber/red card with `AlertTriangle` icon, retry button, and optional error details
- **Edge cases:** Graceful handling of null values, extremely long query strings (truncated with tooltip)

### 6.4 Charts

Using **Recharts**, with dark‑themed `Tooltip` and `Legend`.

- **LineChart** (`Query Cost Trend`): 7‑day window, monotone line, fill gradient.
- **PieChart** (`Query Distribution`): Donut style, custom colors per slice.

Data for charts is fetched from the `analytics` tRPC router or derived from the connection overview.

---

## 7. AI Integration (Amazon Bedrock)

### 7.1 Client Setup

```ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

### 7.2 Prompt Engineering

For the optimizer, the system prompt is structured to force JSON output:

```
You are a database expert. Analyze the following {dbType} query.
Return ONLY valid JSON (no markdown, no extra text) with this structure:
{
  "risk_level": "...",
  "risk_score": ...,
  "issues": [...],
  "optimized_query": "...",
  "improvement_percent": ...,
  "recommendations": [...],
  "explanation": "..."
}
Query: {query}
Schemas: {schemas || "Not provided"}
```

Temperature is set to 0.1 for deterministic, fact‑based analysis.

### 7.3 Caching

A server‑side in‑memory `Map` stores the parsed result keyed by a hash of the query + dbType. Cache TTL is 30 minutes. This dramatically reduces Bedrock token consumption and keeps the system within free credits.

---

## 8. Authentication & Security

### 8.1 Authentication Flow

1. Clerk handles the sign‑up / sign‑in UI and issues JWTs.
2. Next.js `middleware.ts` uses `authMiddleware` from Clerk to protect all `/dashboard/*` and `/api/*` routes.
3. After authentication, a Clerk webhook syncs the user to Aurora’s `users` table.

### 8.2 Database Security

- **Encryption at rest:** Aurora’s default AES‑256 encryption.
- **Encryption in transit:** TLS 1.3 from Vercel to Aurora.
- **Multi‑tenancy:** Row‑Level Security on every table using `app.current_clerk_id` set via `pg` session parameter before each query.
- **No plain‑text secrets:** All credentials are stored as environment variables on Vercel.

### 8.3 API Security

- All tRPC procedures are wrapped with a `protectedProcedure` that checks `ctx.user` (from Clerk).
- Input validation with Zod schemas (built into tRPC).
- Rate limiting via Vercel Edge Middleware (basic token bucket).

---

## 9. Notifications & Integrations

### 9.1 Email (Resend)

Triggered for critical alerts when user enables email notifications. A simple React‑email template renders the alert details.

### 9.2 Slack / Discord Webhooks

Users provide a webhook URL in Settings. On critical/ warning alerts, the system sends a formatted JSON payload to the webhook. Test button sends a sample message.

---

## 10. Deployment & CI/CD

### 10.1 Vercel Deployment

- Repository connected to Vercel.
- `main` branch deploys to production.
- Build command: `npx prisma generate && next build` (if Prisma) or `next build`.
- Environment variables managed in Vercel dashboard.

### 10.2 Database Migrations

For the MVP, schema is applied manually via SQL script. In production, a migration tool (Drizzle Kit / Prisma Migrate) would be used. The database endpoint must be accessible from Vercel’s IP range.

---

## 11. Zero‑Cost Validation

Every component and service must operate entirely within the defined free quotas:

| Resource | Free Limit | Our Usage | Status |
|----------|------------|-----------|--------|
| Vercel | 100 GB bandwidth, 6000 build min | ~5 GB, ~100 builds | ✅ |
| Aurora | db.t4g.medium, 20 GB, 750 hrs | 111 MB data, 720 hrs | ✅ |
| Clerk | 10,000 MAU | < 10 users | ✅ |
| Bedrock | Hackathon credits | ~500 requests | ✅ |
| Lambda | 1M requests/mo | 0 (simulated) | ✅ |
| Resend | 100 emails/day | < 10 test emails | ✅ |
| Stripe | Test mode | Unlimited test | ✅ |

---

## 12. Appendix

### Appendix A: Environment Variables Template

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
DATABASE_URL=postgresql://...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://auroraguard.vercel.app
```

### Appendix B: Key npm Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "db:push": "drizzle-kit push:pg",
  "db:seed": "tsx scripts/seed.ts"
}
