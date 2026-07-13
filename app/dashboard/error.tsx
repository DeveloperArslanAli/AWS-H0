"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("[Dashboard] Error boundary caught error:", error)
  }, [error])

  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">Something went wrong</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        We encountered an error loading the dashboard data. This might be a temporary issue connecting to the database.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </button>
      <p className="mt-8 text-xs text-muted-foreground">
        Error details: {error.message || "Unknown error"}
      </p>
    </div>
  )
}
