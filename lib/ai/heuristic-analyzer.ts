// Deterministic, rule-based SQL analyzer.
//
// This is the graceful-degradation path for the AI Query Optimizer: when the
// AI provider is unavailable (no credits, network error, rate limit) we still
// return genuinely useful, actionable analysis instead of failing. The shape
// matches the AI analysis schema exactly so the UI is agnostic to the source.

export type QueryAnalysis = {
  summary: string
  severity: "low" | "medium" | "high"
  issues: { title: string; detail: string }[]
  optimized_query: string
  index_suggestions: string[]
  estimated_improvement_pct: number
}

type Rule = {
  test: (sql: string) => boolean
  title: string
  detail: string
  weight: number // contribution to estimated improvement
}

const RULES: Rule[] = [
  {
    test: (s) => /\bselect\s+\*/i.test(s),
    title: "Avoid SELECT *",
    detail:
      "Selecting all columns forces the database to read and transfer data you may not need, " +
      "prevents covering-index optimizations, and breaks if the schema changes. Project only the columns you use.",
    weight: 15,
  },
  {
    test: (s) => /\blike\s+'%/i.test(s),
    title: "Leading-wildcard LIKE is non-sargable",
    detail:
      "A predicate like `col LIKE '%term%'` cannot use a standard B-tree index and forces a sequential scan. " +
      "Consider a trigram index (pg_trgm) or a full-text search column.",
    weight: 20,
  },
  {
    test: (s) => /\bwhere\b[\s\S]*\b(lower|upper|date|cast|coalesce)\s*\(/i.test(s),
    title: "Function wrapped around a filtered column",
    detail:
      "Wrapping a column in a function inside WHERE (e.g. LOWER(email) = ...) prevents index usage. " +
      "Use a functional/expression index or store a normalized column.",
    weight: 15,
  },
  {
    test: (s) => /\border\s+by\b/i.test(s) && !/\blimit\b/i.test(s),
    title: "ORDER BY without LIMIT",
    detail:
      "Sorting the full result set is expensive. If you only display a page of rows, add a LIMIT and " +
      "back the sort with an index on the ORDER BY columns.",
    weight: 10,
  },
  {
    test: (s) => (s.match(/\bjoin\b/gi)?.length ?? 0) >= 3,
    title: "Many joins in a single query",
    detail:
      "Three or more joins can explode the row count and confuse the planner. Confirm each join key is indexed " +
      "and consider splitting the query or using a materialized view for hot paths.",
    weight: 10,
  },
  {
    test: (s) => /\bnot\s+in\s*\(/i.test(s),
    title: "NOT IN can be slow and NULL-unsafe",
    detail:
      "`NOT IN (subquery)` behaves unexpectedly with NULLs and often performs poorly. Prefer `NOT EXISTS` or a LEFT JOIN ... IS NULL.",
    weight: 10,
  },
  {
    test: (s) => /\bdistinct\b/i.test(s),
    title: "DISTINCT may mask a join problem",
    detail:
      "DISTINCT forces an extra sort/hash to de-duplicate. It is frequently used to paper over a join that " +
      "multiplies rows. Verify the join cardinality before relying on DISTINCT.",
    weight: 5,
  },
  {
    test: (s) => /\boffset\s+\d{3,}/i.test(s),
    title: "Large OFFSET pagination",
    detail:
      "High OFFSET values still scan and discard all preceding rows. Use keyset (cursor) pagination with a " +
      "`WHERE id > :last_id` predicate for stable, fast paging.",
    weight: 10,
  },
]

// Extract simple table.column references appearing in WHERE / JOIN / ORDER BY
function suggestIndexes(sql: string): string[] {
  const suggestions = new Set<string>()
  const joinMatches = sql.matchAll(/join\s+([a-z_][\w]*)\s+(?:as\s+)?(\w+)?\s*on\s+[\w.]+\s*=\s*([\w.]+)/gi)
  for (const m of joinMatches) {
    const right = m[3]
    if (right?.includes(".")) {
      const [, col] = right.split(".")
      const table = m[1]
      if (table && col) suggestions.add(`CREATE INDEX ON ${table} (${col});`)
    }
  }
  // WHERE column = / > / <
  const whereMatches = sql.matchAll(/where\s+([\s\S]*?)(?:group\s+by|order\s+by|limit|$)/gi)
  for (const w of whereMatches) {
    const clause = w[1] ?? ""
    const cols = clause.matchAll(/([a-z_][\w]*)\.([a-z_][\w]*)\s*(=|>|<|>=|<=|like)/gi)
    for (const c of cols) {
      const table = c[1]
      const col = c[2]
      if (table && col) suggestions.add(`CREATE INDEX ON ${table} (${col});`)
    }
  }
  return Array.from(suggestions).slice(0, 4)
}

// Best-effort rewrite: replace SELECT * with a hint comment, since we cannot
// know the real column list without schema introspection.
function buildOptimizedQuery(sql: string, issues: Rule[]): string {
  let optimized = sql.trim()
  if (issues.some((r) => r.title === "Avoid SELECT *")) {
    optimized = optimized.replace(
      /select\s+\*/i,
      "SELECT /* TODO: list only the columns you need */ *",
    )
  }
  if (issues.some((r) => r.title === "ORDER BY without LIMIT") && !/\blimit\b/i.test(optimized)) {
    optimized = optimized.replace(/;?\s*$/, "\nLIMIT 100;")
  }
  return optimized
}

export function analyzeQueryHeuristically(sql: string): QueryAnalysis {
  const matched = RULES.filter((r) => r.test(sql))
  const totalWeight = matched.reduce((sum, r) => sum + r.weight, 0)
  const estimated = Math.min(75, totalWeight)

  const severity: QueryAnalysis["severity"] =
    estimated >= 40 ? "high" : estimated >= 20 ? "medium" : "low"

  const summary =
    matched.length === 0
      ? "No common anti-patterns detected by static analysis. The query looks reasonable; verify with EXPLAIN ANALYZE on production-scale data."
      : `Static analysis found ${matched.length} potential performance issue${matched.length > 1 ? "s" : ""}. ` +
        "Addressing them, especially indexing the filtered/joined columns, should meaningfully reduce execution time."

  return {
    summary,
    severity,
    issues: matched.map((r) => ({ title: r.title, detail: r.detail })),
    optimized_query: buildOptimizedQuery(sql, matched),
    index_suggestions: suggestIndexes(sql),
    estimated_improvement_pct: estimated,
  }
}
