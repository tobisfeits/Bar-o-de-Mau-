-- ============================================================
-- Migration 050: Fix Birthday Logic (Age & Timezone)
-- Created: 2026-02-23
-- Description: 
--   1. Restores current_date_brazil usage for accurate date filtering
--   2. Corrects new_age calculation to "Age completed in current year"
--   3. Ensures compatibility with restructured members list
-- ============================================================

-- Restore time-zone aware current date if dropped (from Migration 019)
CREATE OR REPLACE FUNCTION current_date_brazil()
RETURNS DATE AS $$
BEGIN
    RETURN (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1. Update todays_birthdays view
CREATE OR REPLACE VIEW todays_birthdays AS
SELECT 
    m.id,
    m.name AS member_name,
    u.name AS unit_name,
    m.birth_date,
    -- AGE TO BE COMPLETED IN 2026: (2026 - birth_year)
    (EXTRACT(YEAR FROM current_date_brazil()) - EXTRACT(YEAR FROM m.birth_date))::INTEGER AS new_age,
    m.unit_id
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND m.deleted_at IS NULL
  AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM current_date_brazil())
  AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM current_date_brazil())
ORDER BY m.name;

-- 2. Update upcoming_birthdays view
CREATE OR REPLACE VIEW upcoming_birthdays AS
SELECT 
    m.id,
    m.name AS member_name,
    u.name AS unit_name,
    m.birth_date,
    -- AGE TO BE COMPLETED IN 2026: (2026 - birth_year)
    (EXTRACT(YEAR FROM current_date_brazil()) - EXTRACT(YEAR FROM m.birth_date))::INTEGER AS new_age,
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
    END AS days_until_birthday
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND m.deleted_at IS NULL
  AND DATE(EXTRACT(YEAR FROM current_date_brazil()) || '-' || 
       LPAD(EXTRACT(MONTH FROM m.birth_date)::TEXT, 2, '0') || '-' || 
       LPAD(EXTRACT(DAY FROM m.birth_date)::TEXT, 2, '0'))
  BETWEEN current_date_brazil() AND current_date_brazil() + INTERVAL '7 days'
ORDER BY days_until_birthday, m.name;

-- 3. Update get_birthday_alerts function for consistency
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

-- ============================================================
-- VERIFICATION (Run this to see February birthdays)
-- ============================================================
-- SELECT member_name, birth_date, new_age, unit_name 
-- FROM members_with_units 
-- WHERE birth_date IS NOT NULL 
--   AND EXTRACT(MONTH FROM birth_date) = 2
--   AND deleted_at IS NULL
-- ORDER BY EXTRACT(DAY FROM birth_date);
