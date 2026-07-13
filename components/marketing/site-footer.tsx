import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/brand"
import { ArrowRight } from "lucide-react"

export function CtaSection() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight">Stop guessing why your database is slow</h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
            Connect your first database and get AI-powered optimization recommendations in minutes.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/auth/sign-up">
              Start free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row sm:px-6">
        <Wordmark className="text-sm" />
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} AuroraGuard. Built for engineering teams.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/auth/login" className="hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  )
}
