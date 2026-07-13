"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Database, Search, Sparkles, Bell, CreditCard, Settings } from "lucide-react"
import { Wordmark } from "@/components/brand"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const NAV = [
  { group: "Monitor", items: [
    { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { title: "Connections", href: "/dashboard/connections", icon: Database },
    { title: "Queries", href: "/dashboard/queries", icon: Search },
    { title: "Alerts", href: "/dashboard/alerts", icon: Bell },
  ]},
  { group: "Optimize", items: [
    { title: "AI Optimizer", href: "/dashboard/optimizer", icon: Sparkles },
  ]},
  { group: "Account", items: [
    { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
  ]},
]

export function DashboardSidebar() {
  const pathname = usePathname()
  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/dashboard" className="flex h-12 items-center px-2">
          <Wordmark className="text-base" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {NAV.map((section) => (
          <SidebarGroup key={section.group}>
            <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        tooltip={item.title}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2 text-xs text-muted-foreground">
        <span className="px-2">AuroraGuard v1.0 · Supabase</span>
      </SidebarFooter>
    </Sidebar>
  )
}
