import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runTick } from "@/lib/metrics/ingest"

export const dynamic = "force-dynamic"

/**
 * Real ingestion tick. Captures a genuine measurement for every connection the
 * authenticated user owns, persists it, refreshes real query stats for the
 * primary connection, and evaluates alert thresholds. Called by the live
 * dashboard poller and usable by external collectors.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data: connections, error } = await supabase
      .from("db_connections")
      .select("id")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[api] tick: failed to load connections:", error.message)
      return NextResponse.json({ ok: false, error: "Failed to load database connections" }, { status: 500 })
    }
    if (!connections || connections.length === 0) {
      return NextResponse.json({ ok: true, ticks: [], note: "no connections" })
    }

    // Wrap the promises with individual try-catches if we wanted partial success, 
    // but here we just catch overall failure.
    const results = await Promise.all(
      connections.map((c: { id: string }, idx: number) =>
        runTick(supabase, user.id, c.id, { syncQueries: idx === 0 }),
      ),
    )
    const alertsRaised = results.reduce((s, r) => s + r.alertsRaised, 0)
    const queriesSynced = results.reduce((s, r) => s + r.queriesSynced, 0)
    return NextResponse.json({ ok: true, ticks: results, alertsRaised, queriesSynced })
  } catch (err) {
    console.error("[api] tick error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, error: "An internal server error occurred during ingestion." }, { status: 500 })
  }
}
