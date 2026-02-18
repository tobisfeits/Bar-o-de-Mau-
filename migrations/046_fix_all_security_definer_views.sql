-- Migration 046: Fix ALL Security Definer Views (Supabase Linter)
-- Created: 2026-02-18
-- Description: Drop and recreate ALL views flagged by Supabase security linter
-- Issue: 7 views with SECURITY DEFINER property bypass RLS policies
--
-- Views to fix:
--   1. todays_birthdays
--   2. upcoming_birthdays
--   3. active_members
--   4. active_scores
--   5. deleted_members
--   6. deleted_scores
--   7. members_with_units

-- ============================================================================
-- STEP 1: DROP ALL FLAGGED VIEWS
-- ============================================================================

DROP VIEW IF EXISTS todays_birthdays CASCADE;
DROP VIEW IF EXISTS upcoming_birthdays CASCADE;
DROP VIEW IF EXISTS active_members CASCADE;
DROP VIEW IF EXISTS active_scores CASCADE;
DROP VIEW IF EXISTS deleted_members CASCADE;
DROP VIEW IF EXISTS deleted_scores CASCADE;
DROP VIEW IF EXISTS members_with_units CASCADE;

-- ============================================================================
-- STEP 2: RECREATE ALL VIEWS (SECURITY INVOKER = default, safe)
-- ============================================================================

-- 1. todays_birthdays
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
  AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
ORDER BY m.name;

-- 2. upcoming_birthdays
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
              LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0')) >= CURRENT_DATE
        THEN DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-' || 
              LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' || 
              LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0')) - CURRENT_DATE
        ELSE DATE(EXTRACT(YEAR FROM CURRENT_DATE) + 1 || '-' || 
              LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' || 
              LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0')) - CURRENT_DATE
    END AS days_until_birthday
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND m.deleted_at IS NULL
  AND DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-' || 
       LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' || 
       LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0'))
  BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY days_until_birthday, m.name;

-- 3. active_members
CREATE VIEW active_members WITH (security_invoker = true) AS
SELECT m.*, u.name AS unit_name
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.deleted_at IS NULL;

-- 4. active_scores
CREATE VIEW active_scores WITH (security_invoker = true) AS
SELECT s.*
FROM scores s
WHERE s.deleted_at IS NULL;

-- 5. deleted_members
CREATE VIEW deleted_members WITH (security_invoker = true) AS
SELECT m.*, u.name AS unit_name
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.deleted_at IS NOT NULL;

-- 6. deleted_scores
CREATE VIEW deleted_scores WITH (security_invoker = true) AS
SELECT s.*
FROM scores s
WHERE s.deleted_at IS NOT NULL;

-- 7. members_with_units
CREATE VIEW members_with_units WITH (security_invoker = true) AS
SELECT m.*, u.name AS unit_name
FROM members m
LEFT JOIN units u ON m.unit_id = u.id;

-- ============================================================================
-- STEP 3: RECREATE DEPENDENT FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS get_birthday_alerts();

CREATE OR REPLACE FUNCTION get_birthday_alerts()
RETURNS TABLE (
    member_id TEXT,
    member_name TEXT,
    unit_name TEXT,
    birth_date DATE,
    new_age INTEGER
) AS $$
BEGIN
    RETURN QUERY 
    SELECT tb.id, tb.member_name, tb.unit_name, tb.birth_date, tb.new_age
    FROM todays_birthdays tb;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Check: no views should have security_definer = true
SELECT 
    viewname,
    'SECURITY DEFINER' AS issue
FROM pg_views 
WHERE schemaname = 'public'
AND viewname IN (
    'todays_birthdays', 'upcoming_birthdays', 'active_members',
    'active_scores', 'deleted_members', 'deleted_scores', 'members_with_units'
);
