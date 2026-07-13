"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { PLANS } from "@/lib/plans"

const connectionSchema = z.object({
  name: z.string().min(2, "Name is too short").max(60),
  engine: z.enum(["postgres", "mysql", "aurora-postgres", "aurora-mysql", "supabase"]),
  host: z.string().min(3, "Host is required"),
  port: z.coerce.number().int().min(1).max(65535),
  database_name: z.string().min(1, "Database name is required"),
  environment: z.string().min(1),
  region: z.string().min(1),
  ssl_enabled: z.boolean().default(true),
})

export type ActionState = { ok: boolean; error?: string }

export async function createConnection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Not authenticated" }

    const parsed = connectionSchema.safeParse({
      name: formData.get("name"),
      engine: formData.get("engine"),
      host: formData.get("host"),
      port: formData.get("port"),
      database_name: formData.get("database_name"),
      environment: formData.get("environment"),
      region: formData.get("region"),
      ssl_enabled: formData.get("ssl_enabled") === "on" || formData.get("ssl_enabled") === "true",
    })
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
    }

    // Enforce plan connection limits
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single()
    const plan = (profile?.plan ?? "free") as keyof typeof PLANS
    const limit = PLANS[plan].limits.connections
    const { count } = await supabase
      .from("db_connections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
    if ((count ?? 0) >= limit) {
      return { ok: false, error: `Your ${PLANS[plan].name} plan allows ${limit} connections. Upgrade to add more.` }
    }

    const { error } = await supabase.from("db_connections").insert({
      user_id: user.id,
      ...parsed.data,
      status: "healthy",
    })
    if (error) {
      console.error("[actions] createConnection insert failed:", error.message)
      return { ok: false, error: "Failed to save connection." }
    }

    revalidatePath("/dashboard/connections")
    revalidatePath("/dashboard")
    return { ok: true }
  } catch (err) {
    console.error("[actions] createConnection error:", err)
    return { ok: false, error: "An unexpected error occurred." }
  }
}

export async function deleteConnection(id: string): Promise<ActionState> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: "Not authenticated" }

    const { error } = await supabase.from("db_connections").delete().eq("id", id).eq("user_id", user.id)
    if (error) {
      console.error("[actions] deleteConnection delete failed:", error.message)
      return { ok: false, error: "Failed to delete connection." }
    }

    revalidatePath("/dashboard/connections")
    return { ok: true }
  } catch (err) {
    console.error("[actions] deleteConnection error:", err)
    return { ok: false, error: "An unexpected error occurred." }
  }
}
