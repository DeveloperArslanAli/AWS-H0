-- ============================================================
-- AuroraGuard migration 0002: optimization applied tracking + DDL exec RPC
-- ============================================================

-- Add applied tracking columns to optimizations table
ALTER TABLE public.optimizations
  ADD COLUMN IF NOT EXISTS applied boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz;

-- Create index for quickly finding applied optimizations
CREATE INDEX IF NOT EXISTS idx_optimizations_applied
  ON public.optimizations(applied) WHERE applied = true;

-- ============================================================
-- RPC: auroraguard_exec_ddl
-- Safely executes DDL statements (CREATE INDEX, etc.) from the
-- optimizer. Only allows CREATE INDEX statements for safety.
-- SECURITY DEFINER so the authenticated user can run DDL.
-- ============================================================
CREATE OR REPLACE FUNCTION public.auroraguard_exec_ddl(ddl_statement text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Safety check: only allow CREATE INDEX statements
  IF ddl_statement !~* '^\s*CREATE\s+(UNIQUE\s+)?INDEX' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Only CREATE INDEX statements are allowed');
  END IF;

  -- Add IF NOT EXISTS if not already present
  IF ddl_statement !~* 'IF\s+NOT\s+EXISTS' THEN
    ddl_statement := regexp_replace(
      ddl_statement,
      'CREATE\s+(UNIQUE\s+)?INDEX\s+',
      'CREATE \1INDEX IF NOT EXISTS ',
      'i'
    );
  END IF;

  EXECUTE ddl_statement;

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;
