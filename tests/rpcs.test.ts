import { describe, it, expect } from "vitest"
import { adminClient } from "./helpers"

describe("Observability RPCs (real Postgres statistics)", () => {
  const db = adminClient()

  it("auroraguard_ping returns 1", async () => {
    const { data, error } = await db.rpc("auroraguard_ping")
    expect(error).toBeNull()
    expect(Number(data)).toBe(1)
  })

  it("auroraguard_db_stats returns genuine live database stats", async () => {
    const { data, error } = await db.rpc("auroraguard_db_stats")
    expect(error).toBeNull()
    const row = Array.isArray(data) ? data[0] : data
    expect(row).toBeTruthy()

    // Real, non-static expectations about a live Postgres instance.
    expect(Number(row.active_connections)).toBeGreaterThan(0)
    expect(Number(row.max_connections)).toBeGreaterThan(0)
    expect(Number(row.db_size_bytes)).toBeGreaterThan(0)
    const hit = Number(row.cache_hit_ratio)
    expect(hit).toBeGreaterThanOrEqual(0)
    expect(hit).toBeLessThanOrEqual(100)
    expect(Number(row.txn_commit)).toBeGreaterThanOrEqual(0)
  })

  it("auroraguard_top_queries returns an array of real query stats", async () => {
    const { data, error } = await db.rpc("auroraguard_top_queries", { p_limit: 10 })
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    if (data.length > 0) {
      const q = data[0]
      expect(typeof q.query_text).toBe("string")
      expect(Number(q.calls)).toBeGreaterThanOrEqual(0)
      expect(Number(q.mean_exec_ms)).toBeGreaterThanOrEqual(0)
    }
  })
})
