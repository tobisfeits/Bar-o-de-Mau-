-- ============================================
-- Migration 025: FIX Unit Classification Rules
-- ============================================
-- Created: 2026-02-03
-- Status: 🔴 BUG FIX (User Reported)
-- Issue: Classification using wrong cutoff date (June 30 instead of July 30)
--        and incorrect age ranges for all units

-- ============================================
-- BUGS FOUND IN MIGRATION 006:
-- ============================================
-- 1. Cutoff date: June 30 → Should be July 30
-- 2. Imperadores: 9-12 → Should be 10-12
-- 3. Barões: 13-15 → CORRECT ✅
-- 4. Imperatrizes: 9-11 → Should be 10-11
-- 5. Duquesas: 12-13 → Should be 11-13 (special rule: 11 from Aug 1)
-- 6. Baronesas: 14-15 → Should be 13-15 (special rule: 13 from Aug 1)

-- ============================================
-- CORRECTED FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION classify_member_unit(
    p_birth_date DATE,
    p_gender VARCHAR(1),
    p_role VARCHAR(50)
) RETURNS TEXT AS $$
DECLARE
    v_age INTEGER;
    v_cutoff_date DATE;
BEGIN
    -- Return NULL if birth_date is missing
    IF p_birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- ✨ FIX: Calculate age on JULY 30th (not June 30)
    v_cutoff_date := DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-07-30');
    v_age := EXTRACT(YEAR FROM AGE(v_cutoff_date, p_birth_date));
    
    -- CRITICAL EXCEPTION: Conselheiros are NEVER moved to Lokomotiva
    -- They must remain in children's units to lead them
    IF UPPER(p_role) = 'CONSELHEIRO' THEN
        RETURN NULL; -- Keep current unit assignment
    END IF;
    
    -- ============================================
    -- CORRECTED CLASSIFICATION RULES
    -- ============================================
    
    -- Rule 1: 16+ years old → Lokomotiva (except Conselheiros)
    IF v_age >= 16 THEN
        RETURN 'Lokomotiva';
    
    -- ✨ FIX: Male, 10-12 years → Imperadores (was 9-12)
    ELSIF p_gender = 'M' AND v_age BETWEEN 10 AND 12 THEN
        RETURN 'Imperadores';
    
    -- Rule 3: Male, 13-15 years → Barões (CORRECT)
    ELSIF p_gender = 'M' AND v_age BETWEEN 13 AND 15 THEN
        RETURN 'Barões';
    
    -- ✨ FIX: Female, 10-11 years → Imperatrizes (was 9-11)
    ELSIF p_gender = 'F' AND v_age BETWEEN 10 AND 11 THEN
        RETURN 'Imperatrizes';
    
    -- ✨ FIX: Female, 11-13 years → Duquesas (was 12-13)
    -- Note: Age 11 from Aug 1 onwards falls here due to July 30 cutoff
    ELSIF p_gender = 'F' AND v_age BETWEEN 11 AND 13 THEN
        RETURN 'Duquesas';
    
    -- ✨ FIX: Female, 13-15 years → Baronesas (was 14-15)
    -- Note: Age 13 from Aug 1 onwards falls here due to July 30 cutoff
    ELSIF p_gender = 'F' AND v_age BETWEEN 13 AND 15 THEN
        RETURN 'Baronesas';
    
    -- No rule matches: keep current unit
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update function comment
COMMENT ON FUNCTION classify_member_unit IS 
'✅ FIXED: Classifies member unit based on age (JULY 30 cutoff), gender, and role. 
Conselheiros are never moved to Lokomotiva.

RULES (Age on July 30, 2026):
- Meninos: Imperadores (10-12), Barões (13-15)
- Meninas: Imperatrizes (10-11), Duquesas (11-13), Baronesas (13-15)
- All: Lokomotiva (16+, except Conselheiros)';

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Preview classification results (DO NOT RUN update_member_units() yet!)
SELECT 
    m.name,
    m.role,
    m.birth_date,
    m.gender,
    EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) as age_on_july_30,
    u_current.name as current_unit,
    classify_member_unit(m.birth_date, m.gender, m.role) as suggested_unit,
    CASE 
        WHEN classify_member_unit(m.birth_date, m.gender, m.role) IS NULL THEN '⏭️ Skip'
        WHEN classify_member_unit(m.birth_date, m.gender, m.role) = u_current.name THEN '✅ OK'
        ELSE '🔄 Will Change'
    END as status
FROM members m
LEFT JOIN units u_current ON m.unit_id = u_current.id
WHERE m.birth_date IS NOT NULL
ORDER BY 
    CASE 
        WHEN classify_member_unit(m.birth_date, m.gender, m.role) != u_current.name THEN 0
        ELSE 1
    END,
    m.name;

-- ============================================
-- EXECUTION INSTRUCTIONS
-- ============================================

/*
⚠️ IMPORTANT: DO NOT RUN update_member_units() YET!

STEPS TO EXECUTE:

1. Run this migration to fix the function
2. Review the verification query results above
3. Verify that suggested_unit matches your expectations
4. Only then run: CALL update_member_units();

EXPECTED CHANGES (based on corrected rules):

Meninos (Male):
- 10-12 years (on July 30) → Imperadores
- 13-15 years (on July 30) → Barões

Meninas (Female):
- 10-11 years (on July 30) → Imperatrizes
- 11-13 years (on July 30) → Duquesas
  (includes girls turning 11 after July 30)
- 13-15 years (on July 30) → Baronesas
  (includes girls turning 13 after July 30)

CUTOFF DATE: July 30, 2026 (not June 30!)
*/
