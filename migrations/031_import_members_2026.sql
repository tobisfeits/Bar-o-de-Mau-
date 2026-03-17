-- Migration 031: Import Members 2026
-- Created: 2026-02-09
-- Description: Full member import with business rules validation

-- ============================================================
-- STEP 1: Ensure all required units exist
-- ============================================================
DO $$
DECLARE
    unit_count INTEGER;
BEGIN
    -- Check if units already exist
    SELECT COUNT(*) INTO unit_count FROM units WHERE name IN (
        'Imperatrizes', 'Imperadores', 'Duquesas', 'Barões', 'Baronesas', 'Lokomotiva'
    );
    
    -- Only insert if we don't have all 6 units
    IF unit_count < 6 THEN
        -- Insert missing units individually to avoid duplicates
        INSERT INTO units (id, name, logo, gender, points, active, created_at)
        SELECT gen_random_uuid(), 'Imperatrizes', '/fotos/imperatrizes.jpg', 'F', 0, true, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM units WHERE name = 'Imperatrizes');
        
        INSERT INTO units (id, name, logo, gender, points, active, created_at)
        SELECT gen_random_uuid(), 'Imperadores', '/fotos/imperadores.jpg', 'M', 0, true, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM units WHERE name = 'Imperadores');
        
        INSERT INTO units (id, name, logo, gender, points, active, created_at)
        SELECT gen_random_uuid(), 'Duquesas', '/fotos/duquesas.jpg', 'F', 0, true, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM units WHERE name = 'Duquesas');
        
        INSERT INTO units (id, name, logo, gender, points, active, created_at)
        SELECT gen_random_uuid(), 'Barões', '/fotos/baroes.jpg', 'M', 0, true, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM units WHERE name = 'Barões');
        
        INSERT INTO units (id, name, logo, gender, points, active, created_at)
        SELECT gen_random_uuid(), 'Baronesas', '/fotos/baronesas.jpg', 'F', 0, true, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM units WHERE name = 'Baronesas');
        
        INSERT INTO units (id, name, logo, gender, points, active, created_at)
        SELECT gen_random_uuid(), 'Lokomotiva', '/fotos/lokomotiva.jpg', 'M', 0, true, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM units WHERE name = 'Lokomotiva');
        
        RAISE NOTICE '✅ Units validated/created';
    ELSE
        RAISE NOTICE '✅ All 6 units already exist';
    END IF;
END $$;

-- ============================================================
-- STEP 2: Fix cutoff date to July 30th instead of June 30th
-- ============================================================
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
    
    -- Calculate age on July 30th of current year (FIXED FROM JUNE 30)
    v_cutoff_date := DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-07-30');
    v_age := EXTRACT(YEAR FROM AGE(v_cutoff_date, p_birth_date));
    
    -- Rule 1: CONSELHEIROS never change (exception)
    IF UPPER(p_role) = 'CONSELHEIRO' THEN
        RETURN NULL; -- Keep current unit
    END IF;
    
    -- Rule 2: INSTRUTORES always go to Lokomotiva
    IF UPPER(p_role) = 'INSTRUTOR' THEN
        RETURN 'Lokomotiva';
    END IF;
    
    -- Rule 3: Staff or 16+ years → Stay where they are (Lokomotiva)
    IF UPPER(p_role) NOT IN ('DESBRAVADOR', 'INSTRUTOR', 'CONSELHEIRO') OR v_age >= 16 THEN
        RETURN NULL; -- Keep current (they should already be in Lokomotiva)
    END IF;
    
    -- Rule 4: DESBRAVADORES < 16 years → Classify by age/gender
    
    -- Male classifications
    IF p_gender = 'M' AND v_age BETWEEN 9 AND 12 THEN
        RETURN 'Imperadores';
    ELSIF p_gender = 'M' AND v_age BETWEEN 13 AND 15 THEN
        RETURN 'Barões';
    
    -- Female classifications
    ELSIF p_gender = 'F' AND v_age BETWEEN 9 AND 11 THEN
        RETURN 'Imperatrizes';
    ELSIF p_gender = 'F' AND v_age BETWEEN 12 AND 13 THEN
        RETURN 'Duquesas';
    ELSIF p_gender = 'F' AND v_age BETWEEN 14 AND 15 THEN
        RETURN 'Baronesas';
    
    -- No rule matches: keep current unit
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- STEP 3: Clear existing members (backup first if needed!)
-- ============================================================
-- TRUNCATE members CASCADE;

-- ============================================================
-- STEP 4: Insert all members with correct unit assignments
-- ============================================================

