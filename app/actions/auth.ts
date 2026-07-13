"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { z } from "zod"

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error("[actions] signOut error:", err)
  }
  redirect("/auth/login")
}

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().max(80),
  company: z.string().max(80),
})

type SignUpInput = z.infer<typeof signUpSchema>

export type SignUpResult = { ok: true } | { ok: false; error: string }

/**
 * Server-side signup that creates the user already email-confirmed via the
 * admin API. This sends NO confirmation email, so it avoids Supabase's
 * built-in email rate limit entirely. The user is signed in immediately.
 */
export async function signUpWithPassword(input: SignUpInput): Promise<SignUpResult> {
  try {
    const parsed = signUpSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
    }

    const { email: rawEmail, password, fullName, company } = parsed.data
    const email = rawEmail.trim().toLowerCase()

    const admin = createAdminClient()

    // Create the user pre-confirmed. The on_auth_user_created trigger
    // auto-populates public.profiles from this metadata.
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, company },
    })

    if (createError) {
      console.error("[actions] signUpWithPassword create error:", createError.message)
      const msg = createError.message.toLowerCase()
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return { ok: false, error: "An account with this email already exists. Try signing in." }
      }
      return { ok: false, error: "Failed to create account. Please try again." }
    }

    // Establish the session via the cookie-aware server client.
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      console.error("[actions] signUpWithPassword auto-login error:", signInError.message)
      // User was created but auto-login failed — they can still sign in manually.
      return { ok: false, error: "Account created. Please sign in." }
    }

    return { ok: true }
  } catch (err) {
    console.error("[actions] signUpWithPassword unexpected error:", err)
    return { ok: false, error: "An unexpected error occurred." }
  }
}
