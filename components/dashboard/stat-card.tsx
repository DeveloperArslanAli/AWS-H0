import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaPositive,
  hint,
  trend,
}: {
  label: string
  value: string
  icon: LucideIcon
  delta?: string
  /** true when an increase is good (e.g. cache hit), false when bad (e.g. latency) */
  deltaPositive?: boolean
  hint?: string
  trend?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-1 text-xs">
        {delta && (
          <span className={cn("inline-flex items-center gap-0.5", deltaPositive ? "text-primary" : "text-destructive")}>
            {deltaPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {delta}
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  )
}
