import { PageHeader } from "@/components/dashboard/page-header"
import { PlanSelector } from "@/components/dashboard/plan-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { getProfile, getConnections, getOptimizations } from "@/lib/data"
import { getPlan } from "@/lib/plans"

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">
          {used} / {limit >= 1000 ? "∞" : limit}
        </span>
      </div>
      <Progress value={pct} />
    </div>
  )
}

export default async function BillingPage() {
  const [profile, connections, optimizations] = await Promise.all([
    getProfile(),
    getConnections(),
    getOptimizations(1000),
  ])

  const tier = profile?.plan ?? "free"
  const plan = getPlan(tier)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Billing & plans" description="Manage your subscription and monitor usage." />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              Current plan <Badge>{plan.name}</Badge>
            </CardTitle>
            <CardDescription>{plan.tagline}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-foreground">
              {plan.priceMonthly === null ? "Custom" : `$${plan.priceMonthly}`}
            </p>
            {plan.priceMonthly !== null && <p className="text-xs text-muted-foreground">per month</p>}
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <UsageRow label="Connections" used={connections.length} limit={plan.limits.connections} />
          <UsageRow label="AI optimizations" used={optimizations.length} limit={plan.limits.aiOptimizations} />
          <UsageRow label="Retention (days)" used={plan.limits.retentionDays} limit={plan.limits.retentionDays} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Change plan</h2>
        <PlanSelector currentPlan={tier} />
      </div>
    </div>
  )
}
