-- Migration 045: Fix Birthday Alert System
-- Created: 2026-02-13
-- Description: Recreate todays_birthdays view and get_birthday_alerts function
-- Issue: column todays_birthdays.new_age does not exist (400 Bad Request)

-- Drop and recreate view
DROP VIEW IF EXISTS todays_birthdays CASCADE;

CREATE OR REPLACE VIEW todays_birthdays AS
SELECT 
    m.id,
    m.name as member_name,
    u.name as unit_name,
    m.birth_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.birth_date))::INTEGER + 1 as new_age,
    m.unit_id
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND m.deleted_at IS NULL
  AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
ORDER BY m.name;

-- Recreate function
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
    SELECT 
        tb.id,
        tb.member_name,
        tb.unit_name,
        tb.birth_date,
        tb.new_age
    FROM todays_birthdays tb;
END;
$$ LANGUAGE plpgsql STABLE;

-- Test
-- SELECT * FROM get_birthday_alerts();
