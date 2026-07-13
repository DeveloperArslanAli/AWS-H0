import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { z } from "zod"

export const runtime = "nodejs"

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().max(80).optional(),
  company: z.string().max(80).optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input data" },
        { status: 400 }
      )
    }

    const { email, password, fullName, company } = parsed.data

    console.log("[api] signup POST: creating user", { email })

    const admin = createAdminClient()

    // Create the user pre-confirmed via admin API (no confirmation email sent).
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, company },
    })

    if (createError) {
      console.log("[api] signup POST: admin.createUser failed", createError.message)
      const msg = createError.message.toLowerCase()
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return Response.json({ ok: false, error: "An account with this email already exists." }, { status: 409 })
      }
      return Response.json({ ok: false, error: "Failed to create account. Please try again." }, { status: 400 })
    }

    if (!userData.user) {
      return Response.json({ ok: false, error: "Failed to create account." }, { status: 500 })
    }

    console.log("[api] signup POST: user created", { userId: userData.user.id })

    // Now sign in the user to establish the session.
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[api] signup POST: Missing Supabase environment variables")
      return Response.json(
        { ok: true, message: "Account created but login failed due to missing configuration. Please sign in manually." },
        { status: 201 }
      )
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // ignored — cookie setting may fail in some contexts
          }
        },
      },
    })

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (signInError) {
      console.log("[api] signup POST: signInWithPassword failed", signInError.message)
      // User was created but auto-login failed. Still return ok: true so the
      // client can navigate and try manual login.
      return Response.json(
        { ok: true, message: "Account created. Please sign in with your credentials." },
        { status: 201 }
      )
    }

    console.log("[api] signup POST: session established, user signed in")
    return Response.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error("[api] signup POST error:", err instanceof Error ? err.message : err)
    return Response.json({ ok: false, error: "An unexpected server error occurred." }, { status: 500 })
  }
}
