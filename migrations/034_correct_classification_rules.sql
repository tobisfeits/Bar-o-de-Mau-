-- ============================================================
-- UPDATE CLASSIFICATION FUNCTION with CORRECT RULES
-- Created: 2026-02-10
-- Description: Implements exact classification rules from specification
-- ============================================================

CREATE OR REPLACE FUNCTION classify_member_unit(
    p_birth_date DATE,
    p_gender VARCHAR(1),
    p_role VARCHAR(50)
) RETURNS TEXT AS $$
DECLARE
    v_age INTEGER;
    v_cutoff_date DATE := '2026-07-31';  -- Fixed cutoff date
BEGIN
    -- Return NULL if birth_date is missing
    IF p_birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calculate age on July 31, 2026
    v_age := EXTRACT(YEAR FROM AGE(v_cutoff_date, p_birth_date));
    
    -- ========================================
    -- RULE 1: CONSELHEIROS never move (fixed)
    -- ========================================
    IF UPPER(p_role) = 'CONSELHEIRO' THEN
        RETURN NULL; -- Keep current unit
    END IF;
    
    -- ========================================
    -- RULE 2: INSTRUTORES always go to Lokomotiva
    -- ========================================
    IF UPPER(p_role) = 'INSTRUTOR' THEN
        RETURN 'Lokomotiva';
    END IF;
    
    -- ========================================
    -- RULE 3: DESBRAVADORES > 15 years (on cutoff) stay in current unit
    -- ========================================
    IF UPPER(p_role) = 'DESBRAVADOR' AND v_age > 15 THEN
        RETURN NULL; -- Keep current unit
    END IF;
    
    -- ========================================
    -- RULE 4: NON-DESBRAVADOR/NON-CONSELHEIRO with age > 15 → Lokomotiva
    -- ========================================
    IF UPPER(p_role) NOT IN ('DESBRAVADOR', 'CONSELHEIRO', 'INSTRUTOR') AND v_age > 15 THEN
        RETURN 'Lokomotiva';
    END IF;
    
    -- ========================================  
    -- RULE 5: DESBRAVADORES classification by age/gender
    -- ========================================
    IF UPPER(p_role) = 'DESBRAVADOR' AND v_age <= 15 THEN
        
        -- FEMALE DESBRAVADORES
        IF p_gender = 'F' THEN
            -- Imperatrizes: 9-11 years on cutoff
            IF v_age BETWEEN 9 AND 11 THEN
                RETURN 'Imperatrizes';
            
            -- Duquesas: turns 11 AFTER July 31, 2026 AND completes 13 BY July 31, 2026
            -- This means: age 12-13 on cutoff
            ELSIF v_age BETWEEN 12 AND 13 THEN
                RETURN 'Duquesas';
            
            -- Baronesas: turns 14 AFTER July 31, 2026 AND completes 15 BY July 31, 2026
            -- This means: age 14-15 on cutoff
            ELSIF v_age BETWEEN 14 AND 15 THEN
                RETURN 'Baronesas';
            
            -- Age < 9: keep in current unit
            ELSE
                RETURN NULL;
            END IF;
        
        -- MALE DESBRAVADORES
        ELSIF p_gender = 'M' THEN
            -- Imperadores: 9-12 years on cutoff
            IF v_age BETWEEN 9 AND 12 THEN
                RETURN 'Imperadores';
            
            --Barões: turns 13 AFTER July 31, 2026 AND completes 15 BY July 31, 2026
            -- This means: age 13-15 on cutoff
            ELSIF v_age BETWEEN 13 AND 15 THEN
                RETURN 'Barões';
           
            -- Age < 9: keep in current unit
            ELSE
                RETURN NULL;
            END IF;
        END IF;
    END IF;
    
    -- Default: keep in current unit
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION classify_member_unit IS 'Classifies members based on age on July 31, 2026. Conselheiros never move. Instrutores → Lokomotiva. Desbravadores classified by age/gender.';

-- ============================================================
-- Apply classification to all members
-- ============================================================
DO $$
DECLARE
    v_member RECORD;
    v_suggested_unit TEXT;
    v_new_unit_id TEXT;
    v_updated_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 Applying classification rules (cutoff: July 31, 2026)...';
    RAISE NOTICE '';
    
    FOR v_member IN 
        SELECT m.id, m.name, m.birth_date, m.gender, m.role, u.name as current_unit,
               EXTRACT(YEAR FROM AGE(DATE '2026-07-31', m.birth_date))::INTEGER as age_on_cutoff
        FROM members m
        LEFT JOIN units u ON m.unit_id = u.id
        WHERE m.birth_date IS NOT NULL
        ORDER BY m.birth_date DESC
    LOOP
        -- Get suggested unit from classification function
        v_suggested_unit := classify_member_unit(
            v_member.birth_date,
            v_member.gender,
            v_member.role
        );
        
        -- Only update if function returned a unit (not NULL)
        IF v_suggested_unit IS NOT NULL AND v_suggested_unit != v_member.current_unit THEN
            -- Get new unit ID
            SELECT id INTO v_new_unit_id
            FROM units
            WHERE name = v_suggested_unit
            LIMIT 1;
            
            IF v_new_unit_id IS NOT NULL THEN
                UPDATE members
                SET unit_id = v_new_unit_id
                WHERE id = v_member.id;
                
                v_updated_count := v_updated_count + 1;
                RAISE NOTICE '  ✓ % (age %) moved: % → %', 
                    v_member.name, 
                    v_member.age_on_cutoff,
                    v_member.current_unit, 
                    v_suggested_unit;
            END IF;
        ELSE
            v_skipped_count := v_skipped_count + 1;
            RAISE NOTICE '  - % (age %) stays in: % (role: %)', 
                v_member.name,
                v_member.age_on_cutoff,
                v_member.current_unit, 
                v_member.role;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Classification complete: % moved, % stayed', v_updated_count, v_skipped_count;
END $$;

-- ============================================================
-- Final validation
-- ============================================================
SELECT 
    u.name as unit,
    COUNT(*) as total,
    STRING_AGG(DISTINCT m.role, ', ') as roles,
    MIN(EXTRACT(YEAR FROM AGE(DATE '2026-07-31', m.birth_date)))::INTEGER as min_age,
    MAX(EXTRACT(YEAR FROM AGE(DATE '2026-07-31', m.birth_date)))::INTEGER as max_age
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
GROUP BY u.name
ORDER BY u.name;
