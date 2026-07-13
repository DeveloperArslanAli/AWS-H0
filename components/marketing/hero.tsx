import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Activity, Database, Sparkles } from "lucide-react"

function Sparkline() {
  // Decorative latency sparkline built from a fixed path (no random on server).
  return (
    <svg viewBox="0 0 320 64" className="h-16 w-full text-primary" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,40 L20,38 L40,42 L60,30 L80,34 L100,24 L120,28 L140,18 L160,26 L180,14 L200,22 L220,12 L240,20 L260,10 L280,16 L300,8 L320,14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M0,40 L20,38 L40,42 L60,30 L80,34 L100,24 L120,28 L140,18 L160,26 L180,14 L200,22 L220,12 L240,20 L260,10 L280,16 L300,8 L320,14 L320,64 L0,64 Z"
        fill="url(#spark)"
      />
    </svg>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            AI query optimization, now in every plan
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Catch slow queries before your users do
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            AuroraGuard watches your Postgres and MySQL fleets in real time, surfaces the queries hurting performance,
            and uses AI to recommend the exact index or rewrite to fix them.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">
                Start free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="rounded-xl border border-border bg-card p-2 shadow-2xl shadow-black/40">
            <div className="rounded-lg border border-border/60 bg-background">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-muted" />
                  <span className="size-2.5 rounded-full bg-muted" />
                  <span className="size-2.5 rounded-full bg-muted" />
                </div>
                <span className="ml-2 font-mono text-xs text-muted-foreground">app.auroraguard.io/dashboard</span>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Activity className="size-3.5 text-primary" /> p95 latency
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold">128ms</div>
                  <div className="mt-2 -mb-1">
                    <Sparkline />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Database className="size-3.5 text-primary" /> queries / sec
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold">2,418</div>
                  <div className="mt-2 -mb-1">
                    <Sparkline />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5 text-primary" /> AI fixes ready
                  </div>
                  <div className="mt-1 font-mono text-2xl font-semibold">7</div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    Est. 94% faster on <span className="font-mono text-foreground">orders</span> scan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
