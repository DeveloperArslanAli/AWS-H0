"use server"

import { createClient } from "@/lib/supabase/server"
import { runTick } from "@/lib/metrics/ingest"

/**
 * Ensures the user has at least one real, monitored connection.
 *
 * Instead of seeding static demo data, this registers the user's live Supabase
 * Postgres project as a monitored connection and runs an initial real
 * ingestion tick so the dashboard immediately reflects genuine measurements.
 * Idempotent: does nothing if the user already has a connection.
 */
export async function ensureLiveConnection(): Promise<{ provisioned: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { provisioned: false }

  const { count } = await supabase
    .from("db_connections")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  if ((count ?? 0) > 0) return { provisioned: false }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  let host = "db.supabase.co"
  try {
    host = new URL(url).host
  } catch {
    // keep fallback
  }

  const { data: conn, error } = await supabase
    .from("db_connections")
    .insert({
      user_id: user.id,
      name: "supabase-primary",
      engine: "supabase",
      host,
      port: 5432,
      database_name: "postgres",
      environment: "production",
      region: "aws-us-east-1",
      status: "connecting",
      ssl_enabled: true,
    })
    .select("id")
    .single()

  if (error || !conn) {
    console.log("[v0] provision: failed to create connection:", error?.message)
    return { provisioned: false }
  }

  // Initial real measurement so the dashboard is alive immediately.
  try {
    await runTick(supabase, user.id, conn.id, { syncQueries: true })
  } catch (err) {
    console.log("[v0] provision: initial tick failed:", err instanceof Error ? err.message : err)
  }

  return { provisioned: true }
}
