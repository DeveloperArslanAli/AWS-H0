# 🎨 AuroraGuard — Complete UI/UX Architecture & Visualization

**Document Version:** 1.0  
**Date:** 2026-06-17  
**Author:** Product Designer / UX Architect  
**Project:** AuroraGuard – AI-Powered Database Cost & Performance Guardian  
**Design System:** Dark Theme, Slate Palette, Blue Accent, Inter Font  

---

## 1. Design Philosophy & Principles

| Principle | Description |
|-----------|-------------|
| **Clarity over cleverness** | Every number, badge, and status is instantly understandable. No jargon. |
| **Progressive disclosure** | Show essential metrics first; drill down on demand. |
| **Dark by default** | Reduces eye strain for developers who monitor dashboards for long hours. |
| **Contextual actions** | “Optimize” button appears only where relevant; empty states guide the next step. |
| **Zero learning curve** | The interface follows established SaaS patterns (sidebar, cards, tables). |

---

## 2. Information Architecture (Site Map)

```
/ (Landing Page)
├── Features
├── Pricing
├── Sign In / Sign Up
└── Get Started Free

/app (Authenticated)
├── Dashboard
│   ├── Health Score Card
│   ├── Cost Trend Chart
│   ├── Query Volume Bar Chart
│   └── Top Slow Queries Table
├── Connections
│   ├── Connection Cards Grid
│   └── Connection Detail (dynamic route)
│       ├── Overview Tab
│       ├── Queries Tab
│       ├── Alerts Tab
│       └── Settings Tab
├── Query Optimizer
│   ├── Input Panel (Left)
│   └── Results Panel (Right)
├── Alerts
│   ├── Filter Tabs (All / Critical / Warning / Info)
│   └── Alert Cards List
├── Settings
│   ├── Profile
│   ├── Notifications
│   ├── Billing
│   └── API Keys
└── User Menu (Avatar, Plan, Logout)
```

---

## 3. Core User Flows

### Flow 1: First‑Time User Onboarding
```
Landing Page → “Start Free” → Clerk Sign‑Up → 
Redirect to Dashboard (Empty State) → 
Prompt: “Connect your first database” → 
Add Connection Form → Dashboard becomes live with seeded data.
```

### Flow 2: Investigate a Cost Spike Alert
```
Dashboard → Alert badge (red “3”) click → Alerts page →
Filter “Critical” → Click alert card → 
Alert Detail: see query name, cost spike chart, AI diagnosis →
Click “View Query” → Query Detail with full optimization →
Click “Apply Fix” → DDL copy button → Alert resolved.
```

### Flow 3: Optimize a Slow Query (Ad‑Hoc)
```
Sidebar → Query Optimizer → 
Select DB type → Paste SQL → Click “Analyze” → 
Loading skeleton → Results appear: issues, optimized query, index DDL →
Copy optimized SQL → (optional) Rate optimization.
```

---

## 4. Wireframe Descriptions (Visualization via Text)

### 4.1 Landing Page (Public)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo AuroraGuard]    Features  Pricing  Docs     [Sign In] [Get Started] │
│  (glass navbar, bg-slate-950/80, backdrop-blur)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│            ┌──────────────────────────────┐                         │
│            │ 🎉 Built on AWS + Vercel v0  │ (small badge)           │
│            └──────────────────────────────┘                         │
│                                                                     │
│       Never Face a Surprise AWS Bill Again                         │
│       ─────────────────────────────────────                         │
│       AI-powered database monitoring that catches query             │
│       cost spikes in minutes, not days.                             │
│                                                                     │
│       [Start Monitoring Free]  [▶ Watch Demo]                      │
│                                                                     │
│       ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│       │ 🔍         │  │ 🚨         │  │ 🤖         │               │
│       │ Real-Time  │  │ AI Cost    │  │ One-Click  │               │
│       │ Monitoring │  │ Anomaly    │  │ Optimization│              │
│       │            │  │ Detection  │  │            │               │
│       └────────────┘  └────────────┘  └────────────┘               │
│                                                                     │
│       How It Works:  [1. Connect DB] → [2. AI Analyzes] → [3. Get Fixes] │
│                                                                     │
│       Pricing:                                                      │
│       ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│       │ Free     │  │ Pro      │  │ Enterprise│                    │
│       │ $0/mo    │  │ $29/mo   │  │ $199/mo  │                     │
│       │ 1 DB     │  │ 5 DBs    │  │ Unlimited│                     │
│       │ ...      │  │ ...      │  │ ...      │                     │
│       └──────────┘  └──────────┘  └──────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Dashboard (Authenticated)

