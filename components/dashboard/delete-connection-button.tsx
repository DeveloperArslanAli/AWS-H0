"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteConnection } from "@/app/actions/connections"
import { Button } from "@/components/ui/button"

export function DeleteConnectionButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteConnection(id)
      if (res.ok) toast.success(`Removed "${name}"`)
      else toast.error("Could not remove connection", { description: res.error })
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Delete ${name}`}
    >
      <Trash2 className="size-4 text-muted-foreground" />
    </Button>
  )
}
