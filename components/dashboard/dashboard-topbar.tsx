import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, CreditCard } from "lucide-react"
import Link from "next/link"
import { signOut } from "@/app/actions/auth"
import type { Profile } from "@/lib/types"
import { getPlan } from "@/lib/plans"

export function DashboardTopbar({ profile, email }: { profile: Profile | null; email: string }) {
  const plan = getPlan(profile?.plan ?? "free")
  const initials = (profile?.full_name ?? email)
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex flex-1 items-center gap-2">
        <span className="text-sm font-medium">Workspace</span>
        <Badge variant="secondary" className="font-normal">
          {plan.name} plan
        </Badge>
      </div>
      {/* Hidden form lets the menu item trigger the sign-out server action. */}
      <form action={signOut} id="signout-form" className="hidden" />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 gap-2 px-2" />}>
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/15 text-xs text-primary">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm sm:inline">{profile?.full_name ?? email}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col">
              <span>{profile?.full_name ?? "Account"}</span>
              <span className="text-xs font-normal text-muted-foreground">{email}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/dashboard/billing" />}>
            <CreditCard className="size-4" /> Billing &amp; plan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            nativeButton
            render={<button type="submit" form="signout-form" />}
          >
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
