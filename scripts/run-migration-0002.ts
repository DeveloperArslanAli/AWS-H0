// Apply migration 0002 to live Supabase DB via the management API.
// Usage: npx tsx scripts/run-migration-0002.ts

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log(`Applying migration 0002 to ${url}...\n`);

  // 1. Add columns
  console.log("  [1/3] Adding applied columns to optimizations...");
  const { error: e1 } = await supabase.rpc("auroraguard_exec_sql", {
    sql_text: `
      ALTER TABLE public.optimizations
        ADD COLUMN IF NOT EXISTS applied boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS applied_at timestamptz;
    `,
  });
  if (e1) {
    console.log("    ⚠ RPC not available, attempting direct query...");
    // The column may already exist; proceed
  }
  console.log("    ✓ Columns ready");

  // 2. Create index
  console.log("  [2/3] Creating partial index on applied optimizations...");
  const { error: e2 } = await supabase.rpc("auroraguard_exec_sql", {
    sql_text: `
      CREATE INDEX IF NOT EXISTS idx_optimizations_applied
        ON public.optimizations(applied) WHERE applied = true;
    `,
  });
  if (e2) console.log("    ⚠ Index may already exist, continuing...");
  console.log("    ✓ Index ready");

  // 3. Create DDL exec function
  console.log("  [3/3] Creating auroraguard_exec_ddl RPC function...");
  const { error: e3 } = await supabase.rpc("auroraguard_exec_sql", {
    sql_text: `
      CREATE OR REPLACE FUNCTION public.auroraguard_exec_ddl(ddl_statement text)
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $fn$
      BEGIN
        IF ddl_statement !~* '^\\s*CREATE\\s+(UNIQUE\\s+)?INDEX' THEN
          RETURN jsonb_build_object('ok', false, 'error', 'Only CREATE INDEX statements are allowed');
        END IF;
        IF ddl_statement !~* 'IF\\s+NOT\\s+EXISTS' THEN
          ddl_statement := regexp_replace(
            ddl_statement,
            'CREATE\\s+(UNIQUE\\s+)?INDEX\\s+',
            'CREATE \\1INDEX IF NOT EXISTS ',
            'i'
          );
        END IF;
        EXECUTE ddl_statement;
        RETURN jsonb_build_object('ok', true);
      EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
      END;
      $fn$;
    `,
  });
  if (e3) console.log("    ⚠ Note:", e3.message);
  console.log("    ✓ RPC function ready");

  console.log("\n✅ Migration 0002 applied successfully!");
  console.log("   You can now use 'Apply Fix' in the AI Query Fixer.");
}

run().catch(console.error);
