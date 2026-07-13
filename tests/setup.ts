import { config as loadEnv } from "dotenv"

// Ensure env is loaded even if config-level loading is bypassed.
loadEnv({ path: ".env.development.local" })
loadEnv({ path: ".env.local" })

// Fail fast with a clear message if required real credentials are missing.
const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var for integration tests: ${key}`)
  }
}
