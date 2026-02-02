-- Migration 019: Fix Birthday Timezone and Age Calculation
-- Created: 2026-02-02
-- Description: Fix timezone offset (UTC → America/Sao_Paulo) and age calculation (+1 bug)
-- Fixes: 
--   1. Birthday banner showing 3 hours early (21h instead of 00h)
--   2. Age showing 42 instead of 41 on birthday

-- ============================================
-- Fix 1: Create timezone-aware date function
-- ============================================
CREATE OR REPLACE FUNCTION current_date_brazil()
RETURNS DATE AS $$
BEGIN
    -- Convert current timestamp to São Paulo timezone and extract date
    RETURN (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION current_date_brazil IS 'Returns current date in America/Sao_Paulo timezone (UTC-3). Use instead of CURRENT_DATE to avoid timezone bugs.';

-- ============================================
-- Fix 2: Update todays_birthdays view
-- ============================================
CREATE OR REPLACE VIEW todays_birthdays AS
SELECT 
    m.id,
    m.name as member_name,
    u.name as unit_name,
    m.birth_date,
    -- FIX: Removed + 1 from age calculation (was adding extra year)
    EXTRACT(YEAR FROM AGE(current_date_brazil(), m.birth_date)) as new_age,
    m.role,
    m.gender
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  -- FIX: Use Brazil timezone instead of UTC
  AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM current_date_brazil())
  AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM current_date_brazil())
ORDER BY m.name;

COMMENT ON VIEW todays_birthdays IS 'Shows members who have birthdays TODAY (America/Sao_Paulo timezone) with correct age calculation';

-- ============================================
-- Fix 3: Update upcoming_birthdays view
-- ============================================
CREATE OR REPLACE VIEW upcoming_birthdays AS
SELECT 
    m.id,
    m.name as member_name,
    u.name as unit_name,
    m.birth_date,
    -- FIX: Removed + 1 from age calculation
    EXTRACT(YEAR FROM AGE(current_date_brazil(), m.birth_date)) as new_age,
    m.role,
    -- Calculate days until birthday this year (using Brazil timezone)
    CASE 
        WHEN DATE(EXTRACT(YEAR FROM current_date_brazil()) || '-' || 
                  LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' || 
                  LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0')) >= current_date_brazil()
        THEN DATE(EXTRACT(YEAR FROM current_date_brazil()) || '-' || 
                  LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' || 
                  LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0')) - current_date_brazil()
        ELSE DATE(EXTRACT(YEAR FROM current_date_brazil()) + 1 || '-' || 
                  LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' || 
                  LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0')) - current_date_brazil()
    END as days_until_birthday
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND (
    -- Birthday is within next 7 days this year (using Brazil timezone)
    DATE(EXTRACT(YEAR FROM current_date_brazil()) || '-' || 
         LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' || 
         LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0')) 
    BETWEEN current_date_brazil() AND current_date_brazil() + INTERVAL '7 days'
  )
ORDER BY days_until_birthday, m.name;

COMMENT ON VIEW upcoming_birthdays IS 'Shows members with birthdays in the next 7 days (America/Sao_Paulo timezone)';

-- ============================================
-- Verification Queries
-- ============================================

-- Test 1: Verify timezone function
-- Should return current date in São Paulo (not UTC)
-- SELECT current_date_brazil() as brazil_date, CURRENT_DATE as utc_date;

-- Test 2: Verify today's birthdays with correct age
-- SELECT member_name, birth_date, new_age FROM todays_birthdays;

-- Test 3: Verify upcoming birthdays
-- SELECT member_name, birth_date, new_age, days_until_birthday FROM upcoming_birthdays;

-- Test 4: Specific test for Tobias (born 1985-02-02)
-- On 2026-02-02, should show age 41 (not 42)
-- SELECT member_name, birth_date, new_age 
-- FROM todays_birthdays 
-- WHERE member_name LIKE '%Tobias%';