```
┌──────────────┬──────────────────────────────────────────────────────┐
│ Sidebar (240)│ Header:  [Dashboard]                    [🔔3] [👤 Ali]│
│              ├──────────────────────────────────────────────────────┤
│ [Logo]       │                                                      │
│              │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│ Dashboard ●  │ │Health   │ │Monthly  │ │Queries  │ │Active   │     │
│ Connections  │ │Score    │ │Cost     │ │Tracked  │ │Alerts   │     │
│ Optimizer    │ │ 92/100  │ │ $1,247  │ │ 847,291 │ │ 3       │     │
│ Alerts       │ │↑7 pts   │ │↓18%     │ │30 days  │ │2 crit   │     │
│ Settings     │ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │
│              │                                                      │
│              │ ┌──────────────────────────┐ ┌──────────────────┐   │
│              │ │  Query Cost Trend (Line)  │ │ Query Distribution│   │
│              │ │  ┌─────────────────────┐  │ │   (Donut)        │   │
│              │ │  │  ╱╲    ╱╲          │  │ │                  │   │
│              │ │  │ ╱  ╲╱  ╲    ╱╲   │  │ │   SELECT 45%    │   │
│              │ │  │╱         ╲╱  ╲  │  │ │   INSERT 25%    │   │
│              │ │  │─────────────────  │  │ │   UPDATE 20%    │   │
│              │ │  │ Mon ... Sun       │  │ │   DELETE 10%    │   │
│              │ │  └─────────────────────┘  │ └──────────────────┘   │
│              │ └──────────────────────────┘                         │
│              │                                                      │
│              │  Top Slow Queries                                    │
│              │ ┌──────────────────────────────────────────────┐    │
│              │ │ Query (truncated)         Avg Time  Risk  [→] │    │
│              │ │ SELECT * FROM orders...   890ms    🔴 Cri  [Opt] │
│              │ │ SELECT u.*, o.total...    450ms    🟠 Hig  [Opt] │
│              │ │ SELECT id, email...       45ms     🟢 Low  [Opt] │
│              │ └──────────────────────────────────────────────┘    │
│              │                                                      │
└──────────────┴──────────────────────────────────────────────────────┘
```

### 4.3 Query Optimizer (Two‑Column Layout)

```
┌──────────────┬──────────────────────────────────────────────────────┐
│ Sidebar      │ Header: Query Optimizer                              │
├──────────────┼───────────────────────┬──────────────────────────────┤
│              │ Left Panel (40%)       │ Right Panel (60%)             │
│              │                        │                              │
│              │ DB Type: [Aurora ▼]    │ (empty before analysis)      │
│              │                        │                              │
│              │ ┌────────────────────┐ │ After analysis:              │
│              │ │                    │ │ ┌─────────────────────────┐  │
│              │ │  Paste your SQL    │ │ │ 🔴 RISK SCORE 8.5/10   │  │
│              │ │  query here...     │ │ │ HIGH RISK               │  │
│              │ │                    │ │ └─────────────────────────┘  │
│              │ │                    │ │                              │
│              │ │                    │ │ Issues Found:                │
│              │ │                    │ │ ┌─────────────────────────┐  │
│              │ │                    │ │ │ 🔴 Missing Index       │  │
│              │ │                    │ │ │ orders.status          │  │
│              │ │                    │ │ │ Full table scan        │  │
│              │ └────────────────────┘ │ └─────────────────────────┘  │
│              │                        │ ┌─────────────────────────┐  │
│              │ [▼ Table Schemas]      │ │ 🟡 SELECT *            │  │
│              │                        │ │ 47 columns fetched     │  │
│              │ ┌────────────────────┐ │ └─────────────────────────┘  │
│              │ │ (optional DDL)     │ │                              │
│              │ └────────────────────┘ │ ✅ Optimized Query:          │
│              │                        │ ┌─────────────────────────┐  │
│              │ [✨ Analyze Query]     │ │ SELECT id, status...    │  │
│              │                        │ │ [Copy]                  │  │
│              │                        │ └─────────────────────────┘  │
│              │                        │                              │
│              │                        │ 💰 Cost Impact:              │
│              │                        │ $847/mo → $42/mo (95% save)  │
└──────────────┴───────────────────────┴──────────────────────────────┘
```

