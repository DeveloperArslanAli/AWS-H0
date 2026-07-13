import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY as string

/** Service-role client: bypasses RLS. Used for setup/teardown and admin ops. */
export function adminClient(): SupabaseClient {
  return createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Anonymous client (RLS enforced). */
export function anonClient(): SupabaseClient {
  return createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
}

export interface TestUser {
  id: string
  email: string
  password: string
  /** A client authenticated AS this user (RLS enforced under their identity). */
  client: SupabaseClient
}

let counter = 0

/**
 * Create a real, confirmed test user via the admin API and return a client
 * signed in as that user. Mirrors the app's real signup path.
 */
export async function createTestUser(): Promise<TestUser> {
  const admin = adminClient()
  const email = `vitest+${Date.now()}_${counter++}@auroraguard.test`
  const password = "VitestUser123!"

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Vitest User", company: "Test Co" },
  })
  if (error || !data.user) throw new Error(`createTestUser failed: ${error?.message}`)

  const client = anonClient()
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw new Error(`test user sign-in failed: ${signInError.message}`)

  return { id: data.user.id, email, password, client }
}

/** Permanently delete a test user and all their cascaded rows. */
export async function deleteTestUser(userId: string): Promise<void> {
  const admin = adminClient()
  await admin.auth.admin.deleteUser(userId)
}

/** Insert a connection row for a user (service role) and return its id. */
export async function createConnection(userId: string, name = "test-conn"): Promise<string> {
  const admin = adminClient()
  const { data, error } = await admin
    .from("db_connections")
    .insert({
      user_id: userId,
      name,
      engine: "supabase",
      host: "db.test.supabase.co",
      port: 5432,
      database_name: "postgres",
      environment: "test",
      region: "aws-us-east-1",
      status: "connecting",
    })
    .select("id")
    .single()
  if (error || !data) throw new Error(`createConnection failed: ${error?.message}`)
  return data.id as string
}
