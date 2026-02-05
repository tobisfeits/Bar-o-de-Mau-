-- ============================================
-- MIGRATION 028: Apply Unit Classification Rules
-- ============================================
-- Rules:
-- 1. IF role contains "CONSELHEIRO" → Keep current unit
-- 2. ELSE IF role != "DESBRAVADOR" OR age >= 16 → Keep current unit
-- 3. ELSE → Apply age/gender rules (move to correct unit)

-- ============================================
-- STEP 1: Create/Update Classification Function
-- ============================================

CREATE OR REPLACE FUNCTION classify_member_unit_v2(
    p_birth_date DATE,
    p_gender VARCHAR(1),
    p_role VARCHAR(50)
) RETURNS TEXT AS $$
DECLARE
    v_age INTEGER;
    v_cutoff_date DATE;
    v_role_upper TEXT;
BEGIN
    -- Return NULL if birth_date is missing
    IF p_birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Normalize role to uppercase
    v_role_upper := UPPER(TRIM(COALESCE(p_role, '')));
    
    -- Calculate age on JULY 30th, 2026
    v_cutoff_date := DATE '2026-07-30';
    v_age := EXTRACT(YEAR FROM AGE(v_cutoff_date, p_birth_date));
    
    -- RULE 1: If role contains "CONSELHEIRO" → Keep current unit
    IF v_role_upper LIKE '%CONSELHEIRO%' THEN
        RETURN NULL; -- Keep current unit
    END IF;
    
    -- RULE 2: If role != "DESBRAVADOR" OR age >= 16 → Keep current unit
    IF v_role_upper != 'DESBRAVADOR' OR v_age >= 16 THEN
        RETURN NULL; -- Keep current unit
    END IF;
    
    -- RULE 3: Apply age/gender rules (only for DESBRAVADOR with age < 16)
    IF p_gender = 'M' AND v_age BETWEEN 10 AND 12 THEN
        RETURN 'Imperadores';
    ELSIF p_gender = 'M' AND v_age BETWEEN 13 AND 15 THEN
        RETURN 'Barões';
    ELSIF p_gender = 'F' AND v_age BETWEEN 10 AND 11 THEN
        RETURN 'Imperatrizes';
    ELSIF p_gender = 'F' AND v_age BETWEEN 11 AND 13 THEN
        RETURN 'Duquesas';
    ELSIF p_gender = 'F' AND v_age BETWEEN 13 AND 15 THEN
        RETURN 'Baronesas';
    ELSE
        RETURN NULL; -- Age outside range, keep current unit
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION classify_member_unit_v2 IS 
'V2: Classifies members based on strict rules:
1. CONSELHEIRO (any variation) → Keep current unit
2. Non-DESBRAVADOR OR age >= 16 → Keep current unit
3. DESBRAVADOR with age < 16 → Apply age/gender rules

Age calculated on July 30, 2026:
- Boys: Imperadores (10-12), Barões (13-15)
- Girls: Imperatrizes (10-11), Duquesas (11-13), Baronesas (13-15)';

-- ============================================
-- STEP 2: Preview Changes
-- ============================================

