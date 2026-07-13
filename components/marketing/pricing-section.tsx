import { PricingCards } from "@/components/pricing-cards"

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Simple, scalable pricing</h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Start free, upgrade when your fleet grows. No credit card required to get started.
          </p>
        </div>
        <div className="mt-12">
          <PricingCards />
        </div>
      </div>
    </section>
  )
}
