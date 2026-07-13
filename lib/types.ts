import type { PlanTier } from "./plans"

export type DbEngine = "postgres" | "mysql" | "aurora-postgres" | "aurora-mysql" | "supabase"
export type ConnectionStatus = "healthy" | "degraded" | "down" | "connecting"
export type QueryStatus = "healthy" | "slow" | "critical"
export type AlertSeverity = "info" | "warning" | "critical"
export type AlertStatus = "open" | "acknowledged" | "resolved"

export interface Profile {
  id: string
  full_name: string | null
  company: string | null
  plan: PlanTier
  created_at: string
  updated_at: string
}

export interface DbConnection {
  id: string
  user_id: string
  name: string
  engine: DbEngine
  host: string
  port: number
  database_name: string
  environment: string
  region: string
  status: ConnectionStatus
  ssl_enabled: boolean
  created_at: string
  updated_at: string
}

export interface QueryRecord {
  id: string
  user_id: string
  connection_id: string
  query_text: string
  query_hash: string
  calls: number
  mean_exec_ms: number
  total_exec_ms: number
  rows_read: number
  status: QueryStatus
  captured_at: string
}

export interface MetricPoint {
  id: string
  user_id: string
  connection_id: string
  ts: string
  cpu_pct: number
  active_connections: number
  qps: number
  latency_p95_ms: number
  cache_hit_ratio: number
  storage_gb: number
}

export interface Alert {
  id: string
  user_id: string
  connection_id: string | null
  severity: AlertSeverity
  status: AlertStatus
  title: string
  description: string | null
  metric: string | null
  threshold: number | null
  observed_value: number | null
  created_at: string
}

export interface Optimization {
  id: string
  user_id: string
  query_id: string | null
  original_query: string
  optimized_query: string | null
  recommendation: string | null
  estimated_improvement_pct: number | null
  model: string | null
  applied: boolean
  applied_at: string | null
  created_at: string
}
