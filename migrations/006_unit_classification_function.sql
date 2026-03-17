-- Migration 006: Unit Classification Function
-- Created: 2026-01-02
-- Description: Automatic unit classification based on age, gender, and role

-- Function to classify member's unit based on business rules
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
    
    -- Calculate age on June 30th of current year
    v_cutoff_date := DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-06-30');
    v_age := EXTRACT(YEAR FROM AGE(v_cutoff_date, p_birth_date));
    
    -- CRITICAL EXCEPTION: Conselheiros are NEVER moved to Lokomotiva
    -- They must remain in children's units to lead them
    IF UPPER(p_role) = 'CONSELHEIRO' THEN
        RETURN NULL; -- Keep current unit assignment
    END IF;
    
    -- Apply classification rules based on age and gender
    
    -- Rule 1: 16+ years old → Lokomotiva (except Conselheiros)
    IF v_age >= 16 THEN
        RETURN 'Lokomotiva';
    
    -- Rule 2: Male, 9-12 years → Imperadores
    ELSIF p_gender = 'M' AND v_age BETWEEN 9 AND 12 THEN
        RETURN 'Imperadores';
    
    -- Rule 3: Male, 13-15 years → Barões
    ELSIF p_gender = 'M' AND v_age BETWEEN 13 AND 15 THEN
        RETURN 'Barões';
    
    -- Rule 4: Female, 9-11 years → Imperatrizes
    ELSIF p_gender = 'F' AND v_age BETWEEN 9 AND 11 THEN
        RETURN 'Imperatrizes';
    
    -- Rule 5: Female, 12-13 years → Duquesas
    ELSIF p_gender = 'F' AND v_age BETWEEN 12 AND 13 THEN
        RETURN 'Duquesas';
    
    -- Rule 6: Female, 14-15 years → Baronesas
    ELSIF p_gender = 'F' AND v_age BETWEEN 14 AND 15 THEN
        RETURN 'Baronesas';
    
    -- No rule matches: keep current unit
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add function comment
COMMENT ON FUNCTION classify_member_unit IS 'Classifies member unit based on age (June 30 cutoff), gender, and role. Conselheiros are never moved to Lokomotiva.';

-- Procedure to update all member units based on classification
CREATE OR REPLACE PROCEDURE update_member_units()
LANGUAGE plpgsql AS $$
DECLARE
    v_member RECORD;
    v_new_unit_name TEXT;
    v_new_unit_id TEXT;
    v_updated_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting unit classification update...';
    
    -- Loop through all members with birth_date
    FOR v_member IN 
        SELECT id, name, birth_date, gender, role, unit_id 
        FROM members 
        WHERE birth_date IS NOT NULL
        ORDER BY name
    LOOP
        -- Get new unit name from classification function
        v_new_unit_name := classify_member_unit(
            v_member.birth_date, 
            v_member.gender, 
            v_member.role
        );
        
        -- Only update if classification returned a unit
        IF v_new_unit_name IS NOT NULL THEN
            -- Get unit ID from unit name
            SELECT id INTO v_new_unit_id
            FROM units 
            WHERE name = v_new_unit_name 
            LIMIT 1;
            
            -- Update member's unit if found
            IF v_new_unit_id IS NOT NULL AND v_new_unit_id != v_member.unit_id THEN
                UPDATE members 
                SET unit_id = v_new_unit_id
                WHERE id = v_member.id;
                
                v_updated_count := v_updated_count + 1;
                RAISE NOTICE 'Updated: % → %', v_member.name, v_new_unit_name;
            ELSE
                v_skipped_count := v_skipped_count + 1;
            END IF;
        ELSE
            v_skipped_count := v_skipped_count + 1;
            RAISE NOTICE 'Skipped: % (role: %)', v_member.name, v_member.role;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Unit classification completed: % updated, % skipped', v_updated_count, v_skipped_count;
END;
$$;

-- Add procedure comment
COMMENT ON PROCEDURE update_member_units IS 'Batch updates all member units based on classification rules. Safe to run multiple times.';

-- Test query to preview classification results (without updating)
-- SELECT 
--     m.name,
--     m.role,
--     m.birth_date,
--     m.gender,
--     EXTRACT(YEAR FROM AGE(DATE '2026-06-30', m.birth_date)) as age_on_cutoff,
--     u_current.name as current_unit,
--     classify_member_unit(m.birth_date, m.gender, m.role) as suggested_unit
-- FROM members m
-- LEFT JOIN units u_current ON m.unit_id = u_current.id
-- WHERE m.birth_date IS NOT NULL
-- ORDER BY m.name;
