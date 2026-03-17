-- Migration 059: Fix Supabase Security Linter Errors (Março 2026)
-- Created: 2026-03-05
-- Issues:
--   1. todays_birthdays view still has SECURITY DEFINER
--   2. upcoming_birthdays view still has SECURITY DEFINER
--   3. score_session_logs table has RLS disabled

-- ============================================================================
-- FIX 1 & 2: Recreate birthday views with SECURITY INVOKER (safe default)
-- ============================================================================

DROP VIEW IF EXISTS todays_birthdays CASCADE;
DROP VIEW IF EXISTS upcoming_birthdays CASCADE;

CREATE VIEW todays_birthdays WITH (security_invoker = true) AS
SELECT
    m.id,
    m.name AS member_name,
    u.name AS unit_name,
    m.birth_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.birth_date))::INTEGER + 1 AS new_age,
    m.unit_id
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND m.deleted_at IS NULL
  AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM m.birth_date)   = EXTRACT(DAY FROM CURRENT_DATE)
ORDER BY m.name;

CREATE VIEW upcoming_birthdays WITH (security_invoker = true) AS
SELECT
    m.id,
    m.name AS member_name,
    u.name AS unit_name,
    m.birth_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.birth_date))::INTEGER + 1 AS new_age,
    CASE
        WHEN DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
                  LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' ||
                  LPAD(EXTRACT(DAY   FROM m.birth_date)::TEXT, 2, '0')) >= CURRENT_DATE
        THEN DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
                  LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' ||
                  LPAD(EXTRACT(DAY   FROM m.birth_date)::TEXT, 2, '0')) - CURRENT_DATE
        ELSE DATE(EXTRACT(YEAR FROM CURRENT_DATE) + 1 || '-' ||
                  LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' ||
                  LPAD(EXTRACT(DAY   FROM m.birth_date)::TEXT, 2, '0')) - CURRENT_DATE
    END AS days_until_birthday
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND m.deleted_at IS NULL
  AND DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
           LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' ||
           LPAD(EXTRACT(DAY   FROM m.birth_date)::TEXT, 2, '0'))
      BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY days_until_birthday, m.name;

-- ============================================================================
-- FIX 3: Enable RLS on score_session_logs (may already exist — safe to re-run)
-- ============================================================================

ALTER TABLE score_session_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DROP POLICY IF EXISTS "score_session_logs_read"         ON score_session_logs;
DROP POLICY IF EXISTS "score_session_logs_insert"       ON score_session_logs;
DROP POLICY IF EXISTS "score_session_logs_admin_delete" ON score_session_logs;

CREATE POLICY "score_session_logs_read"
    ON score_session_logs FOR SELECT USING (true);

CREATE POLICY "score_session_logs_insert"
    ON score_session_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "score_session_logs_admin_delete"
    ON score_session_logs FOR DELETE USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Should return 0 rows flagged as security_definer
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('todays_birthdays', 'upcoming_birthdays');

-- Should show rls_enabled = true
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'score_session_logs';