### 4.4 Alerts Page

```
┌──────────────┬──────────────────────────────────────────────────────┐
│ Sidebar      │ Header: Alerts                    [Mark All Read]     │
├──────────────┼──────────────────────────────────────────────────────┤
│              │ [All 12] [Critical 2] [Warning 5] [Info 5]            │
│              │                                                      │
│              │ ┌───┬──────────────────────────────────────────┐     │
│              │ │🔴 │ Query Cost Spike — Production Orders DB    │     │
│              │ │   │ Cost increased from $0.40/hr to $18.50/hr │     │
│              │ │   │ 2 min ago | Prod Orders DB | get_orders   │     │
│              │ │   │ [View Details]  [Acknowledge]  [Resolve]  │     │
│              │ └───┴──────────────────────────────────────────┘     │
│              │                                                      │
│              │ ┌───┬──────────────────────────────────────────┐     │
│              │ │🟠 │ Slow Query Detected — User Analytics DB    │     │
│              │ │   │ generate_report taking 8.5s (normal: 2s)  │     │
│              │ │   │ 15 min ago | Analytics DB | gen_report    │     │
│              │ │   │ [View Details]  [Acknowledge]  [Resolve]  │     │
│              │ └───┴──────────────────────────────────────────┘     │
│              │                                                      │
│              │ ┌───┬──────────────────────────────────────────┐     │
│              │ │🔵 │ (Resolved) Connection Timeout — Session Store│    │
│              │ │   │ Auto-resolved after 3 minutes.            │     │
│              │ │   │ 1 hour ago | Resolved by system            │     │
│              │ └───┴──────────────────────────────────────────┘     │
│              │                                                      │
└──────────────┴──────────────────────────────────────────────────────┘
```

---

## 5. Component Library & Hierarchy

### 5.1 Layout Components
- `AppShell`: wraps all authenticated pages; contains Sidebar, Header, and `<main>`.
- `Sidebar`: fixed on desktop, Sheet drawer on mobile; nav links with icons.
- `Header`: breadcrumb, search (future), notification bell with badge, user avatar dropdown.

### 5.2 Dashboard Components
- `StatCard`: icon, label, large value, trend subtext, optional `Progress` (for health score).
- `CostTrendChart`: Recharts `LineChart`, dark tooltip, responsive container.
- `QueryDistributionChart`: Recharts `PieChart`, donut style, legend.
- `TopQueriesTable`: shadcn `Table` with truncated monospace query, `Badge` for risk, `Button` for action.

### 5.3 Optimizer Components
- `QueryInputPanel`: db type `Select`, `Textarea` for SQL, collapsible `Textarea` for schemas, `AnalyzeButton`.
- `AnalysisResultPanel`: `RiskBadge`, `IssueCard` list, `CodeBlock` for optimized query with copy, `IndexSuggestion` cards, `CostImpact` card.

### 5.4 Alerts Components
- `AlertFilterTabs`: shadcn `Tabs`.
- `AlertCard`: severity stripe (colored left border), title, description, meta row, action buttons.
- `AlertDetailModal`: full alert info, chart, AI diagnosis, link to query.

### 5.5 Shared Components
- `EmptyState`: icon + message + CTA.
- `ErrorCard`: amber/red card with retry.
- `Skeleton`: shadcn `Skeleton` variants for cards, tables, charts.
- `CodeBlock`: dark background, monospace, copy button (using `lucide-react` `Copy` icon).

---

## 6. Visual Design System

### 6.1 Color Palette