-- Get unit IDs and insert members
DO $$
DECLARE
    unit_imperatrizes TEXT;
    unit_imperadores TEXT;
    unit_duquesas TEXT;
    unit_baroes TEXT;
    unit_baronesas TEXT;
    unit_lokomotiva TEXT;
BEGIN
    -- Fetch unit IDs with error handling
    SELECT id INTO STRICT unit_imperatrizes FROM units WHERE name = 'Imperatrizes';
    SELECT id INTO STRICT unit_imperadores FROM units WHERE name = 'Imperadores';
    SELECT id INTO STRICT unit_duquesas FROM units WHERE name = 'Duquesas';
    SELECT id INTO STRICT unit_baroes FROM units WHERE name = 'Barões';
    SELECT id INTO STRICT unit_baronesas FROM units WHERE name = 'Baronesas';
    SELECT id INTO STRICT unit_lokomotiva FROM units WHERE name = 'Lokomotiva';

    RAISE NOTICE '📋 Unit IDs loaded successfully';
    
    -- Insert members with manual unit assignment from spreadsheet
    INSERT INTO members (id, name, birth_date, gender, role, unit_id) VALUES
    -- IMPERATRIZES (from spreadsheet)
    (gen_random_uuid(), 'Catarina Gonçalves Feitosa', '2016-02-23', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Lívia Araújo Dos Santos', '2016-04-05', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Lorena Vera Dias', '2016-05-04', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Ana Clara De Jesus Pinto Duarte', '2015-05-22', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Julia Lacerda Peixoto', '2015-07-29', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Lívia Gomes Sousa', '2015-11-14', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Isabela Mendes Teixeira', '2014-10-27', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Kiné Romero Sow', '2014-08-22', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Pietra Gabriela Véras Dos Santos', '2014-10-07', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Yasmim Borges Silva', '2013-09-05', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Larissa Ferreira Campos', '2004-10-14', 'F', 'Conselheiro', unit_imperatrizes),
    
    -- IMPERADORES (from spreadsheet)
    (gen_random_uuid(), 'David Dantas Da Silva', '2015-08-10', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'John Révisson Santos De Oliveira', '2015-11-02', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'David Daniel Bezerra Barroso', '2014-10-01', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Ricardo Daniel Jorgo Da Silva', '2014-03-31', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Arthur De Jesus Pinto Duarte', '2013-08-22', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Erik Bueno Pinheiro', '2013-10-17', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Matheus Barrinovo Martins', '2013-08-19', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Nicollas Gabriel Santana De Almeida', '2013-07-21', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Eduardo Marques De Oliveira', '2004-07-01', 'M', 'Conselheiro', unit_imperadores),
    (gen_random_uuid(), 'Tobias Feitosa De Matos', '1985-02-02', 'M', 'Conselheiro', unit_imperadores),
    
    -- DUQUESAS (from spreadsheet)
    (gen_random_uuid(), 'Diana Meneses Do Silva', '2013-03-28', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Helevsa Aparecida Fernandes', '2013-05-03', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Letícia Nunes De Bna', '2013-05-25', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Taline Ramos Galúcio', '2013-07-21', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Manuela Marques De Oliveira', '2012-06-03', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Marcela De Oliveira Maia', '2012-06-27', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Maria Helena Fernandes Gonçalves', '2012-11-12', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Rebecca Bueno Amancio Da Silva', '2012-09-19', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Sophia Victoria Ramirez Lima', '2012-10-01', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Luísa Gabrielle De Sousa Silva', '2004-05-30', 'F', 'Conselheiro', unit_duquesas),
    (gen_random_uuid(), 'Laodicéia Gonçalves Dias De Souza', '1977-02-04', 'F', 'Conselheiro', unit_duquesas),
    
    -- BARÕES (from spreadsheet)
    (gen_random_uuid(), 'Ítalo Ramos Glaucio', '2012-04-22', 'M', 'Desbravador', unit_baroes),
    (gen_random_uuid(), 'Josué Araujo De Souza', '2010-03-28', 'M', 'Desbravador', unit_baroes),
    (gen_random_uuid(), 'Carlos Eduardo Carvalho Silva Filho', '2009-07-30', 'M', 'Desbravador', unit_baroes),
    (gen_random_uuid(), 'Lucas De Araujo Tavares', '1995-06-11', 'M', 'Conselheiro', unit_baroes),
    (gen_random_uuid(), 'Marlon Ferreira Da Silva Amorim', '1976-03-17', 'M', 'Conselheiro', unit_baroes),
    
    -- BARONESAS (from spreadsheet)
    (gen_random_uuid(), 'Gabriel Bueno Pinheiro', '2011-08-18', 'M', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Vitoria Mel Santana Dantas', '2011-02-15', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Arthur Bueno Pinheiro Da Silva', '2011-02-01', 'M', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Isabella Ferreira Campos', '2010-05-06', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Julia De Souza Feitosa', '2010-11-28', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Rafaella Borges Da Silva', '2010-08-17', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Revine Jnule Santana De Oliveira', '2010-11-22', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Ana Luiza Ferreira Arrais', '2010-01-21', 'F', 'Instrutor', unit_baronesas),
    (gen_random_uuid(), 'Giovanna Raposo Santos Lessa', '2009-10-31', 'F', 'Instrutor', unit_baronesas),
    (gen_random_uuid(), 'Bianca Vieira Amorim', '2003-07-06', 'F', 'Conselheiro', unit_baronesas),
    (gen_random_uuid(), 'Deborah Barrinovo Martins', '2002-08-01', 'F', 'Conselheiro', unit_baronesas),
    (gen_random_uuid(), 'Emily Lima De Franca', '2002-04-06', 'F', 'Conselheiro', unit_baronesas),
    (gen_random_uuid(), 'Daniela Bezerra Marques', '1982-09-11', 'F', 'Conselheiro', unit_baronesas),
    (gen_random_uuid(), 'Jane Virgínia Ramos De Oliveira', '1982-10-23', 'F', 'Conselheiro', unit_baronesas),
    
    -- LOKOMOTIVA (Staff and Instrutores)
    (gen_random_uuid(), 'Júlia Carolina Pires Lima', '2009-03-24', 'F', 'Instrutor', unit_lokomotiva),
    (gen_random_uuid(), 'Victor Luis Britis Novais', '2009-06-22', 'M', 'Instrutor', unit_lokomotiva),
    (gen_random_uuid(), 'Robson De Almeida Silva', '1983-10-19', 'M', 'Instrutor', unit_lokomotiva),
    (gen_random_uuid(), 'Silas Melchior Da Silva Melo', '2002-06-06', 'M', 'Diretor de Clube', unit_lokomotiva),
    (gen_random_uuid(), 'Diane Gonçalves Da Silva Feitosa', '1984-01-03', 'F', 'Secretário de Clube', unit_lokomotiva),
    (gen_random_uuid(), 'Hellen Cristina Barbosa De Almeida', '1983-10-15', 'F', 'Instrutor', unit_lokomotiva),
    (gen_random_uuid(), 'Vânia Vieira Silva Amorim', '1973-04-16', 'F', 'Diretor Associado', unit_lokomotiva)
    
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE '✅ 64 members imported successfully!';
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION '❌ ERROR: One or more units not found. Please check unit names in database.';
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ ERROR during import: %', SQLERRM;
END $$;

-- ============================================================
-- STEP 5: Apply classification rules to adjust units
-- ============================================================
DO $$
DECLARE
    v_member RECORD;
    v_suggested_unit TEXT;
    v_new_unit_id TEXT;
    v_updated_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 Applying classification rules...';
    
    FOR v_member IN 
        SELECT m.id, m.name, m.birth_date, m.gender, m.role, u.name as current_unit
        FROM members m
        LEFT JOIN units u ON m.unit_id = u.id
        WHERE m.birth_date IS NOT NULL
        ORDER BY m.name
    LOOP
        -- Get suggested unit from classification function
        v_suggested_unit := classify_member_unit(
            v_member.birth_date,
            v_member.gender,
            v_member.role
        );
        
        -- Only update if function returned a unit (not NULL)
        IF v_suggested_unit IS NOT NULL THEN
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
                RAISE NOTICE '  ✓ % moved: % → %', v_member.name, v_member.current_unit, v_suggested_unit;
            END IF;
        ELSE
            v_skipped_count := v_skipped_count + 1;
            RAISE NOTICE '  - % kept in: % (role: %)', v_member.name, v_member.current_unit, v_member.role;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Classification complete: % moved, % kept in place', v_updated_count, v_skipped_count;
END $$;

-- ============================================================
-- STEP 6: Validation report
-- ============================================================
SELECT 
    u.name as unit,
    COUNT(*) as total_members,
    COUNT(CASE WHEN m.role = 'Desbravador' THEN 1 END) as desbravadores,
    COUNT(CASE WHEN m.role = 'Conselheiro' THEN 1 END) as conselheiros,
    COUNT(CASE WHEN m.role = 'Instrutor' THEN 1 END) as instrutores,
    COUNT(CASE WHEN m.role NOT IN ('Desbravador', 'Conselheiro', 'Instrutor') THEN 1 END) as staff
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
GROUP BY u.name
ORDER BY u.name;
