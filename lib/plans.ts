export type PlanTier = "free" | "pro" | "enterprise"

export interface PlanDefinition {
  id: PlanTier
  name: string
  priceMonthly: number | null
  tagline: string
  limits: {
    connections: number
    /** AI optimizations per month. */
    aiOptimizations: number
    /** Metric retention in days. */
    retentionDays: number
    /** Alert rules. */
    alertRules: number
  }
  features: string[]
  highlighted?: boolean
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    tagline: "For side projects and getting started.",
    limits: { connections: 1, aiOptimizations: 25, retentionDays: 3, alertRules: 3 },
    features: [
      "1 database connection",
      "25 AI optimizations / month",
      "3-day metric retention",
      "Community support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 49,
    tagline: "For growing teams running production workloads.",
    limits: { connections: 10, aiOptimizations: 1000, retentionDays: 30, alertRules: 50 },
    features: [
      "10 database connections",
      "1,000 AI optimizations / month",
      "30-day metric retention",
      "Slack & email alerting",
      "Priority support",
    ],
    highlighted: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: null,
    tagline: "For organizations with compliance and scale needs.",
    limits: { connections: 1000, aiOptimizations: 100000, retentionDays: 365, alertRules: 1000 },
    features: [
      "Unlimited connections",
      "Unlimited AI optimizations",
      "365-day retention",
      "SSO / SAML & audit logs",
      "Dedicated support & SLA",
    ],
  },
}

export const PLAN_LIST = Object.values(PLANS)

export function getPlan(tier: PlanTier): PlanDefinition {
  return PLANS[tier] ?? PLANS.free
}
