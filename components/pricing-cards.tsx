import Link from "next/link"
import { Check } from "lucide-react"
import { PLAN_LIST, type PlanTier } from "@/lib/plans"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PricingCardsProps {
  /** Current plan, when shown inside the dashboard billing page. */
  currentPlan?: PlanTier
  /** Where CTA buttons link to. Defaults to sign-up. */
  ctaHref?: string
  onSelect?: (tier: PlanTier) => void
}

export function PricingCards({ currentPlan, ctaHref = "/auth/sign-up", onSelect }: PricingCardsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLAN_LIST.map((plan) => {
        const isCurrent = currentPlan === plan.id
        return (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col rounded-xl border bg-card p-6",
              plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : "border-border",
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {plan.highlighted && <Badge>Most popular</Badge>}
              {isCurrent && <Badge variant="secondary">Current</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            <div className="mt-4 flex items-baseline gap-1">
              {plan.priceMonthly === null ? (
                <span className="text-3xl font-semibold">Custom</span>
              ) : (
                <>
                  <span className="text-3xl font-semibold">${plan.priceMonthly}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </>
              )}
            </div>

            {onSelect ? (
              <Button
                className="mt-6 w-full"
                variant={plan.highlighted ? "default" : "outline"}
                disabled={isCurrent}
                onClick={() => onSelect(plan.id)}
              >
                {isCurrent ? "Current plan" : plan.priceMonthly === null ? "Contact sales" : `Choose ${plan.name}`}
              </Button>
            ) : (
              <Button asChild className="mt-6 w-full" variant={plan.highlighted ? "default" : "outline"}>
                <Link href={plan.priceMonthly === null ? "#contact" : ctaHref}>
                  {plan.priceMonthly === null ? "Contact sales" : `Get ${plan.name}`}
                </Link>
              </Button>
            )}

            <ul className="mt-6 flex flex-col gap-3 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