DO $$
DECLARE
    v_member RECORD;
    v_new_unit_name TEXT;
    v_will_change INTEGER := 0;
    v_will_stay INTEGER := 0;
    v_conselheiro_count INTEGER := 0;
    v_non_desbravador_count INTEGER := 0;
    v_age_16_plus_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 PREVIEW: Who will be moved?';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '';
    
    FOR v_member IN 
        SELECT 
            m.id, 
            m.name, 
            m.birth_date, 
            m.gender, 
            m.role, 
            u.name as current_unit,
            EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) as age
        FROM members m
        LEFT JOIN units u ON m.unit_id = u.id
        WHERE m.birth_date IS NOT NULL
        ORDER BY m.role, m.name
    LOOP
        v_new_unit_name := classify_member_unit_v2(v_member.birth_date, v_member.gender, v_member.role);
        
        IF v_new_unit_name IS NOT NULL AND v_new_unit_name != v_member.current_unit THEN
            RAISE NOTICE '🔄 WILL MOVE: % (%, age %) : % → %', 
                v_member.name, v_member.role, v_member.age, v_member.current_unit, v_new_unit_name;
            v_will_change := v_will_change + 1;
        ELSE
            v_will_stay := v_will_stay + 1;
            
            -- Count reasons for staying
            IF UPPER(TRIM(COALESCE(v_member.role, ''))) LIKE '%CONSELHEIRO%' THEN
                v_conselheiro_count := v_conselheiro_count + 1;
            ELSIF UPPER(TRIM(COALESCE(v_member.role, ''))) != 'DESBRAVADOR' THEN
                v_non_desbravador_count := v_non_desbravador_count + 1;
            ELSIF v_member.age >= 16 THEN
                v_age_16_plus_count := v_age_16_plus_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 SUMMARY:';
    RAISE NOTICE '  🔄 Will be moved: % members', v_will_change;
    RAISE NOTICE '  ✋ Will stay in current unit: % members', v_will_stay;
    RAISE NOTICE '';
    RAISE NOTICE '  Reasons for staying:';
    RAISE NOTICE '    - Conselheiro: %', v_conselheiro_count;
    RAISE NOTICE '    - Non-Desbravador (Instrutor/Diretor/etc): %', v_non_desbravador_count;
    RAISE NOTICE '    - Desbravador but age >= 16: %', v_age_16_plus_count;
    RAISE NOTICE '';
END $$;

-- ============================================
-- STEP 3: Apply Changes (Uncomment to execute)
-- ============================================

/*
DO $$
DECLARE
    v_member RECORD;
    v_new_unit_name TEXT;
    v_new_unit_id TEXT;
    v_updated INTEGER := 0;
    v_skipped INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 APPLYING CHANGES...';
    RAISE NOTICE '';
    
    FOR v_member IN 
        SELECT m.id, m.name, m.birth_date, m.gender, m.role, m.unit_id
        FROM members m
        WHERE m.birth_date IS NOT NULL
        ORDER BY m.name
    LOOP
        v_new_unit_name := classify_member_unit_v2(v_member.birth_date, v_member.gender, v_member.role);
        
        IF v_new_unit_name IS NOT NULL THEN
            SELECT id INTO v_new_unit_id
            FROM units 
            WHERE UPPER(TRIM(name)) = UPPER(TRIM(v_new_unit_name))
            LIMIT 1;
            
            IF v_new_unit_id IS NOT NULL AND v_new_unit_id != v_member.unit_id THEN
                UPDATE members 
                SET unit_id = v_new_unit_id
                WHERE id = v_member.id;
                
                v_updated := v_updated + 1;
            ELSE
                v_skipped := v_skipped + 1;
            END IF;
        ELSE
            v_skipped := v_skipped + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Changes applied!';
    RAISE NOTICE '  Updated: % members', v_updated;
    RAISE NOTICE '  Skipped: % members', v_skipped;
    RAISE NOTICE '';
END $$;
*/

-- ============================================
-- STEP 4: Verification Queries
-- ============================================

-- Check members by role and unit
SELECT 
    'Members by Role and Unit' as report,
    m.role,
    u.name as unit,
    COUNT(*) as count,
    MIN(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date))) as min_age,
    MAX(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date))) as max_age
FROM members m
JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
GROUP BY m.role, u.name
ORDER BY m.role, u.name;

-- Check Desbravadores specifically
SELECT 
    'Desbravadores by Unit' as report,
    u.name as unit,
    m.gender,
    COUNT(*) as count,
    MIN(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date))) as min_age,
    MAX(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date))) as max_age
FROM members m
JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND UPPER(TRIM(m.role)) = 'DESBRAVADOR'
GROUP BY u.name, m.gender
ORDER BY u.name, m.gender;
