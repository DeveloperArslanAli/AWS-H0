import type React from "react"
import { redirect } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar"
import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/data"
import { ensureLiveConnection } from "@/app/actions/provision"
import { LiveRefresher } from "@/components/dashboard/live-refresher"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Register the user's live database as a monitored connection on first visit
  // and capture an initial real measurement (idempotent).
  await ensureLiveConnection()
  const profile = await getProfile()

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardTopbar profile={profile} email={user.email ?? ""} />
        <div className="flex-1 p-4 sm:p-6">{children}</div>
        <LiveRefresher intervalMs={10000} />
      </SidebarInset>
    </SidebarProvider>
  )
}
