"use client"

import { toast } from "sonner"
import { PricingCards } from "@/components/pricing-cards"
import type { PlanTier } from "@/lib/plans"

export function PlanSelector({ currentPlan }: { currentPlan: PlanTier }) {
  function handleSelect(tier: PlanTier) {
    if (tier === "enterprise") {
      toast.info("Our team will reach out", { description: "Enterprise plans are tailored to your needs." })
      return
    }
    // Stripe checkout is wired up in a later milestone.
    toast.info("Checkout coming soon", {
      description: `Stripe billing for the ${tier} plan will be enabled shortly.`,
    })
  }

  return <PricingCards currentPlan={currentPlan} onSelect={handleSelect} />
}
