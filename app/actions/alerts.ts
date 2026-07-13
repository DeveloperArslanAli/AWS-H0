"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updateAlertStatus(
  id: string,
  status: "open" | "acknowledged" | "resolved",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Not authenticated" }

    const { error } = await supabase
      .from("alerts")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id)
    if (error) {
      console.error("[actions] updateAlertStatus failed:", error.message)
      return { ok: false, error: "Failed to update alert status." }
    }

    revalidatePath("/dashboard/alerts")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (err) {
    console.error("[actions] updateAlertStatus error:", err)
    return { ok: false, error: "An unexpected error occurred." }
  }
}
