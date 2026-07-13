import Link from "next/link"
import { ArrowRight, Activity, Database, Gauge, Zap } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { LatencyChart, ThroughputChart, CpuChart, CacheHitChart } from "@/components/dashboard/metric-charts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getConnections, getMetrics, getQueries, getAlerts } from "@/lib/data"
import { formatDuration, formatNumber } from "@/lib/format"
import type { MetricPoint } from "@/lib/types"

function toChartData(metrics: MetricPoint[]) {
  // average metrics across connections per timestamp bucket
  const byTs = new Map<string, { count: number; latency: number; qps: number; cpu: number; cacheHit: number }>()
  for (const m of metrics) {
    const cur = byTs.get(m.ts) ?? { count: 0, latency: 0, qps: 0, cpu: 0, cacheHit: 0 }
    cur.count += 1
    cur.latency += Number(m.latency_p95_ms)
    cur.qps += Number(m.qps)
    cur.cpu += Number(m.cpu_pct)
    cur.cacheHit += Number(m.cache_hit_ratio)
    byTs.set(m.ts, cur)
  }
  return Array.from(byTs.entries())
    .map(([ts, v]) => ({
      ts,
      latency: Math.round(v.latency / v.count),
      qps: Math.round(v.qps),
      cpu: Math.round(v.cpu / v.count),
      cacheHit: Math.round((v.cacheHit / v.count) * 10) / 10,
    }))
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
}

export default async function DashboardOverview() {
  const [connections, metrics, queries, alerts] = await Promise.all([
    getConnections(),
    getMetrics(),
    getQueries({ limit: 5 }),
    getAlerts({ status: "open", limit: 4 }),
  ])

  const chartData = toChartData(metrics)
  const latest = chartData[chartData.length - 1]
  const healthy = connections.filter((c) => c.status === "healthy").length
  const totalCalls = queries.reduce((s, q) => s + q.calls, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description="Real-time health and performance across all your database connections."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Connections"
          value={`${healthy}/${connections.length}`}
          hint="healthy"
          icon={Database}
          trend={healthy === connections.length ? "up" : "down"}
        />
        <StatCard
          label="p95 latency"
          value={latest ? `${latest.latency}ms` : "—"}
          hint="last interval"
          icon={Gauge}
          trend={latest && latest.latency < 120 ? "up" : "down"}
        />
        <StatCard
          label="Throughput"
          value={latest ? `${formatNumber(latest.qps)}` : "—"}
          hint="queries / sec"
          icon={Activity}
          trend="up"
        />
        <StatCard
          label="Open alerts"
          value={`${alerts.length}`}
          hint="needs attention"
          icon={Zap}
          trend={alerts.length === 0 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LatencyChart data={chartData} />
        <ThroughputChart data={chartData} />
        <CpuChart data={chartData} />
        <CacheHitChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Top queries by total time</CardTitle>
              <CardDescription>Ranked by cumulative execution time</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/queries">
                View all <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {queries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No queries captured yet.</p>
            ) : (
              queries.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                  <code className="truncate font-mono text-xs text-muted-foreground">{q.query_text}</code>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">{formatNumber(q.calls)} calls</span>
                    <span className="font-mono text-sm font-medium text-foreground">{formatDuration(q.mean_exec_ms)}</span>
                    <StatusBadge status={q.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Active alerts</CardTitle>
              <CardDescription>{totalCalls > 0 ? "Live" : "Quiet"}</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/alerts">
                View all <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {alerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open alerts. All systems nominal.</p>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{a.title}</span>
                    <Badge
                      variant="outline"
                      className={
                        a.severity === "critical"
                          ? "border-destructive/40 text-destructive"
                          : a.severity === "warning"
                            ? "border-chart-4/40 text-chart-4"
                            : "border-border text-muted-foreground"
                      }
                    >
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
