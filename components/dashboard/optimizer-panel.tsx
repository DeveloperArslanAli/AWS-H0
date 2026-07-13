"use client"

import { useState, useTransition } from "react"
import { Sparkles, Copy, Check, TrendingUp, AlertTriangle, Database, Wrench, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { optimizeQuery, applyOptimization, type OptimizeResult } from "@/app/actions/optimize"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const EXAMPLE = `SELECT *
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.created_at > now() - interval '30 days'
ORDER BY o.created_at DESC;`

const severityStyles: Record<string, string> = {
  low: "border-primary/40 text-primary",
  medium: "border-chart-4/40 text-chart-4",
  high: "border-destructive/40 text-destructive",
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Copied to clipboard")
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
    </Button>
  )
}

export function OptimizerPanel({
  initialQuery,
  initialQueryId,
  modelLabel,
}: {
  initialQuery?: string
  initialQueryId?: string
  modelLabel: string
}) {
  const [query, setQuery] = useState(initialQuery ?? "")
  const [queryId, setQueryId] = useState<string | undefined>(initialQueryId)
  const [result, setResult] = useState<OptimizeResult | null>(null)
  const [pending, startTransition] = useTransition()
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  function run() {
    if (!query.trim()) {
      toast.error("Enter a SQL query first")
      return
    }
    setApplied(false)
    startTransition(async () => {
      const res = await optimizeQuery({ queryText: query, queryId })
      setResult(res)
      if (!res.ok) toast.error(res.error)
    })
  }

  async function handleApplyFix() {
    if (!result?.ok) return
    setApplying(true)
    try {
      const res = await applyOptimization({
        queryId: queryId ?? null,
        optimizationId: result.optimizationId ?? null,
        optimizedQuery: result.analysis.optimized_query,
        indexSuggestions: result.analysis.index_suggestions,
      })
      if (res.ok) {
        setApplied(true)
        const parts = []
        if (res.queryUpdated) parts.push("Query updated to optimized version")
        if (res.indexesCreated > 0) parts.push(`${res.indexesCreated} index${res.indexesCreated > 1 ? "es" : ""} created`)
        if (parts.length === 0) parts.push("Optimization applied")
        toast.success(parts.join(". ") + "!")
        // Update the displayed query to the optimized version
        setQuery(result.analysis.optimized_query)
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Failed to apply fix")
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-primary" /> Your query
          </CardTitle>
          <CardDescription>Paste a SQL statement and let AuroraGuard fix it.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT ..."
            className="min-h-[220px] font-mono text-xs"
          />
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setQuery(EXAMPLE)} disabled={pending}>
              Use example
            </Button>
            <Button onClick={run} disabled={pending}>
              <Sparkles className="mr-1 size-4" />
              {pending ? "Analyzing…" : "Optimize"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-mono text-foreground">{modelLabel}</span>
          </p>
        </CardContent>
      </Card>

      <Card className="lg:row-span-1">
        <CardHeader>
          <CardTitle className="text-base">Analysis</CardTitle>
          <CardDescription>Recommendations and an optimized rewrite.</CardDescription>
        </CardHeader>
        <CardContent>
          {!result?.ok && (
            <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Sparkles className="size-8 text-muted-foreground/50" />
              <p>{pending ? "Running analysis…" : "Results will appear here after you run the optimizer."}</p>
            </div>
          )}

          {result?.ok && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-foreground">{result.analysis.summary}</p>
                <Badge variant="outline" className={severityStyles[result.analysis.severity]}>
                  {result.analysis.severity} impact
                </Badge>
              </div>

              {result.engine === "heuristic" && (
                <p className="rounded-md border border-chart-4/30 bg-chart-4/10 px-3 py-2 text-xs text-muted-foreground">
                  AI analysis is unavailable, so this used AuroraGuard&apos;s built-in static analyzer.
                  Results are rule-based heuristics; connect AI credits for deeper rewrites.
                </p>
              )}

              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3">
                <TrendingUp className="size-5 text-primary" />
                <span className="text-sm text-foreground">
                  Estimated improvement:{" "}
                  <span className="font-mono font-semibold text-primary">
                    {Math.round(result.analysis.estimated_improvement_pct)}%
                  </span>
                </span>
              </div>

              {result.analysis.issues.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Issues found
                  </h4>
                  {result.analysis.issues.map((issue, i) => (
                    <div key={i} className="flex gap-2 rounded-md border border-border p-3">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-chart-4" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">{issue.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Optimized query
                  </h4>
                  <CopyButton text={result.analysis.optimized_query} />
                </div>
                <pre className="overflow-x-auto rounded-md border border-border bg-secondary/50 p-3 font-mono text-xs text-foreground">
                  {result.analysis.optimized_query}
                </pre>
              </div>

              {result.analysis.index_suggestions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Suggested indexes
                  </h4>
                  {result.analysis.index_suggestions.map((idx, i) => (
                    <pre
                      key={i}
                      className="overflow-x-auto rounded-md border border-border bg-secondary/50 p-3 font-mono text-xs text-primary"
                    >
                      {idx}
                    </pre>
                  ))}
                </div>
              )}

              {/* Apply Fix Button */}
              <div className="border-t border-border pt-4">
                {applied ? (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3">
                    <CheckCircle2 className="size-5 text-primary" />
                    <span className="text-sm font-medium text-primary">Fix applied successfully!</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleApplyFix}
                    disabled={applying}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    {applying ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Applying fix…
                      </>
                    ) : (
                      <>
                        <Wrench className="mr-2 size-4" />
                        Apply Fix — Update Query &amp; Create Indexes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

