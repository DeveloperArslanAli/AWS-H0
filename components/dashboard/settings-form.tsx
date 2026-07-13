"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"
import { updateProfile } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  )
}

export function SettingsForm({
  email,
  fullName,
  company,
}: {
  email: string
  fullName: string
  company: string
}) {
  const [state, formAction] = useActionState(updateProfile, { ok: false })

  useEffect(() => {
    if (state.ok) toast.success("Profile updated")
    else if (state.error) toast.error(state.error)
  }, [state])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
        <CardDescription>Update your account information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex max-w-md flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={fullName} placeholder="Ada Lovelace" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" defaultValue={company} placeholder="Acme Inc." />
          </div>
          <div>
            <SaveButton />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
