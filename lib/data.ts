import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Profile, DbConnection, QueryRecord, MetricPoint, Alert, Optimization } from "@/lib/types"

export async function getSessionUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  return data as Profile | null
}

export async function getConnections(): Promise<DbConnection[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("db_connections").select("*").order("created_at", { ascending: true })
  return (data as DbConnection[]) ?? []
}

export async function getConnection(id: string): Promise<DbConnection | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("db_connections").select("*").eq("id", id).single()
  return data as DbConnection | null
}

export async function getQueries(opts?: { connectionId?: string; limit?: number }): Promise<QueryRecord[]> {
  const supabase = await createClient()
  let q = supabase.from("queries").select("*").order("total_exec_ms", { ascending: false })
  if (opts?.connectionId) q = q.eq("connection_id", opts.connectionId)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data } = await q
  return (data as QueryRecord[]) ?? []
}

export async function getMetrics(connectionId?: string): Promise<MetricPoint[]> {
  const supabase = await createClient()
  let q = supabase.from("metrics").select("*").order("ts", { ascending: true })
  if (connectionId) q = q.eq("connection_id", connectionId)
  const { data } = await q
  return (data as MetricPoint[]) ?? []
}

export async function getAlerts(opts?: { status?: string; limit?: number }): Promise<Alert[]> {
  const supabase = await createClient()
  let q = supabase.from("alerts").select("*").order("created_at", { ascending: false })
  if (opts?.status) q = q.eq("status", opts.status)
  if (opts?.limit) q = q.limit(opts.limit)
  const { data } = await q
  return (data as Alert[]) ?? []
}

export async function getOptimizations(limit = 20): Promise<Optimization[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("optimizations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  return (data as Optimization[]) ?? []
}
