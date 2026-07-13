"use client"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createConnection, type ActionState } from "@/app/actions/connections"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const initialState: ActionState = { ok: false }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Connecting…" : "Add connection"}
    </Button>
  )
}

export function AddConnectionDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useActionState(createConnection, initialState)

  useEffect(() => {
    if (state.ok) {
      toast.success("Connection added", { description: "We started monitoring your database." })
      setOpen(false)
    } else if (state.error) {
      toast.error("Could not add connection", { description: state.error })
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-1 size-4" /> Add connection
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Connect a database</DialogTitle>
            <DialogDescription>
              AuroraGuard reads performance statistics over a read-only, SSL-encrypted connection.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" name="name" placeholder="Production – Orders" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="engine">Engine</Label>
                <Select name="engine" defaultValue="postgres">
                  <SelectTrigger id="engine">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                    <SelectItem value="mysql">MySQL</SelectItem>
                    <SelectItem value="aurora-postgres">Aurora PostgreSQL</SelectItem>
                    <SelectItem value="aurora-mysql">Aurora MySQL</SelectItem>
                    <SelectItem value="supabase">Supabase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="environment">Environment</Label>
                <Select name="environment" defaultValue="production">
                  <SelectTrigger id="environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="host">Host</Label>
                <Input id="host" name="host" placeholder="db.internal.example.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="port">Port</Label>
                <Input id="port" name="port" type="number" defaultValue={5432} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="database_name">Database</Label>
                <Input id="database_name" name="database_name" placeholder="app_prod" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Input id="region" name="region" defaultValue="us-east-1" required />
              </div>
            </div>

            <input type="hidden" name="ssl_enabled" value="true" />
          </div>

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
