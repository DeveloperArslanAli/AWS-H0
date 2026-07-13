import { Database, Server, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { AddConnectionDialog } from "@/components/dashboard/add-connection-dialog"
import { DeleteConnectionButton } from "@/components/dashboard/delete-connection-button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getConnections } from "@/lib/data"
import { formatRelative } from "@/lib/format"

const engineLabels: Record<string, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
  "aurora-postgres": "Aurora PostgreSQL",
  "aurora-mysql": "Aurora MySQL",
  supabase: "Supabase",
}

export default async function ConnectionsPage() {
  const connections = await getConnections()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Connections"
        description="Databases AuroraGuard is actively monitoring."
        action={<AddConnectionDialog />}
      />

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <Database className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No connections yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your first database to start collecting query and performance metrics.
            </p>
            <AddConnectionDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {connections.map((c) => (
            <Card key={c.id} className="group relative overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                      <Server className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{engineLabels[c.engine] ?? c.engine}</p>
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <div className="flex flex-col gap-2 rounded-lg bg-secondary/50 p-3 font-mono text-xs text-muted-foreground">
                  <span className="truncate">{c.host}:{c.port}</span>
                  <span className="truncate">/{c.database_name}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{c.environment}</Badge>
                  <Badge variant="outline" className="text-xs">{c.region}</Badge>
                  {c.ssl_enabled && (
                    <Badge variant="outline" className="gap-1 text-xs text-primary">
                      <ShieldCheck className="size-3" /> SSL
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">Added {formatRelative(c.created_at)}</span>
                  <DeleteConnectionButton id={c.id} name={c.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
