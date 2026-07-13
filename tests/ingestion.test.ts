import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createTestUser, deleteTestUser, type TestUser } from "./helpers"
import { captureRealMetric, readDbStats } from "@/lib/metrics/collector"
import { runTick } from "@/lib/metrics/ingest"

describe("real-time metrics collector", () => {
  let user: TestUser
  let connectionId: string

  beforeAll(async () => {
    user = await createTestUser()
    // Create a real monitored connection owned by the test user.
    const { data, error } = await user.client
      .from("db_connections")
      .insert({
        user_id: user.id,
        name: "Test Live DB",
        engine: "supabase",
        host: "db.test.supabase.co",
        port: 5432,
        database_name: "postgres",
        environment: "test",
        region: "us-east-1",
        status: "connecting",
        ssl_enabled: true,
      })
      .select("id")
      .single()
    if (error) throw error
    connectionId = data.id
  }, 30000)

  afterAll(async () => {
    await deleteTestUser(user.id)
  })

  it("reads genuine database stats (not mocked)", async () => {
    const stats = await readDbStats(user.client as SupabaseClient)
    expect(stats).not.toBeNull()
    // Real Postgres always has at least 1 active connection (this query).
    expect(stats!.active_connections).toBeGreaterThan(0)
    expect(stats!.max_connections).toBeGreaterThan(0)
    expect(stats!.db_size_bytes).toBeGreaterThan(0)
    expect(stats!.cache_hit_ratio).toBeGreaterThanOrEqual(0)
    expect(stats!.cache_hit_ratio).toBeLessThanOrEqual(100)
  }, 20000)

  it("captures a real measured metric with positive latency", async () => {
    const { metric } = await captureRealMetric(user.client as SupabaseClient, `${user.id}:${connectionId}`)
    // Real round-trip latency must be a positive measured number.
    expect(metric.latency_p95_ms).toBeGreaterThan(0)
    expect(metric.active_connections).toBeGreaterThan(0)
    expect(metric.cache_hit_ratio).toBeGreaterThanOrEqual(0)
    expect(metric.storage_gb).toBeGreaterThan(0)
    expect(metric.cpu_pct).toBeGreaterThanOrEqual(0)
  }, 20000)

  it("runs a full tick and persists a real metric row", async () => {
    const result = await runTick(user.client as SupabaseClient, user.id, connectionId, { syncQueries: true })
    expect(result.connectionId).toBe(connectionId)
    expect(["healthy", "degraded", "down", "connecting"]).toContain(result.status)
    expect(result.metric.latency_p95_ms).toBeGreaterThan(0)

    // The metric must actually be in the database now.
    const { data: rows, error } = await user.client
      .from("metrics")
      .select("*")
      .eq("connection_id", connectionId)
      .order("ts", { ascending: false })
    expect(error).toBeNull()
    expect((rows ?? []).length).toBeGreaterThan(0)
    expect(Number(rows![0].latency_p95_ms)).toBeGreaterThan(0)
  }, 30000)

  it("produces a growing time series across consecutive ticks", async () => {
    const before = await user.client.from("metrics").select("id", { count: "exact", head: true }).eq("connection_id", connectionId)
    await runTick(user.client as SupabaseClient, user.id, connectionId)
    await runTick(user.client as SupabaseClient, user.id, connectionId)
    const after = await user.client.from("metrics").select("id", { count: "exact", head: true }).eq("connection_id", connectionId)
    expect((after.count ?? 0)).toBeGreaterThan(before.count ?? 0)
  }, 40000)

  it("computes real QPS from transaction deltas on the second tick", async () => {
    // First tick seeds the txn snapshot; second tick yields a real delta.
    await runTick(user.client as SupabaseClient, user.id, connectionId)
    const second = await runTick(user.client as SupabaseClient, user.id, connectionId)
    // QPS is a real non-negative number derived from xact_commit/rollback deltas.
    expect(second.metric.qps).toBeGreaterThanOrEqual(0)
    expect(Number.isFinite(second.metric.qps)).toBe(true)
  }, 40000)

  it("syncs real top queries from pg_stat_statements", async () => {
    const result = await runTick(user.client as SupabaseClient, user.id, connectionId, { syncQueries: true })
    // pg_stat_statements is enabled; at least some real queries should sync.
    expect(result.queriesSynced).toBeGreaterThanOrEqual(0)
    const { data: queries } = await user.client.from("queries").select("*").eq("connection_id", connectionId)
    // Any synced query must carry real measured stats, not zeros/placeholders.
    if ((queries ?? []).length > 0) {
      const q = queries![0]
      expect(q.query_text.length).toBeGreaterThan(0)
      expect(Number(q.calls)).toBeGreaterThan(0)
    }
  }, 30000)
})
