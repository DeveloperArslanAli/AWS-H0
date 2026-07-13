import { SiteHeader } from "@/components/marketing/site-header"
import { Hero } from "@/components/marketing/hero"
import { Features, HowItWorks } from "@/components/marketing/features"
import { PricingSection } from "@/components/marketing/pricing-section"
import { CtaSection, SiteFooter } from "@/components/marketing/site-footer"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <PricingSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}
