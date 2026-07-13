import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"
import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"

// Load real project env (Supabase keys, Gemini key) for integration tests.
loadEnv({ path: ".env.development.local" })
loadEnv({ path: ".env.local" })

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // `server-only` throws outside RSC; stub it for node-based tests.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 45000,
    hookTimeout: 45000,
    // Run serially: tests share a real DB and a real test user.
    fileParallelism: false,
    sequence: { concurrent: false },
    reporters: ["verbose"],
  },
})
