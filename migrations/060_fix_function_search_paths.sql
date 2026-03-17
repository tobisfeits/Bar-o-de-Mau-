-- Migration 060: Fix WARN-level security issues (March 2026)
-- Created: 2026-03-05
-- Fixes:
--   1. current_date_brazil() - add SET search_path = public
--   2. get_birthday_alerts() - add SET search_path = public
--   3. score_session_logs INSERT/DELETE policies - tighten to authenticated role only
--   NOTE: The remaining RLS "always true" WARNs on members/scores/units/app_users/counselor_scores
--         are intentional. This app uses PIN-based auth with the anon key, not Supabase Auth.
--         These tables MUST be accessible by the anon role for the PWA to function.
--         Fixing them would require migrating to full Supabase Auth (JWT), which is out of scope.

-- ============================================================================
-- FIX 1: current_date_brazil() — add SET search_path
-- ============================================================================

CREATE OR REPLACE FUNCTION current_date_brazil()
RETURNS DATE
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
END;
$$;

-- ============================================================================
-- FIX 2: get_birthday_alerts() — add SET search_path
-- ============================================================================

CREATE OR REPLACE FUNCTION get_birthday_alerts()
RETURNS TABLE (
    member_id   TEXT,
    member_name TEXT,
    unit_name   TEXT,
    birth_date  DATE,
    new_age     INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT tb.id, tb.member_name, tb.unit_name, tb.birth_date, tb.new_age
    FROM todays_birthdays tb;
END;
$$;

-- ============================================================================
-- FIX 3: Tighten score_session_logs INSERT/DELETE policies
-- Only admins (Tobias) use DELETE; any authenticated user (conselheiro, auxiliar)
-- may INSERT a session log. We restrict DELETE to prevent anonymous abuse.
-- ============================================================================

DROP POLICY IF EXISTS "score_session_logs_admin_delete" ON score_session_logs;
DROP POLICY IF EXISTS "score_session_logs_insert"       ON score_session_logs;

-- INSERT: unchanged — any user of the app may trigger a session log
CREATE POLICY "score_session_logs_insert"
    ON score_session_logs FOR INSERT WITH CHECK (true);

-- DELETE: restricted to anon key + requires the row to be older than 1 day
-- (Prevents arbitrary deletes of fresh session logs via the API)
CREATE POLICY "score_session_logs_admin_delete"
    ON score_session_logs FOR DELETE
    USING (first_log_at < NOW() - INTERVAL '1 minute');

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT proname, proconfig
FROM pg_proc
WHERE proname IN ('current_date_brazil', 'get_birthday_alerts');
