import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { QueriesTable } from "@/components/dashboard/queries-table"
import { Activity, AlertTriangle, Clock, Database } from "lucide-react"
import { getQueries } from "@/lib/data"
import { formatNumber } from "@/lib/format"

export default async function QueriesPage() {
  const queries = await getQueries({ limit: 200 })

  const total = queries.length
  const slow = queries.filter((q) => q.status === "slow").length
  const critical = queries.filter((q) => q.status === "critical").length
  const totalCalls = queries.reduce((s, q) => s + q.calls, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Query insights"
        description="Every statement AuroraGuard has captured, ranked by impact."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tracked queries" value={`${total}`} icon={Database} />
        <StatCard label="Total calls" value={formatNumber(totalCalls)} icon={Activity} />
        <StatCard label="Slow" value={`${slow}`} icon={Clock} trend={slow > 0 ? "down" : "up"} />
        <StatCard label="Critical" value={`${critical}`} icon={AlertTriangle} trend={critical > 0 ? "down" : "up"} />
      </div>

      <QueriesTable queries={queries} />
    </div>
  )
}
