import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { AlertsList } from "@/components/dashboard/alerts-list"
import { Bell, AlertTriangle, CheckCircle2, Eye } from "lucide-react"
import { getAlerts } from "@/lib/data"

export default async function AlertsPage() {
  const alerts = await getAlerts({ limit: 100 })

  const open = alerts.filter((a) => a.status === "open").length
  const critical = alerts.filter((a) => a.severity === "critical" && a.status !== "resolved").length
  const acknowledged = alerts.filter((a) => a.status === "acknowledged").length
  const resolved = alerts.filter((a) => a.status === "resolved").length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Alerts" description="Threshold breaches and anomalies detected across your fleet." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open" value={`${open}`} icon={Bell} trend={open > 0 ? "down" : "up"} />
        <StatCard label="Critical" value={`${critical}`} icon={AlertTriangle} trend={critical > 0 ? "down" : "up"} />
        <StatCard label="Acknowledged" value={`${acknowledged}`} icon={Eye} />
        <StatCard label="Resolved" value={`${resolved}`} icon={CheckCircle2} trend="up" />
      </div>

      <AlertsList alerts={alerts} />
    </div>
  )
}
