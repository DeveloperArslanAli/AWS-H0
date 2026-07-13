# 🏗️ AuroraGuard — UI/UX & Enterprise Directory Architecture

This document unifies the **user experience design system** and the **enterprise-grade application architecture** (code organization, multi‑tenant data isolation, team management, SSO integration) into a single reference. It is structured for:

- **Product Designers** → Section 1–3 (Design system, component tree, wireframes)  
- **Full‑Stack Engineers** → Section 4–7 (Code directory, enterprise modules, security, deployment)

---

## 1. UI/UX Architecture (Visual & Interaction Design)

### 1.1 Design System at a Glance

| Token | Value |
|-------|-------|
| **Font** | Inter (body), JetBrains Mono (code) |
| **Background** | `slate-950` (deepest), `slate-900` (cards) |
| **Primary Action** | `blue-600` (#2563EB) |
| **Success / Positive** | `green-400` (#4ADE80) |
| **Warning** | `amber-400` (#FBBF24) |
| **Critical** | `red-500` (#EF4444) |
| **Icons** | lucide-react (stroke 2px) |
| **Spacing** | Tailwind’s 4‑point grid (p‑6 = 24px, gap‑4 = 16px) |
| **Elevation** | Subtle borders (`border-slate-800`) instead of shadows (dark‑mode friendly) |

### 1.2 Core User Flows

| Flow | Steps |
|------|-------|
| **First Visit → Active Monitor** | Landing → Sign‑Up (Clerk) → Empty Dashboard → “Connect Your Database” → Simulated data fills dashboard |
| **Cost Spike Investigation** | Alert badge click → Alerts page → Critical tab → Alert detail → “View Query” → AI diagnosis → Apply fix (DDL copy) |
| **Ad‑hoc SQL Optimizer** | Sidebar “Optimizer” → Paste query → Click “Analyze” → Results panel shows issues + optimized SQL |

### 1.3 Global Layout Shell

```
┌───────────────┬────────────────────────────────────────────┐
│ Sidebar (240) │ Header (h-16, bg-slate-900)                │
│               ├────────────────────────────────────────────┤
│ - Logo        │                                            │
│ - Nav items   │         <Page Content>                     │
│   (icons)     │                                            │
│ - User menu   │                                            │
│   (avatar,    │                                            │
│    plan badge)│                                            │
└───────────────┴────────────────────────────────────────────┘
```

- **Sidebar** collapses to a `Sheet` drawer on screens <768px.
- **Header** shows breadcrumb, notification bell with unresolved count badge, and user avatar dropdown.

### 1.4 Key Page Wireframes

#### Dashboard
```
┌────────────────────────────────────────────────────────────┐
│ [Health Score: 92/100] [Monthly Cost: $1,247 ↓18%]         │
│ [Queries Tracked: 847k]   [Active Alerts: 3]               │
├───────────────────────────┬────────────────────────────────┤
│ Cost Trend (LineChart)    │ Query Distribution (Donut)     │
├───────────────────────────┴────────────────────────────────┤
│ Top Slow Queries Table                                     │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Query (truncated)        │ Avg Time  │ Risk    │ Action  ││
│ │ SELECT * FROM orders...  │ 890ms     │ 🔴 Cri  │ [Opt]   ││
│ │ SELECT u.*, o.total...   │ 450ms     │ 🟠 Hig  │ [Opt]   ││
│ └─────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

#### Query Optimizer (Two‑Column)
```
┌────────────────────────────┬──────────────────────────────────┐
│ Input Panel (40%)          │ Results Panel (60%)              │
│                            │                                  │
│ DB Type: [Aurora ▼]        │ (Before analysis: empty)         │
│                            │ After analysis:                  │
│ ┌────────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ Paste your SQL here... │ │ │ 🔴 Risk Score: 8.5/10       │ │
│ │                        │ │ │ Issues Found:                │ │
│ └────────────────────────┘ │ │ • Missing index (orders.st.) │ │
│                            │ │ • SELECT * (47 columns)      │ │
│ [▼ Table Schemas]         │ │ ✅ Optimized Query:           │ │
│ ┌────────────────────────┐ │ │ ┌──────────────────────┐     │ │
│ │ Optional DDL           │ │ │ │ SELECT id, status... │     │ │
│ └────────────────────────┘ │ │ │ [Copy]               │     │ │
│                            │ │ └──────────────────────┘     │ │
│ [✨ Analyze Query]        │ │ 💰 $847/mo → $42/mo (95%)    │ │
└────────────────────────────┴──────────────────────────────────┘
```

### 1.5 Component Hierarchy (Reusable)

```
AppShell
├── Sidebar
│   ├── NavItem (icon, label, active state)
│   └── UserMenu (Avatar, name, plan badge, logout)
├── Header (Breadcrumb, NotificationBell, UserAvatar)
└── Main
    ├── DashboardPage
    │   ├── StatCard
    │   ├── CostTrendChart (Recharts)
    │   ├── QueryDistChart (PieChart)
    │   └── TopQueriesTable
    ├── OptimizerPage
    │   ├── QueryInputPanel (Select, Textarea, Collapsible)
    │   └── AnalysisResultPanel (RiskBadge, IssueCard, CodeBlock, CostImpact)
    ├── AlertsPage
    │   ├── AlertFilterTabs
    │   └── AlertCard (severity stripe, actions)
    └── SettingsPage (Profile, Notifications, Billing, API Keys)
```

---

## 2. Enterprise Architecture (Multi‑Tenant, Teams, SSO)

While the MVP is single‑tenant (one user = one database connection), the architecture is designed to scale to enterprise needs. This section details how AuroraGuard will support:

- **Multi‑tenant data isolation** via Row‑Level Security (RLS)  
- **Organization/Team management**  
- **Role‑based access control (RBAC)**  
- **Enterprise Single Sign‑On (SSO)** using Clerk’s enterprise features  

### 2.1 Multi‑Tenant Data Isolation

Every table that holds user‑specific data has a tenant identifier (`clerk_id` in `users` table, then `user_id` in child tables). **Row‑Level Security (RLS)** is enforced in PostgreSQL so that even if a query escapes the application layer, users can never read another tenant’s data.

```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE db_connections ENABLE ROW LEVEL SECURITY;
-- ... all tables

-- Set the session variable at the start of every DB connection
SELECT set_config('app.current_clerk_id', 'user_2abc123', false);

-- Example policy for db_connections
CREATE POLICY connection_isolation ON db_connections
    USING (user_id = (SELECT id FROM users WHERE clerk_id = current_setting('app.current_clerk_id')));
```

### 2.2 Team & Organization Model

In the enterprise edition, a user belongs to an **Organization**. Organizations can have multiple **Teams**. Roles define access.

```
Organization
├── Teams (optional grouping)
│   ├── Members (Admin, Member, Viewer)
│   └── Connections (shared within team)
└── Billing (per org)
```

**Database extensions for enterprise:**
- `organizations` table (id, name, stripe_customer_id)
- `organization_members` (org_id, user_id, role)
- `teams` (id, org_id, name)
- `team_members` (team_id, user_id, role)
- `team_connections` (team_id, connection_id) — allows sharing connections

### 2.3 Role‑Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Org Admin** | Manage org settings, billing, members, all connections, audit logs |
| **Team Admin** | Manage team members, team connections, view team reports |
| **Member** | Create own connections, view shared team connections, run optimizer |
| **Viewer** | Read‑only access to dashboards and reports |

RBAC is enforced at the API level (tRPC middleware) and backed by RLS policies that check the user’s role in the organization.

### 2.4 Enterprise SSO (Future)

Clerk supports **Enterprise SSO** (OIDC, SAML) out of the box. For enterprise customers:
- AuroraGuard enables “Enterprise SSO” on their Clerk instance.
- Organization members authenticate via their corporate IdP (Okta, Azure AD, etc.).
- Clerk returns the user’s `org_id` and `role` in the JWT, which is used for RLS and API authorization.

### 2.5 Audit Logging

The `activity_log` table records every significant action:
- User login/logout
- Connection added/removed
- Query analysis requested
- Alert acknowledged/resolved
- Report generated

For enterprise, the audit log is searchable, exportable, and immutable (append‑only). It serves compliance requirements (SOC2, PCI‑DSS).

---

## 3. Enterprise Directory Structure (Code Organization)

The Next.js project is structured to separate concerns, support multiple tenants, and eventually scale to enterprise features. The directory tree below reflects the current MVP with placeholders for future enterprise modules.

```
auroraguard/
├── .github/                  # CI workflows
├── prisma/                   # Database schema & migrations (if using Prisma)
│   └── schema.prisma
├── public/                   # Static assets (fonts, favicon)
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # Clerk auth pages
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── (dashboard)/      # Authenticated pages
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── connections/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── optimizer/page.tsx
│   │   │   │   ├── alerts/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (public)/         # Landing, pricing
│   │   │   ├── page.tsx
│   │   │   └── pricing/page.tsx
│   │   ├── api/
│   │   │   ├── trpc/[trpc]/route.ts  # tRPC endpoint
│   │   │   └── webhooks/
│   │   │       ├── clerk/route.ts
│   │   │       └── stripe/route.ts
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (button, card, etc.)
│   │   ├── layout/           # AppShell, Sidebar, Header
│   │   ├── dashboard/        # StatCard, Charts, QueryTable
│   │   ├── optimizer/        # QueryInput, AnalysisResult
│   │   ├── alerts/           # AlertCard, AlertFilters
│   │   └── shared/           # EmptyState, ErrorCard, Skeleton
│   ├── lib/                  # Utilities & clients
│   │   ├── db.ts             # Drizzle/Prisma client
│   │   ├── bedrock.ts        # Amazon Bedrock wrapper
│   │   ├── resend.ts         # Email sending
│   │   ├── auth.ts           # Clerk helpers
│   │   └── utils.ts
│   ├── server/               # Backend logic
│   │   ├── api/
│   │   │   ├── root.ts       # tRPC appRouter
│   │   │   ├── trpc.ts       # Context creation
│   │   │   └── routers/
│   │   │       ├── connection.ts
│   │   │       ├── query.ts
│   │   │       ├── optimizer.ts
│   │   │       ├── alert.ts
│   │   │       ├── report.ts
│   │   │       ├── user.ts
│   │   │       └── billing.ts
│   │   ├── enterprise/       # Future: team, org, audit
│   │   │   ├── organization.ts
│   │   │   ├── team.ts
│   │   │   └── audit.ts
│   │   └── middleware/       # RLS session setter, rate limiter
│   ├── styles/               # Global CSS (Tailwind directives)
│   └── types/                # Shared TypeScript types
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.1 Key Architectural Decisions

- **tRPC routers** are feature‑based (connection, optimizer, etc.) to keep code cohesive.
- **Enterprise modules** (org, team, audit) are isolated in `server/enterprise/` – they can be imported into the main router when the feature flag is enabled.
- **Database access** is centralized in `lib/db.ts`; all queries go through the ORM, never raw SQL strings.
- **RLS session** is set by a lightweight function in `lib/db.ts` that runs `SELECT set_config(...)` on each new connection.

---

## 4. Security & Compliance Layers (Enterprise Ready)

### 4.1 Data Protection
- **At rest:** Aurora auto‑encryption (AES‑256).
- **In transit:** TLS 1.3 enforced on all connections.
- **Secrets:** Vercel environment variables, never in source code.

### 4.2 Identity & Access
- **User identity:** Clerk JWT with short expiry.
- **API authorization:** tRPC context validates JWT, checks role (from `users` table) against the requested resource.
- **Database authorization:** RLS policies double‑check the session variable, providing defense in depth.

### 4.3 Audit Trail
- `activity_log` table with structured JSON details.
- Accessible only to Org Admins.
- Immutable (no UPDATE/DELETE by application code, only INSERT).

### 4.4 Scalability & Performance
- **Connection pooling** via `pg` pool (5–10 connections).
- **Caching** of AI responses (30 min TTL) reduces Bedrock costs.
- **Partitioning** of `captured_queries` by month for fast time‑based queries and easy purging.

---

## 5. Deployment Architecture (Enterprise Production)

For the hackathon, we deploy to Vercel Hobby. For enterprise production:

```
                                 [ CDN / WAF ]
                                       │
                                 [ Vercel Pro ]
                                       │
                      ┌────────────────┼────────────────┐
                      │                │                │
               [ Next.js SSR ]   [ API Routes ]   [ Edge Functions ]
                      │                │                │
                      └────────────────┼────────────────┘
                                       │
                              [ AWS VPC (Private) ]
                                       │
                      ┌────────────────┼────────────────┐
                      │                │                │
               [ Aurora Cluster ]  [ ElastiCache ]  [ S3 (reports) ]
                 (Multi‑AZ, prod)   (Redis cache)
```

- **SSO** via Clerk Enterprise with SAML/OIDC.
- **Logging & monitoring** via Datadog/CloudWatch.
- **Backups** via Aurora automated backups with 7‑day retention.
