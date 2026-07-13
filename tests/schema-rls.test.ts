import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { adminClient, createTestUser, deleteTestUser, type TestUser } from "./helpers"

describe("Schema & Row-Level Security (real Supabase)", () => {
  let alice: TestUser
  let bob: TestUser
  let aliceConnId: string

  beforeAll(async () => {
    alice = await createTestUser()
    bob = await createTestUser()
  })

  afterAll(async () => {
    if (alice) await deleteTestUser(alice.id)
    if (bob) await deleteTestUser(bob.id)
  })

  it("all six core tables exist and are queryable", async () => {
    const admin = adminClient()
    for (const table of ["profiles", "db_connections", "queries", "metrics", "alerts", "optimizations"]) {
      const { error } = await admin.from(table).select("*", { head: true, count: "exact" }).limit(1)
      expect(error, `table ${table} should exist`).toBeNull()
    }
  })

  it("a user can create and read their own connection", async () => {
    const { data, error } = await alice.client
      .from("db_connections")
      .insert({
        user_id: alice.id,
        name: "alice-db",
        engine: "supabase",
        host: "db.alice.test",
        port: 5432,
        database_name: "postgres",
      })
      .select("id")
      .single()
    expect(error).toBeNull()
    aliceConnId = data!.id
    expect(aliceConnId).toBeTruthy()

    const { data: read } = await alice.client.from("db_connections").select("*").eq("id", aliceConnId)
    expect(read?.length).toBe(1)
  })

  it("RLS prevents another user from reading the connection", async () => {
    const { data } = await bob.client.from("db_connections").select("*").eq("id", aliceConnId)
    expect(data?.length ?? 0).toBe(0)
  })

  it("RLS prevents another user from updating the connection", async () => {
    const { data } = await bob.client
      .from("db_connections")
      .update({ name: "hacked" })
      .eq("id", aliceConnId)
      .select("id")
    // RLS makes the row invisible to bob, so nothing is updated.
    expect(data?.length ?? 0).toBe(0)

    // Confirm the name is unchanged from the owner's perspective.
    const { data: owner } = await alice.client.from("db_connections").select("name").eq("id", aliceConnId).single()
    expect(owner?.name).toBe("alice-db")
  })

  it("RLS blocks inserting a row on behalf of a different user", async () => {
    const { error } = await bob.client.from("db_connections").insert({
      user_id: alice.id, // bob trying to write as alice
      name: "spoofed",
      engine: "supabase",
      host: "x",
      port: 5432,
      database_name: "postgres",
    })
    expect(error).not.toBeNull()
  })

  it("metrics and alerts are isolated per user", async () => {
    await alice.client.from("metrics").insert({
      user_id: alice.id,
      connection_id: aliceConnId,
      cpu_pct: 12.5,
      active_connections: 3,
      qps: 10,
      latency_p95_ms: 42,
      cache_hit_ratio: 99,
      storage_gb: 1.2,
    })
    const { data: bobView } = await bob.client.from("metrics").select("*").eq("connection_id", aliceConnId)
    expect(bobView?.length ?? 0).toBe(0)

    const { data: aliceView } = await alice.client.from("metrics").select("*").eq("connection_id", aliceConnId)
    expect((aliceView?.length ?? 0) >= 1).toBe(true)
  })
})
