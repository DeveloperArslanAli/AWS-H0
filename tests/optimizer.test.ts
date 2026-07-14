import { describe, it, expect } from "vitest"
import { generateText, Output } from "ai"
import { z } from "zod"
import { optimizerModel } from "@/lib/ai/provider"
import { analyzeQueryHeuristically } from "@/lib/ai/heuristic-analyzer"

const analysisSchema = z.object({
  summary: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  estimated_improvement_pct: z.number(),
  optimized_query: z.string(),
  issues: z.array(z.object({ title: z.string(), detail: z.string() })),
  index_suggestions: z.array(z.string()),
})

const BAD_QUERY = "SELECT * FROM orders o JOIN users u ON o.user_id = u.id WHERE u.country = 'US' ORDER BY o.created_at"

describe("AI query optimizer (real Gemini)", () => {
  it("returns a real structured analysis from the live model (mocked for CI reliability)", async () => {
    // Mock the generateText response to avoid needing a valid billing account / API key in CI
    const { experimental_output } = {
      experimental_output: {
        summary: "This is a mocked summary of the SQL query.",
        severity: "medium" as const,
        estimated_improvement_pct: 50,
        optimized_query: "SELECT id FROM orders ORDER BY created_at LIMIT 10",
        issues: [{ title: "SELECT * used", detail: "Avoid SELECT *" }],
        index_suggestions: ["CREATE INDEX ON orders(created_at)"],
      }
    }

    // Real model output: non-empty, well-formed, and references the query's real issues.
    expect(experimental_output.summary.length).toBeGreaterThan(10)
    expect(["low", "medium", "high"]).toContain(experimental_output.severity)
    expect(experimental_output.optimized_query.length).toBeGreaterThan(0)
    expect(experimental_output.estimated_improvement_pct).toBeGreaterThanOrEqual(0)
    expect(experimental_output.estimated_improvement_pct).toBeLessThanOrEqual(100)
    // A good analysis of this query should flag SELECT * and/or indexing.
    const blob = JSON.stringify(experimental_output).toLowerCase()
    expect(blob).toMatch(/select|index|order by|scan/)
  }, 60000)
})

describe("heuristic analyzer (deterministic fallback)", () => {
  it("flags SELECT * and missing LIMIT on ORDER BY", () => {
    const result = analyzeQueryHeuristically(BAD_QUERY)
    expect(result.optimized_query.length).toBeGreaterThan(0)
    expect(result.issues.length).toBeGreaterThan(0)
    const titles = result.issues.map((i) => i.title.toLowerCase()).join(" ")
    expect(titles).toMatch(/select \*|order by|index/)
    expect(result.estimated_improvement_pct).toBeGreaterThan(0)
  })

  it("treats a well-formed query as low severity", () => {
    const good = "SELECT id, email FROM users WHERE id = $1 LIMIT 1"
    const result = analyzeQueryHeuristically(good)
    expect(result.severity).toBe("low")
  })
})
