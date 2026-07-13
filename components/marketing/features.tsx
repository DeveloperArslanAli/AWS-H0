import { Activity, Sparkles, Bell, ShieldCheck, GitBranch, Gauge } from "lucide-react"

const FEATURES = [
  {
    icon: Activity,
    title: "Real-time observability",
    body: "Live CPU, connections, QPS, p95 latency and cache hit ratio across every database in your fleet — one pane of glass.",
  },
  {
    icon: Sparkles,
    title: "AI query optimizer",
    body: "Paste a slow query or pick one from the catalog. AuroraGuard returns the rewrite, index, or plan change with an estimated speedup.",
  },
  {
    icon: Bell,
    title: "Smart alerting",
    body: "Threshold and anomaly alerts for replication lag, pool saturation, and runaway queries — before they page you.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    body: "Row-level security isolates every workspace. Credentials are encrypted and never leave your control.",
  },
  {
    icon: GitBranch,
    title: "Multi-engine",
    body: "Postgres, MySQL, Aurora Postgres and Aurora MySQL — staging through production, in every region.",
  },
  {
    icon: Gauge,
    title: "Built to scale",
    body: "From a single side-project database to thousands of production clusters, on Supabase today and AWS tomorrow.",
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to keep databases fast
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Monitoring, alerting, and AI-driven optimization in a single platform built for engineering teams.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HowItWorks() {
  const steps = [
    { n: "01", t: "Connect", d: "Add a database connection in seconds. AuroraGuard starts collecting metrics immediately." },
    { n: "02", t: "Observe", d: "Watch live dashboards and a ranked catalog of your most expensive queries." },
    { n: "03", t: "Optimize", d: "Apply AI-recommended indexes and rewrites, then confirm the speedup on the next run." },
  ]
  return (
    <section id="how" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">From connect to fixed in three steps</h2>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n}>
              <span className="font-mono text-sm text-primary">{s.n}</span>
              <h3 className="mt-2 text-xl font-medium">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