| Role | Tailwind Class | Hex | Usage |
|------|---------------|-----|-------|
| Page background | `bg-slate-950` | #020617 | Main app background |
| Surface / cards | `bg-slate-900` | #0F172A | Cards, tables, input fields |
| Borders | `border-slate-800` | #1E293B | Card borders, table borders |
| Primary text | `text-slate-100` | #F1F5F9 | Headings, body |
| Secondary text | `text-slate-400` | #94A3B8 | Subtitles, meta info |
| Primary action | `bg-blue-600` | #2563EB | Primary buttons |
| Primary action hover | `bg-blue-500` | #3B82F6 | Button hover state |
| Success | `text-green-400` | #4ADE80 | Healthy scores, cost savings |
| Warning | `text-amber-400` | #FBBF24 | Warning alerts |
| Danger | `text-red-500` | #EF4444 | Critical alerts, errors |
| Disabled | `text-slate-600` | #475569 | Disabled elements |

### 6.2 Typography

- Font family: **Inter** (system stack)
- Font sizes: Tailwind’s default scale (`text-xs` to `text-5xl`)
- Weights: `font-normal` for body, `font-medium` for labels, `font-semibold` for headings, `font-bold` for key numbers.

### 6.3 Spacing & Sizing

- Sidebar width: `w-60` (240px)
- Header height: `h-16` (64px)
- Page padding: `p-6` (24px)
- Card padding: `p-4` or `p-6`
- Gaps: `gap-4` (16px) between cards, `gap-2` for internal elements

### 6.4 Iconography

- **lucide-react** exclusively.
- Size: `h-5 w-5` for nav, `h-4 w-4` for inline.
- Stroke width: 2 (default).

### 6.5 Elevation & Shadows

- No heavy shadows (dark theme benefits from subtle borders).
- Card: `border border-slate-800` with slight `bg-slate-900`.
- Active states: a bright left border or ring instead of elevation.

---

## 7. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| **≥ 1024px (Desktop)** | Full sidebar visible, dashboard grid 4 columns, optimizer two columns. |
| **768 – 1023px (Tablet)** | Sidebar collapsed to icons (or hamburger), stat cards 2 columns, optimizer stacks vertically. |
| **< 768px (Mobile)** | Sidebar as Sheet drawer, single column layout, tables become horizontally scrollable cards. |

---

## 8. Micro‑Interactions & Transitions

- **Sidebar toggle:** smooth slide (300ms ease-in-out).
- **Hover on cards:** border color changes to `border-slate-700` with 150ms transition.
- **Button loading:** spinner appears, button text changes (e.g., “Analyzing…”).
- **Alert acknowledge:** card fades to muted opacity, resolved stripe turns green.
- **Copy to clipboard:** icon changes from `Copy` to `Check` for 2 seconds.

---

## 9. Accessibility (WCAG AA Compliance)

- All interactive elements have `aria-label`.
- Color contrast ratios meet AA (dark theme carefully chosen).
- Keyboard navigation: all actions reachable via Tab, Enter, Space.
- Focus indicators: `focus-visible:ring-2 ring-blue-500` on buttons/inputs.

---

## 10. Visualization: Component Map (Dashboard)

```
Dashboard Page
│
├── Top Row (4 StatCards)
│   ├── StatCard "Health Score"
│   │   └── CircularProgress (dynamic color)
│   ├── StatCard "Monthly Cost"
│   │   └── Trend arrow (green down)
│   ├── StatCard "Queries Tracked"
│   │   └── Plain number
│   └── StatCard "Active Alerts"
│       └── Red badge count
│
├── Middle Row (2 Charts)
│   ├── CostTrendChart (LineChart)
│   │   ├── XAxis (days)
│   │   ├── YAxis (cost)
│   │   ├── Tooltip (dark theme)
│   │   └── ResponsiveContainer
│   └── QueryDistributionChart (PieChart)
│       ├── Pie (innerRadius 60, outerRadius 80)
│       ├── Cells (colors)
│       └── Legend
│
└── Bottom Row (TopQueriesTable)
    ├── TableHeader (Query, Avg Time, Calls, Risk, Actions)
    └── TableBody
        └── Row
            ├── Cell: Query text (truncated, monospace)
            ├── Cell: Badge (colored time)
            ├── Cell: formatted number
            ├── Cell: Badge (risk level)
            └── Cell: Button "Optimize"
```

---

## 11. Design Tokens (Tailwind Config Extension)

```js
// tailwind.config.js partial
theme: {
  extend: {
    colors: {
      brand: {
        50: '#EFF6FF',
        600: '#2563EB', // primary
        500: '#3B82F6', // hover
      },
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
  },
}
