import { History, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { OptimizerPanel } from "@/components/dashboard/optimizer-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getOptimizations, getQueries } from "@/lib/data"
import { activeModelLabel } from "@/lib/ai/provider"
import { formatRelative } from "@/lib/format"

export default async function OptimizerPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const { query: queryId } = await searchParams
  const [history, queries] = await Promise.all([getOptimizations(10), getQueries({ limit: 200 })])

  const initialQuery = queryId ? queries.find((q) => q.id === queryId)?.query_text : undefined

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Query Fixer"
        description="Paste slow SQL — AuroraGuard rewrites it, creates indexes, and applies the fix live."
      />

      <OptimizerPanel
        initialQuery={initialQuery}
        initialQueryId={queryId}
        modelLabel={activeModelLabel()}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-muted-foreground" /> Recent optimizations
          </CardTitle>
          <CardDescription>Your last analyzed and fixed queries.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No optimizations yet. Run your first analysis above.
            </p>
          ) : (
            history.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <code className="truncate font-mono text-xs text-muted-foreground">{o.original_query}</code>
                <div className="flex shrink-0 items-center gap-3">
                  {o.applied && (
                    <Badge variant="outline" className="border-primary/40 text-primary gap-1">
                      <CheckCircle2 className="size-3" />
                      Applied
                    </Badge>
                  )}
                  {o.estimated_improvement_pct != null && (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      -{Math.round(o.estimated_improvement_pct)}%
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{formatRelative(o.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
