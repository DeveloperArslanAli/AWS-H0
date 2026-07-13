"use server"

import { generateText, Output } from "ai"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { optimizerModel } from "@/lib/ai/provider"
import { analyzeQueryHeuristically } from "@/lib/ai/heuristic-analyzer"

const analysisSchema = z.object({
  summary: z.string().describe("One or two sentence plain-language diagnosis of the query."),
  severity: z.enum(["low", "medium", "high"]).describe("How impactful the issues are."),
  issues: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
      }),
    )
    .describe("Specific problems found in the query."),
  optimized_query: z.string().describe("A rewritten, optimized version of the SQL query."),
  index_suggestions: z.array(z.string()).describe("CREATE INDEX statements that would help, if any."),
  estimated_improvement_pct: z
    .number()
    .describe("Estimated percentage reduction in execution time, 0-100."),
})

export type AnalysisResult = z.infer<typeof analysisSchema>

export type OptimizeResult =
  | { ok: true; analysis: AnalysisResult; model: string; engine: "ai" | "heuristic"; optimizationId?: string }
  | { ok: false; error: string }

export type ApplyResult =
  | { ok: true; indexesCreated: number; queryUpdated: boolean }
  | { ok: false; error: string }

export async function optimizeQuery(input: {
  queryText: string
  queryId?: string | null
}): Promise<OptimizeResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Not authenticated" }

    const queryText = input.queryText?.trim()
    if (!queryText || queryText.length < 8) {
      return { ok: false, error: "Please provide a SQL query to analyze." }
    }

    let analysis: z.infer<typeof analysisSchema>
    let engine: "ai" | "heuristic" = "ai"
    let model = optimizerModel

    try {
      const { experimental_output } = await generateText({
        model: optimizerModel,
        system:
          "You are AuroraGuard's senior database performance engineer. You analyze SQL queries " +
          "for performance problems (missing indexes, sequential scans, N+1 patterns, SELECT *, " +
          "non-sargable predicates, unnecessary sorts/joins) and return a precise, actionable " +
          "rewrite. Be concrete and assume PostgreSQL unless the query clearly indicates otherwise. " +
          "Never invent columns that are not referenced in the query.",
        prompt: `Analyze and optimize this SQL query:\n\n${queryText}`,
        experimental_output: Output.object({ schema: analysisSchema }),
      })
      analysis = experimental_output
    } catch (err) {
      // Graceful degradation: the AI provider is unavailable (no credits, rate
      // limit, network). Fall back to deterministic static analysis so the
      // headline feature still returns useful results.
      console.warn("[actions] optimizeQuery AI fallback:", err instanceof Error ? err.message : err)
      analysis = analyzeQueryHeuristically(queryText)
      engine = "heuristic"
      model = "auroraguard/static-analyzer"
    }

    let optimizationId: string | undefined
    try {
      // Persist the optimization (RLS scopes to this user via user_id)
      const { data, error } = await supabase.from("optimizations").insert({
        user_id: user.id,
        query_id: input.queryId ?? null,
        original_query: queryText,
        optimized_query: analysis.optimized_query,
        recommendation: analysis.summary,
        estimated_improvement_pct: Math.max(0, Math.min(100, analysis.estimated_improvement_pct)),
        model,
        applied: false,
      }).select("id").single()
      if (error) {
        console.error("[actions] optimizeQuery insert error:", error.message)
      } else {
        optimizationId = data?.id
      }
      revalidatePath("/dashboard/optimizer")
    } catch (err) {
      console.error("[actions] optimizeQuery persist error:", err instanceof Error ? err.message : err)
    }

    return { ok: true, analysis, model, engine, optimizationId }
  } catch (err) {
    console.error("[actions] optimizeQuery error:", err)
    return { ok: false, error: "An unexpected error occurred during optimization." }
  }
}

/**
 * Apply the optimization: replace the query text in the DB, execute index
 * suggestions, and mark the query as healthy.
 */
export async function applyOptimization(input: {
  queryId?: string | null
  optimizationId?: string | null
  optimizedQuery: string
  indexSuggestions: string[]
}): Promise<ApplyResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Not authenticated" }

    const admin = createAdminClient()
    let queryUpdated = false
    let indexesCreated = 0

    // 1. Update the query record with the optimized text and mark as healthy
    if (input.queryId) {
      const { error: updateError } = await supabase
        .from("queries")
        .update({
          query_text: input.optimizedQuery,
          status: "healthy",
          mean_exec_ms: 0,
          total_exec_ms: 0,
        })
        .eq("id", input.queryId)
        .eq("user_id", user.id)

      if (updateError) {
        console.error("[actions] applyOptimization query update error:", updateError.message)
      } else {
        queryUpdated = true
      }
    }

    // 2. Execute each index suggestion via the secure DDL RPC
    for (const ddl of input.indexSuggestions) {
      try {
        const { data, error } = await admin.rpc("auroraguard_exec_ddl", {
          ddl_statement: ddl,
        })
        if (error) {
          console.error("[actions] applyOptimization DDL error:", error.message, ddl)
        } else if (data && typeof data === "object" && "ok" in data && data.ok) {
          indexesCreated++
        } else {
          console.warn("[actions] applyOptimization DDL rejected:", data, ddl)
        }
      } catch (err) {
        console.error("[actions] applyOptimization DDL exec error:", err)
      }
    }

    // 3. Mark the optimization as applied
    if (input.optimizationId) {
      const { error: markError } = await supabase
        .from("optimizations")
        .update({
          applied: true,
          applied_at: new Date().toISOString(),
        })
        .eq("id", input.optimizationId)
        .eq("user_id", user.id)

      if (markError) {
        console.error("[actions] applyOptimization mark applied error:", markError.message)
      }
    }

    revalidatePath("/dashboard/optimizer")
    revalidatePath("/dashboard/queries")
    revalidatePath("/dashboard")

    return { ok: true, indexesCreated, queryUpdated }
  } catch (err) {
    console.error("[actions] applyOptimization error:", err)
    return { ok: false, error: "An unexpected error occurred while applying the fix." }
  }
}

/**
 * One-click fix for queries: fetches query from DB, runs optimizer, and applies the suggestions immediately.
 */
export async function quickFixQuery(queryId: string): Promise<ApplyResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Not authenticated" }

    // Fetch the query text
    const { data: queryRecord, error: fetchError } = await supabase
      .from("queries")
      .select("query_text")
      .eq("id", queryId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !queryRecord) {
      console.error("[actions] quickFixQuery fetch error:", fetchError?.message)
      return { ok: false, error: "Failed to load query details." }
    }

    // Optimize
    const optResult = await optimizeQuery({
      queryText: queryRecord.query_text,
      queryId,
    })

    if (!optResult.ok) {
      return { ok: false, error: optResult.error }
    }

    // Apply
    return await applyOptimization({
      queryId,
      optimizationId: optResult.optimizationId ?? null,
      optimizedQuery: optResult.analysis.optimized_query,
      indexSuggestions: optResult.analysis.index_suggestions,
    })
  } catch (err) {
    console.error("[actions] quickFixQuery error:", err)
    return { ok: false, error: "An unexpected error occurred while performing quick fix." }
  }
}

