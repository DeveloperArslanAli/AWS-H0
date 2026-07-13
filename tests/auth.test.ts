import { describe, it, expect, afterAll } from "vitest"
import { adminClient, anonClient, createTestUser, deleteTestUser } from "./helpers"

describe("Authentication (real Supabase Auth)", () => {
  const cleanup: string[] = []

  afterAll(async () => {
    for (const id of cleanup) await deleteTestUser(id)
  })

  it("creates a confirmed user and signs in (the app's real signup path)", async () => {
    const user = await createTestUser()
    cleanup.push(user.id)
    expect(user.id).toMatch(/[0-9a-f-]{36}/)

    const { data, error } = await user.client.auth.getUser()
    expect(error).toBeNull()
    expect(data.user?.email).toBe(user.email)
  })

  it("auto-creates a profile row via the on_auth_user_created trigger", async () => {
    const user = await createTestUser()
    cleanup.push(user.id)

    // Profile should exist immediately after signup (DB trigger).
    const { data, error } = await adminClient().from("profiles").select("*").eq("id", user.id).single()
    expect(error).toBeNull()
    expect(data?.id).toBe(user.id)
    expect(data?.plan).toBe("free")
    expect(data?.full_name).toBe("Vitest User")
  })

  it("rejects duplicate email signups", async () => {
    const user = await createTestUser()
    cleanup.push(user.id)

    const { error } = await adminClient().auth.admin.createUser({
      email: user.email,
      password: "AnotherPass123!",
      email_confirm: true,
    })
    expect(error).not.toBeNull()
  })

  it("rejects sign-in with a wrong password", async () => {
    const user = await createTestUser()
    cleanup.push(user.id)

    const { error } = await anonClient().auth.signInWithPassword({
      email: user.email,
      password: "totally-wrong-password",
    })
    expect(error).not.toBeNull()
  })
})
