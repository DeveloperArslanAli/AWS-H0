import { cn } from "@/lib/utils"
import type { ConnectionStatus, QueryStatus, AlertSeverity, AlertStatus } from "@/lib/types"

type Status = ConnectionStatus | QueryStatus | AlertSeverity | AlertStatus

const STYLES: Record<string, string> = {
  // healthy / good
  healthy: "bg-primary/15 text-primary",
  resolved: "bg-primary/15 text-primary",
  info: "bg-chart-2/15 text-chart-2",
  acknowledged: "bg-chart-2/15 text-chart-2",
  connecting: "bg-muted text-muted-foreground",
  // warning
  degraded: "bg-chart-3/15 text-chart-3",
  slow: "bg-chart-3/15 text-chart-3",
  warning: "bg-chart-3/15 text-chart-3",
  open: "bg-chart-3/15 text-chart-3",
  // critical
  down: "bg-destructive/15 text-destructive",
  critical: "bg-destructive/15 text-destructive",
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
