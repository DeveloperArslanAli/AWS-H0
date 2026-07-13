"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { ArrowUpDown, Search, Sparkles, Wrench, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDuration, formatNumber } from "@/lib/format"
import type { QueryRecord } from "@/lib/types"
import { quickFixQuery } from "@/app/actions/optimize"
import { toast } from "sonner"

type SortKey = "total_exec_ms" | "mean_exec_ms" | "calls" | "rows_read"

export function QueriesTable({ queries }: { queries: QueryRecord[] }) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [sortKey, setSortKey] = useState<SortKey>("total_exec_ms")
  const [pending, startTransition] = useTransition()
  const [fixingId, setFixingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return queries
      .filter((q) => (status === "all" ? true : q.status === status))
      .filter((q) => q.query_text.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(b[sortKey]) - Number(a[sortKey]))
  }, [queries, search, status, sortKey])

  function handleQuickFix(qId: string) {
    setFixingId(qId)
    startTransition(async () => {
      try {
        const res = await quickFixQuery(qId)
        if (res.ok) {
          const parts = []
          if (res.queryUpdated) parts.push("Query rewritten")
          if (res.indexesCreated > 0) parts.push(`${res.indexesCreated} index(es) created`)
          toast.success("Fix applied: " + (parts.join(" & ") || "Optimized successfully!"))
        } else {
          toast.error(res.error)
        }
      } catch {
        toast.error("Failed to apply auto-fix")
      } finally {
        setFixingId(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queries…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="slow">Slow</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[150px]">
              <ArrowUpDown className="mr-1 size-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total_exec_ms">Total time</SelectItem>
              <SelectItem value="mean_exec_ms">Mean time</SelectItem>
              <SelectItem value="calls">Calls</SelectItem>
              <SelectItem value="rows_read">Rows read</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Query</TableHead>
              <TableHead className="text-right">Calls</TableHead>
              <TableHead className="text-right">Mean</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  No queries match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-[320px]">
                    <code className="block truncate font-mono text-xs text-foreground">{q.query_text}</code>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatNumber(q.calls)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatDuration(q.mean_exec_ms)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-medium text-foreground">
                    {formatDuration(q.total_exec_ms)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {formatNumber(q.rows_read)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={q.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {q.status !== "healthy" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickFix(q.id)}
                          disabled={pending}
                          className="h-8 border-primary/30 text-primary hover:bg-primary/10"
                        >
                          {fixingId === q.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Wrench className="size-3.5" />
                          )}
                          <span className="ml-1 text-xs">Fix</span>
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="sm" className="h-8">
                        <Link href={`/dashboard/optimizer?query=${q.id}`}>
                          <Sparkles className="size-3.5 text-primary" />
                          <span className="sr-only">Optimize query</span>
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
