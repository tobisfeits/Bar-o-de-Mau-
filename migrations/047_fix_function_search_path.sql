-- Migration 047: Fix ALL Function Search Path Warnings (DYNAMIC)
-- Created: 2026-02-18
-- Description: Dynamically find and fix ALL public functions missing search_path
-- Approach: Query pg_proc to find exact signatures, then ALTER each one

-- ============================================================================
-- DYNAMIC FIX: Find and fix ALL public functions without search_path
-- ============================================================================

DO $$
DECLARE
    func_record RECORD;
    alter_sql TEXT;
    fixed_count INTEGER := 0;
    skipped_count INTEGER := 0;
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Fixing function search_path for all public functions...';
    RAISE NOTICE '================================================';

    FOR func_record IN
        SELECT 
            p.proname AS func_name,
            pg_get_function_identity_arguments(p.oid) AS func_args,
            p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'  -- regular functions only
          AND (p.proconfig IS NULL 
               OR NOT EXISTS (
                   SELECT 1 FROM unnest(p.proconfig) AS c 
                   WHERE c LIKE 'search_path=%'
               ))
    LOOP
        BEGIN
            alter_sql := format(
                'ALTER FUNCTION public.%I(%s) SET search_path = public',
                func_record.func_name,
                func_record.func_args
            );
            EXECUTE alter_sql;
            fixed_count := fixed_count + 1;
            RAISE NOTICE '✅ Fixed: %(%)', func_record.func_name, func_record.func_args;
        EXCEPTION WHEN OTHERS THEN
            skipped_count := skipped_count + 1;
            RAISE NOTICE '⚠️ Skipped: %(%) - %', func_record.func_name, func_record.func_args, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '================================================';
    RAISE NOTICE 'Done! Fixed: %, Skipped: %', fixed_count, skipped_count;
    RAISE NOTICE '================================================';
END $$;

-- ============================================================================
-- VERIFICATION: Show status of all public functions
-- ============================================================================

SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    CASE 
        WHEN p.proconfig IS NOT NULL 
             AND EXISTS (SELECT 1 FROM unnest(p.proconfig) AS c WHERE c LIKE 'search_path=%')
        THEN '✅ OK'
        ELSE '❌ MISSING'
    END AS search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY search_path_status DESC, p.proname;
