"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  full_name: z.string().max(80).optional(),
  company: z.string().max(80).optional(),
})

export async function updateProfile(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated" }

  const parsed = schema.safeParse({
    full_name: formData.get("full_name")?.toString() ?? "",
    company: formData.get("company")?.toString() ?? "",
  })
  if (!parsed.success) return { ok: false, error: "Invalid input" }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, company: parsed.data.company, updated_at: new Date().toISOString() })
    .eq("id", user.id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/settings")
  return { ok: true }
}
