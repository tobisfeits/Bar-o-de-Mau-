-- Migration 007: Birthday Alert System
-- Created: 2026-01-02
-- Description: View and function for daily birthday alerts

-- Create view for today's birthdays
CREATE OR REPLACE VIEW todays_birthdays AS
SELECT 
    m.id,
    m.name as member_name,
    u.name as unit_name,
    m.birth_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.birth_date)) + 1 as new_age,
    m.role,
    m.gender
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM CURRENT_DATE)
ORDER BY m.name;

-- Add view comment
COMMENT ON VIEW todays_birthdays IS 'Shows members who have birthdays today with their current unit and new age';

-- Function to get birthday alerts (for API/RPC calls)
CREATE OR REPLACE FUNCTION get_birthday_alerts()
RETURNS TABLE (
    member_id TEXT,
    member_name TEXT,
    unit_name TEXT,
    birth_date DATE,
    new_age INTEGER,
    role VARCHAR(50),
    gender VARCHAR(1)
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        id,
        todays_birthdays.member_name,
        todays_birthdays.unit_name,
        todays_birthdays.birth_date,
        todays_birthdays.new_age::INTEGER,
        todays_birthdays.role,
        todays_birthdays.gender
    FROM todays_birthdays;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function comment
COMMENT ON FUNCTION get_birthday_alerts IS 'Returns list of members with birthdays today. Call daily from frontend.';

-- View for upcoming birthdays (next 7 days)
CREATE OR REPLACE VIEW upcoming_birthdays AS
SELECT 
    m.id,
    m.name as member_name,
    u.name as unit_name,
    m.birth_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.birth_date)) + 1 as new_age,
    m.role,
    -- Calculate days until birthday this year
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
    END as days_until_birthday
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND (
    -- Birthday is within next 7 days this year
    DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-' || 
         LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' || 
         LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0')) 
    BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  )
ORDER BY days_until_birthday, m.name;

-- Add view comment
COMMENT ON VIEW upcoming_birthdays IS 'Shows members with birthdays in the next 7 days';

-- Function to get upcoming birthdays
CREATE OR REPLACE FUNCTION get_upcoming_birthdays()
RETURNS TABLE (
    member_id TEXT,
    member_name TEXT,
    unit_name TEXT,
    birth_date DATE,
    new_age INTEGER,
    days_until_birthday INTEGER
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        id,
        upcoming_birthdays.member_name,
        upcoming_birthdays.unit_name,
        upcoming_birthdays.birth_date,
        upcoming_birthdays.new_age::INTEGER,
        upcoming_birthdays.days_until_birthday::INTEGER
    FROM upcoming_birthdays;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add function comment
COMMENT ON FUNCTION get_upcoming_birthdays IS 'Returns list of members with birthdays in the next 7 days';

-- Test queries
-- SELECT * FROM todays_birthdays;
-- SELECT * FROM upcoming_birthdays;
-- SELECT * FROM get_birthday_alerts();
