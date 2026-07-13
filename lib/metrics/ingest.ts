import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { captureRealMetric, type DbStats, type RealMetric } from "@/lib/metrics/collector"
import type { ConnectionStatus, QueryStatus } from "@/lib/types"

// Real threshold definitions used for alert evaluation.
const THRESHOLDS = {
  latency_p95_ms: 500,
  cpu_pct: 85,
  cache_hit_ratio: 90, // alert when BELOW
  connection_utilization_pct: 85,
}

function hashQuery(text: string, connectionId: string): string {
  let h = 0
  const s = text + connectionId
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return `q${(h >>> 0).toString(16)}`
}

function queryStatus(meanMs: number): QueryStatus {
  if (meanMs >= 1000) return "critical"
  if (meanMs >= 200) return "slow"
  return "healthy"
}

function connStatusFromMetric(m: RealMetric, stats: DbStats | null): ConnectionStatus {
  if (m.latency_p95_ms <= 0 && m.active_connections === 0 && !stats) return "down"
  const utilization = stats && stats.max_connections > 0 ? (m.active_connections / stats.max_connections) * 100 : 0
  if (m.latency_p95_ms > THRESHOLDS.latency_p95_ms || m.cpu_pct > THRESHOLDS.cpu_pct || utilization > THRESHOLDS.connection_utilization_pct) {
    return "degraded"
  }
  return "healthy"
}

/**
 * Raise a real alert only when a measured value breaches a threshold AND there
 * is no already-open alert for the same metric/connection (de-duplication).
 */
async function evaluateAlerts(
  supabase: SupabaseClient,
  userId: string,
  connectionId: string,
  m: RealMetric,
  stats: DbStats | null,
) {
  const candidates: {
    metric: string
    breached: boolean
    severity: "info" | "warning" | "critical"
    title: string
    description: string
    threshold: number
    observed: number
  }[] = []

  candidates.push({
    metric: "latency_p95_ms",
    breached: m.latency_p95_ms > THRESHOLDS.latency_p95_ms,
    severity: m.latency_p95_ms > THRESHOLDS.latency_p95_ms * 2 ? "critical" : "warning",
    title: "Elevated query latency",
    description: `Measured p95 latency ${m.latency_p95_ms}ms exceeds ${THRESHOLDS.latency_p95_ms}ms.`,
    threshold: THRESHOLDS.latency_p95_ms,
    observed: m.latency_p95_ms,
  })

  candidates.push({
    metric: "cpu_pct",
    breached: m.cpu_pct > THRESHOLDS.cpu_pct,
    severity: "warning",
    title: "High CPU utilisation",
    description: `Process CPU ${m.cpu_pct}% exceeds ${THRESHOLDS.cpu_pct}%.`,
    threshold: THRESHOLDS.cpu_pct,
    observed: m.cpu_pct,
  })

  candidates.push({
    metric: "cache_hit_ratio",
    breached: m.cache_hit_ratio < THRESHOLDS.cache_hit_ratio,
    severity: "warning",
    title: "Low cache hit ratio",
    description: `Buffer cache hit ratio ${m.cache_hit_ratio}% is below ${THRESHOLDS.cache_hit_ratio}%.`,
    threshold: THRESHOLDS.cache_hit_ratio,
    observed: m.cache_hit_ratio,
  })

  if (stats && stats.max_connections > 0) {
    const util = Number(((m.active_connections / stats.max_connections) * 100).toFixed(2))
    candidates.push({
      metric: "connection_utilization_pct",
      breached: util > THRESHOLDS.connection_utilization_pct,
      severity: "warning",
      title: "Connection pool saturation",
      description: `Active connections at ${util}% of max_connections (${stats.max_connections}).`,
      threshold: THRESHOLDS.connection_utilization_pct,
      observed: util,
    })
  }

  const breached = candidates.filter((c) => c.breached)
  if (breached.length === 0) return 0

  // Fetch existing open alerts for this connection to de-duplicate.
  const { data: open } = await supabase
    .from("alerts")
    .select("metric")
    .eq("connection_id", connectionId)
    .eq("status", "open")
  const openMetrics = new Set((open ?? []).map((a: { metric: string }) => a.metric))

  const toInsert = breached
    .filter((c) => !openMetrics.has(c.metric))
    .map((c) => ({
      user_id: userId,
      connection_id: connectionId,
      severity: c.severity,
      status: "open",
      title: c.title,
      description: c.description,
      metric: c.metric,
      threshold: c.threshold,
      observed_value: c.observed,
    }))

  if (toInsert.length > 0) {
    await supabase.from("alerts").insert(toInsert)
  }
  return toInsert.length
}

/** Sync real top queries from pg_stat_statements into the queries table. */
async function syncRealQueries(supabase: SupabaseClient, userId: string, connectionId: string) {
  const { data, error } = await supabase.rpc("auroraguard_top_queries", { p_limit: 25 })
  if (error || !data || !Array.isArray(data)) return 0

  const rows = data
    .filter((q: { query_text: string | null }) => q.query_text && q.query_text.trim().length > 0)
    .map((q: { query_text: string; calls: number; mean_exec_ms: number; total_exec_ms: number; rows_read: number }) => ({
      user_id: userId,
      connection_id: connectionId,
      query_text: q.query_text,
      query_hash: hashQuery(q.query_text, connectionId),
      calls: Math.round(Number(q.calls) || 0),
      mean_exec_ms: Number(q.mean_exec_ms) || 0,
      total_exec_ms: Number(q.total_exec_ms) || 0,
      rows_read: Math.round(Number(q.rows_read) || 0),
      status: queryStatus(Number(q.mean_exec_ms) || 0),
    }))

  if (rows.length === 0) return 0
  // Replace this connection's query snapshot with the freshest real stats.
  // (delete-then-insert keeps the table in sync without a unique constraint).
  await supabase.from("queries").delete().eq("connection_id", connectionId)
  const { error: insErr } = await supabase.from("queries").insert(rows)
  if (insErr) return 0
  return rows.length
}

export interface TickResult {
  connectionId: string
  metric: RealMetric
  status: ConnectionStatus
  alertsRaised: number
  queriesSynced: number
}

/**
 * Run one real ingestion tick for a single connection: capture a genuine
 * measurement, persist it, refresh real query stats, evaluate alerts, and
 * update the connection's health — all under the caller's RLS context.
 */
export async function runTick(
  supabase: SupabaseClient,
  userId: string,
  connectionId: string,
  opts: { syncQueries?: boolean } = {},
): Promise<TickResult> {
  const { metric, stats } = await captureRealMetric(supabase, `${userId}:${connectionId}`)

  await supabase.from("metrics").insert({
    user_id: userId,
    connection_id: connectionId,
    ts: new Date().toISOString(),
    ...metric,
  })

  const status = connStatusFromMetric(metric, stats)
  await supabase
    .from("db_connections")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", connectionId)

  const [alertsRaised, queriesSynced] = await Promise.all([
    evaluateAlerts(supabase, userId, connectionId, metric, stats),
    opts.syncQueries ? syncRealQueries(supabase, userId, connectionId) : Promise.resolve(0),
  ])

  return { connectionId, metric, status, alertsRaised, queriesSynced }
}
