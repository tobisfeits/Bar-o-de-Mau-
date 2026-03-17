-- Migration 043: Force Remove SECURITY DEFINER Views
-- Created: 2026-02-12
-- Description: Forcefully drop and recreate views to remove SECURITY DEFINER property
-- Related to: Migration 042 security fixes

-- ============================================================================
-- FORCE DROP ALL SECURITY DEFINER VIEWS
-- ============================================================================

-- Drop with CASCADE to remove dependencies
DROP VIEW IF EXISTS counselor_ranking_today CASCADE;
DROP VIEW IF EXISTS members_with_units CASCADE;
DROP VIEW IF EXISTS todays_birthdays CASCADE;
DROP VIEW IF EXISTS upcoming_birthdays CASCADE;

-- ============================================================================
-- RECREATE VIEWS WITHOUT SECURITY DEFINER
-- ============================================================================

-- Recreate members_with_units (SECURITY INVOKER by default)
CREATE VIEW members_with_units AS
SELECT 
    m.*,
    u.name as unit_name
FROM members m
LEFT JOIN units u ON m.unit_id = u.id;

-- Recreate birthday views (SECURITY INVOKER by default)
CREATE VIEW upcoming_birthdays AS
SELECT 
    m.id,
    m.name as member_name,
    m.birth_date,
    u.name as unit_name,
    EXTRACT(YEAR FROM AGE(m.birth_date)) as current_age
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM m.birth_date) >= EXTRACT(DAY FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM m.birth_date) <= EXTRACT(DAY FROM CURRENT_DATE) + 7
ORDER BY EXTRACT(DAY FROM m.birth_date);

CREATE VIEW todays_birthdays AS
SELECT 
    m.id,
    m.name as member_name,
    m.birth_date,
    u.name as unit_name,
    EXTRACT(YEAR FROM AGE(m.birth_date)) as current_age
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM CURRENT_DATE);

-- Note: counselor_ranking_today NOT recreated because counselor_evaluations table doesn't exist

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ SECURITY DEFINER VIEWS REMOVED!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Views recreated without SECURITY DEFINER:';
    RAISE NOTICE '  - members_with_units';
    RAISE NOTICE '  - upcoming_birthdays';
    RAISE NOTICE '  - todays_birthdays';
    RAISE NOTICE '================================================';
END $$;

-- Show all views in public schema
SELECT 
    schemaname,
    viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;
