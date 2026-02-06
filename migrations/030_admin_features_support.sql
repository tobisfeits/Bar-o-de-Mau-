-- ============================================
-- MIGRATION 030: ADMIN FEATURES SUPPORT
-- ============================================
-- 1. Add 'is_manual_unit' column to support manual overrides
-- 2. Update classification function to respect manual override
-- 3. Ensure 'active' column exists (redundant check)

-- 1. Add is_manual_unit column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'is_manual_unit') THEN
        ALTER TABLE members ADD COLUMN is_manual_unit BOOLEAN DEFAULT false;
    END IF;
    
    -- Also ensure active column exists (from migration 029) just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'active') THEN
        ALTER TABLE members ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Update Classification Function to support Manual Override
-- We add p_is_manual_unit with DEFAULT false to maintain backward compatibility
CREATE OR REPLACE FUNCTION classify_member_unit_v2(
    p_birth_date DATE,
    p_gender VARCHAR(1),
    p_role VARCHAR(50),
    p_is_manual_unit BOOLEAN DEFAULT false
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
    
    -- RULE 0: MANUAL OVERRIDE (New)
    -- If manual override is enabled, NEVER change the unit automatically
    IF p_is_manual_unit IS TRUE THEN
        RETURN NULL; -- Keep current unit
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

-- 3. Verification Query
SELECT name, role, unit_id, is_manual_unit FROM members LIMIT 5;
