"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Drives the real-time pipeline from the client: every `intervalMs` it asks the
 * server to capture a fresh real measurement (POST /api/metrics/tick) and then
 * refreshes the server components so charts and stats update live.
 */
export function LiveRefresher({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter()
  const [live, setLive] = useState(false)
  const inFlight = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function tick() {
      if (inFlight.current) return
      inFlight.current = true
      try {
        const res = await fetch("/api/metrics/tick", { method: "POST", cache: "no-store" })
        if (!cancelled && res.ok) {
          setLive(true)
          router.refresh()
        }
      } catch {
        if (!cancelled) setLive(false)
      } finally {
        inFlight.current = false
      }
    }

    // Run one immediately, then on the interval.
    tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [intervalMs, router])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
      <span className={`size-2 rounded-full ${live ? "bg-chart-2 animate-pulse" : "bg-muted-foreground/40"}`} />
      {live ? "Live" : "Connecting…"}
    </div>
  )
}
