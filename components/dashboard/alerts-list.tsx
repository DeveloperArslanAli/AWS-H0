"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, Bell, CheckCircle2, Info, Eye } from "lucide-react"
import { toast } from "sonner"
import { updateAlertStatus } from "@/app/actions/alerts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRelative } from "@/lib/format"
import type { Alert } from "@/lib/types"

const severityIcon = {
  info: Info,
  warning: AlertTriangle,
  critical: Bell,
}

const severityStyle: Record<string, string> = {
  info: "text-muted-foreground",
  warning: "text-chart-4",
  critical: "text-destructive",
}

const statusStyle: Record<string, string> = {
  open: "border-destructive/40 text-destructive",
  acknowledged: "border-chart-4/40 text-chart-4",
  resolved: "border-primary/40 text-primary",
}

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  const [filter, setFilter] = useState<string>("all")
  const [pending, startTransition] = useTransition()

  const filtered = alerts.filter((a) => (filter === "all" ? true : a.status === filter))

  function setStatus(id: string, status: "acknowledged" | "resolved") {
    startTransition(async () => {
      const res = await updateAlertStatus(id, status)
      if (res.ok) toast.success(status === "resolved" ? "Alert resolved" : "Alert acknowledged")
      else toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <CheckCircle2 className="size-8 text-primary" />
            <p className="text-sm text-muted-foreground">No alerts in this view.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((a) => {
            const Icon = severityIcon[a.severity]
            return (
              <Card key={a.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 size-5 shrink-0 ${severityStyle[a.severity]}`} />
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{a.title}</span>
                        <Badge variant="outline" className={statusStyle[a.status]}>
                          {a.status}
                        </Badge>
                      </div>
                      {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {a.metric && (
                          <span className="font-mono">
                            {a.metric}: {a.observed_value} (threshold {a.threshold})
                          </span>
                        )}
                        <span>{formatRelative(a.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {a.status !== "resolved" && (
                    <div className="flex shrink-0 items-center gap-2">
                      {a.status === "open" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pending}
                          onClick={() => setStatus(a.id, "acknowledged")}
                        >
                          <Eye className="mr-1 size-3.5" /> Ack
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => setStatus(a.id, "resolved")}
                      >
                        <CheckCircle2 className="mr-1 size-3.5" /> Resolve
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
