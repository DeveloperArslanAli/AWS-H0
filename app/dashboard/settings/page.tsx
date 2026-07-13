import { PageHeader } from "@/components/dashboard/page-header"
import { SettingsForm } from "@/components/dashboard/settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getProfile, getSessionUser } from "@/lib/data"

export default async function SettingsPage() {
  const [user, profile] = await Promise.all([getSessionUser(), getProfile()])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your profile and account preferences." />

      <SettingsForm
        email={user?.email ?? ""}
        fullName={profile?.full_name ?? ""}
        company={profile?.company ?? ""}
      />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Data & privacy</CardTitle>
          <CardDescription>
            AuroraGuard stores only query metadata and performance statistics, never your row data.
            Connections use read-only, SSL-encrypted credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To export or delete your account data, contact{" "}
            <span className="font-mono text-foreground">privacy@auroraguard.dev</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
