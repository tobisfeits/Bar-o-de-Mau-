-- ============================================================
-- Migration 048: Reestruturação Completa da Base de Membros
-- Created: 2026-02-23
-- Description:
--   1. Remove age-based classification automation (DB functions)
--   2. Soft-delete members NOT in the official list
--   3. Upsert all 55 members with Title Case names, correct
--      units, roles, and genders
-- ============================================================

-- ============================================================
-- STEP 1: Drop age-based classification functions
-- ============================================================

DROP PROCEDURE IF EXISTS update_member_units();
DROP FUNCTION IF EXISTS classify_member_unit(DATE, VARCHAR, VARCHAR);

RAISE NOTICE '✅ Dropped classify_member_unit() and update_member_units()';

-- ============================================================
-- STEP 2: Soft-delete members NOT in the official list
-- Then upsert all 55 official members
-- ============================================================

DO $$
DECLARE
    v_unit_imperadores TEXT;
    v_unit_imperatrizes TEXT;
    v_unit_baronesas TEXT;
    v_unit_baroes TEXT;
    v_unit_duquesas TEXT;
    v_unit_lokomotiva TEXT;
    v_updated INTEGER := 0;
    v_inserted INTEGER := 0;
    v_deleted INTEGER := 0;
BEGIN
    -- Get unit IDs
    SELECT id INTO v_unit_imperadores FROM units WHERE name = 'Imperadores' LIMIT 1;
    SELECT id INTO v_unit_imperatrizes FROM units WHERE name = 'Imperatrizes' LIMIT 1;
    SELECT id INTO v_unit_baronesas FROM units WHERE name = 'Baronesas' LIMIT 1;
    SELECT id INTO v_unit_baroes FROM units WHERE name = 'Barões' LIMIT 1;
    SELECT id INTO v_unit_duquesas FROM units WHERE name = 'Duquesas' LIMIT 1;
    SELECT id INTO v_unit_lokomotiva FROM units WHERE name = 'Lokomotiva' LIMIT 1;

    -- Verify all units found
    IF v_unit_imperadores IS NULL OR v_unit_imperatrizes IS NULL OR
       v_unit_baronesas IS NULL OR v_unit_baroes IS NULL OR
       v_unit_duquesas IS NULL OR v_unit_lokomotiva IS NULL THEN
        RAISE EXCEPTION 'Missing unit IDs! Check units table.';
    END IF;

    RAISE NOTICE 'Unit IDs: Imperadores=%, Imperatrizes=%, Baronesas=%, Barões=%, Duquesas=%, Lokomotiva=%',
        v_unit_imperadores, v_unit_imperatrizes, v_unit_baronesas, v_unit_baroes, v_unit_duquesas, v_unit_lokomotiva;

    -- ============================================================
    -- STEP 2a: Soft-delete ALL active members first
    -- (We'll "un-delete" the ones in the official list below)
    -- ============================================================
    UPDATE members
    SET deleted_at = NOW()
    WHERE deleted_at IS NULL;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '🗑️ Soft-deleted % active members (will restore official list)', v_deleted;

    -- ============================================================
    -- STEP 2b: Upsert all 55 official members
    -- Strategy: Match by UPPER(name), update fields, clear deleted_at
    -- If not found, insert new
    -- ============================================================

    -- Helper: Update or insert a member
    -- For each member, try UPDATE first, then INSERT if no match

    -- === CONSELHEIROS ===

    -- 1. Bianca Vieira Amorim - Conselheiro - Imperatrizes
    UPDATE members SET name = 'Bianca Vieira Amorim', role = 'CONSELHEIRO', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2003-07-06', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Bianca Vieira Amorim', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Bianca Vieira Amorim', 'CONSELHEIRO', v_unit_imperatrizes, 'F', '2003-07-06');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 2. Larissa Ferreira Campos - Conselheiro - Imperatrizes
    UPDATE members SET name = 'Larissa Ferreira Campos', role = 'CONSELHEIRO', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2004-04-14', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Larissa Ferreira Campos', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Larissa Ferreira Campos', 'CONSELHEIRO', v_unit_imperatrizes, 'F', '2004-04-14');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 3. Eduardo Marques de Oliveira - Conselheiro - Imperadores
    UPDATE members SET name = 'Eduardo Marques de Oliveira', role = 'CONSELHEIRO', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '2004-07-01', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Eduardo Marques de Oliveira', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Eduardo Marques de Oliveira', 'CONSELHEIRO', v_unit_imperadores, 'M', '2004-07-01');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 4. Deborah Barrinovo Martins - Conselheiro - Baronesas
    UPDATE members SET name = 'Deborah Barrinovo Martins', role = 'CONSELHEIRO', unit_id = v_unit_baronesas,
        gender = 'F', birth_date = '2002-08-01', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Deborah Barrinovo Martins', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Deborah Barrinovo Martins', 'CONSELHEIRO', v_unit_baronesas, 'F', '2002-08-01');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 5. Daniela Bezerra Marques - Conselheiro - Duquesas
    UPDATE members SET name = 'Daniela Bezerra Marques', role = 'CONSELHEIRO', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '1982-09-11', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Daniela Bezerra Marques', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Daniela Bezerra Marques', 'CONSELHEIRO', v_unit_duquesas, 'F', '1982-09-11');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 6. Lucas de Araujo Tavares - Conselheiro - Barões
    UPDATE members SET name = 'Lucas de Araujo Tavares', role = 'CONSELHEIRO', unit_id = v_unit_baroes,
        gender = 'M', birth_date = '1995-06-11', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Lucas de Araujo Tavares', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Lucas de Araujo Tavares', 'CONSELHEIRO', v_unit_baroes, 'M', '1995-06-11');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 7. Luisa Gabriella de Sousa Silva - Conselheiro - Duquesas
    UPDATE members SET name = 'Luisa Gabriella de Sousa Silva', role = 'CONSELHEIRO', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '2004-05-30', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Luisa Gabriella de Sousa Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Luisa Gabriella de Sousa Silva', 'CONSELHEIRO', v_unit_duquesas, 'F', '2004-05-30');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 8. Tobias Feitosa de Matos - Conselheiro - Imperadores
    UPDATE members SET name = 'Tobias Feitosa de Matos', role = 'CONSELHEIRO', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '1985-02-02', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Tobias Feitosa de Matos', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Tobias Feitosa de Matos', 'CONSELHEIRO', v_unit_imperadores, 'M', '1985-02-02');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 9. Emilly Lima de Franca - Conselheiro - Baronesas
    UPDATE members SET name = 'Emilly Lima de Franca', role = 'CONSELHEIRO', unit_id = v_unit_baronesas,
        gender = 'F', birth_date = '2002-04-06', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Emilly Lima de Franca', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Emilly Lima de Franca', 'CONSELHEIRO', v_unit_baronesas, 'F', '2002-04-06');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 10. Marlon Ferreira da Silva Amorim - Conselheiro - Barões
    UPDATE members SET name = 'Marlon Ferreira da Silva Amorim', role = 'CONSELHEIRO', unit_id = v_unit_baroes,
        gender = 'M', birth_date = '1976-03-17', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Marlon Ferreira da Silva Amorim', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Marlon Ferreira da Silva Amorim', 'CONSELHEIRO', v_unit_baroes, 'M', '1976-03-17');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 11. Robson de Almeida Silva - Conselheiro - Lokomotiva
    UPDATE members SET name = 'Robson de Almeida Silva', role = 'CONSELHEIRO', unit_id = v_unit_lokomotiva,
        gender = 'M', birth_date = '1982-10-19', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Robson de Almeida Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Robson de Almeida Silva', 'CONSELHEIRO', v_unit_lokomotiva, 'M', '1982-10-19');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 12. Jane Virgínia Ramos Santos de Oliveira - Conselheiro - Lokomotiva
    UPDATE members SET name = 'Jane Virgínia Ramos Santos de Oliveira', role = 'CONSELHEIRO', unit_id = v_unit_lokomotiva,
        gender = 'F', birth_date = '1982-10-23', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Jane Virgínia Ramos Santos de Oliveira', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Jane Virgínia Ramos Santos de Oliveira', 'CONSELHEIRO', v_unit_lokomotiva, 'F', '1982-10-23');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 13. Laodicéia Gonçalves Dias de Souza - Conselheiro - Duquesas
    UPDATE members SET name = 'Laodicéia Gonçalves Dias de Souza', role = 'CONSELHEIRO', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '1977-02-04', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Laodicéia Gonçalves Dias de Souza', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Laodicéia Gonçalves Dias de Souza', 'CONSELHEIRO', v_unit_duquesas, 'F', '1977-02-04');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- === INSTRUTORES ===

    -- 14. Vânia Vieira Silva Amorim - Instrutor - Lokomotiva
    UPDATE members SET name = 'Vânia Vieira Silva Amorim', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva,
        gender = 'F', birth_date = '1973-04-16', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Vânia Vieira Silva Amorim', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Vânia Vieira Silva Amorim', 'INSTRUTOR', v_unit_lokomotiva, 'F', '1973-04-16');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 15. Josué Araujo de Oliveira - Instrutor - Lokomotiva
    UPDATE members SET name = 'Josué Araujo de Oliveira', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva,
        gender = 'M', birth_date = '2010-03-03', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Josué Araujo de Oliveira', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Josué Araujo de Oliveira', 'INSTRUTOR', v_unit_lokomotiva, 'M', '2010-03-03');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 16. Júlia Carolina Pires Lima - Instrutor - Baronesas
    UPDATE members SET name = 'Júlia Carolina Pires Lima', role = 'INSTRUTOR', unit_id = v_unit_baronesas,
        gender = 'F', birth_date = '2009-03-24', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Júlia Carolina Pires Lima', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Júlia Carolina Pires Lima', 'INSTRUTOR', v_unit_baronesas, 'F', '2009-03-24');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 17. Nicoly Sobral Medeiros - Instrutor - Lokomotiva
    UPDATE members SET name = 'Nicoly Sobral Medeiros', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva,
        gender = 'F', birth_date = '2008-11-25', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Nicoly Sobral Medeiros', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Nicoly Sobral Medeiros', 'INSTRUTOR', v_unit_lokomotiva, 'F', '2008-11-25');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 18. Victor Luis Britis Bezerril - Instrutor - Lokomotiva
    UPDATE members SET name = 'Victor Luis Britis Bezerril', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva,
        gender = 'M', birth_date = '2009-06-22', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Victor Luis Britis Bezerril', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Victor Luis Britis Bezerril', 'INSTRUTOR', v_unit_lokomotiva, 'M', '2009-06-22');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 19. Isabella Ferreira Campos - Instrutor - Lokomotiva
    UPDATE members SET name = 'Isabella Ferreira Campos', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva,
        gender = 'F', birth_date = '2010-05-06', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Isabella Ferreira Campos', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Isabella Ferreira Campos', 'INSTRUTOR', v_unit_lokomotiva, 'F', '2010-05-06');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 20. Hellen Cristina Barbosa de Almeida - Instrutor - Lokomotiva
    UPDATE members SET name = 'Hellen Cristina Barbosa de Almeida', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva,
        gender = 'F', birth_date = '1983-10-15', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Hellen Cristina Barbosa de Almeida', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Hellen Cristina Barbosa de Almeida', 'INSTRUTOR', v_unit_lokomotiva, 'F', '1983-10-15');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 21. Giovanna Raposo Santos Vidal - Instrutor - Lokomotiva
    UPDATE members SET name = 'Giovanna Raposo Santos Vidal', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva,
        gender = 'F', birth_date = '2009-10-31', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Giovanna Raposo Santos Vidal', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Giovanna Raposo Santos Vidal', 'INSTRUTOR', v_unit_lokomotiva, 'F', '2009-10-31');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- === DIRETOR DE CLUBE ===

    -- 22. Silas Melchior da Silva Melo - Diretor de Clube - Lokomotiva
    UPDATE members SET name = 'Silas Melchior da Silva Melo', role = 'DIRETOR DE CLUBE', unit_id = v_unit_lokomotiva,
        gender = 'M', birth_date = '2002-06-06', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Silas Melchior da Silva Melo', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Silas Melchior da Silva Melo', 'DIRETOR DE CLUBE', v_unit_lokomotiva, 'M', '2002-06-06');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- === SECRETÁRIO DO CLUBE ===

    -- 23. Diane Gonçalves da Silva Feitosa - Secretário do Clube - Lokomotiva
    UPDATE members SET name = 'Diane Gonçalves da Silva Feitosa', role = 'SECRETÁRIO DO CLUBE', unit_id = v_unit_lokomotiva,
        gender = 'F', birth_date = '1984-03-01', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Diane Gonçalves da Silva Feitosa', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Diane Gonçalves da Silva Feitosa', 'SECRETÁRIO DO CLUBE', v_unit_lokomotiva, 'F', '1984-03-01');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- === DESBRAVADORES ===

    -- 24. Arthur Bueno Amancio da Silva - Desbravador - Barões
    UPDATE members SET name = 'Arthur Bueno Amancio da Silva', role = 'DESBRAVADOR', unit_id = v_unit_baroes,
        gender = 'M', birth_date = '2011-02-01', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Arthur Bueno Amancio da Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Arthur Bueno Amancio da Silva', 'DESBRAVADOR', v_unit_baroes, 'M', '2011-02-01');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 25. Rebecca Bueno Amancio da Silva - Desbravador - Duquesas
    UPDATE members SET name = 'Rebecca Bueno Amancio da Silva', role = 'DESBRAVADOR', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '2012-09-19', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Rebecca Bueno Amancio da Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Rebecca Bueno Amancio da Silva', 'DESBRAVADOR', v_unit_duquesas, 'F', '2012-09-19');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 26. Gabriel Bueno Pinheiro - Desbravador - Barões
    UPDATE members SET name = 'Gabriel Bueno Pinheiro', role = 'DESBRAVADOR', unit_id = v_unit_baroes,
        gender = 'M', birth_date = '2011-08-18', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Gabriel Bueno Pinheiro', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Gabriel Bueno Pinheiro', 'DESBRAVADOR', v_unit_baroes, 'M', '2011-08-18');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 27. Nicollas Gabriel Barbosa de Almeida - Desbravador - Imperadores
    UPDATE members SET name = 'Nicollas Gabriel Barbosa de Almeida', role = 'DESBRAVADOR', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '2013-11-27', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Nicollas Gabriel Barbosa de Almeida', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Nicollas Gabriel Barbosa de Almeida', 'DESBRAVADOR', v_unit_imperadores, 'M', '2013-11-27');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 28. Julia de Souza Feitosa - Desbravador - Baronesas
    UPDATE members SET name = 'Julia de Souza Feitosa', role = 'DESBRAVADOR', unit_id = v_unit_baronesas,
        gender = 'F', birth_date = '2010-11-28', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Julia de Souza Feitosa', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Julia de Souza Feitosa', 'DESBRAVADOR', v_unit_baronesas, 'F', '2010-11-28');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 29. Manuela Marques de Oliveira - Desbravador - Baronesas
    UPDATE members SET name = 'Manuela Marques de Oliveira', role = 'DESBRAVADOR', unit_id = v_unit_baronesas,
        gender = 'F', birth_date = '2012-06-03', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Manuela Marques de Oliveira', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Manuela Marques de Oliveira', 'DESBRAVADOR', v_unit_baronesas, 'F', '2012-06-03');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 30. Marcela de Oliveira Mota - Desbravador - Baronesas
    UPDATE members SET name = 'Marcela de Oliveira Mota', role = 'DESBRAVADOR', unit_id = v_unit_baronesas,
        gender = 'F', birth_date = '2012-06-27', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Marcela de Oliveira Mota', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Marcela de Oliveira Mota', 'DESBRAVADOR', v_unit_baronesas, 'F', '2012-06-27');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 31. Diana Menezes da Silva - Desbravador - Duquesas
    UPDATE members SET name = 'Diana Menezes da Silva', role = 'DESBRAVADOR', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '2013-03-03', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Diana Menezes da Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Diana Menezes da Silva', 'DESBRAVADOR', v_unit_duquesas, 'F', '2013-03-03');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 32. Sophia Victoria Gutierrez Lima - Desbravador - Duquesas
    UPDATE members SET name = 'Sophia Victoria Gutierrez Lima', role = 'DESBRAVADOR', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '2012-10-19', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Sophia Victoria Gutierrez Lima', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Sophia Victoria Gutierrez Lima', 'DESBRAVADOR', v_unit_duquesas, 'F', '2012-10-19');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 33. Taline Ramos Galúcio - Desbravador - Duquesas
    UPDATE members SET name = 'Taline Ramos Galúcio', role = 'DESBRAVADOR', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '2013-07-21', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Taline Ramos Galúcio', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Taline Ramos Galúcio', 'DESBRAVADOR', v_unit_duquesas, 'F', '2013-07-21');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 34. Ítalo Ramos Glaúcio - Desbravador - Barões
    UPDATE members SET name = 'Ítalo Ramos Glaúcio', role = 'DESBRAVADOR', unit_id = v_unit_baroes,
        gender = 'M', birth_date = '2012-04-22', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Ítalo Ramos Glaúcio', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Ítalo Ramos Glaúcio', 'DESBRAVADOR', v_unit_baroes, 'M', '2012-04-22');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 35. Ana Clara de Jesus Pinto Duarte - Desbravador - Imperatrizes
    UPDATE members SET name = 'Ana Clara de Jesus Pinto Duarte', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2015-05-22', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Ana Clara de Jesus Pinto Duarte', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Ana Clara de Jesus Pinto Duarte', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2015-05-22');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 36. Arthur de Jesus Pinto Duarte - Desbravador - Imperadores
    UPDATE members SET name = 'Arthur de Jesus Pinto Duarte', role = 'DESBRAVADOR', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '2013-08-22', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Arthur de Jesus Pinto Duarte', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Arthur de Jesus Pinto Duarte', 'DESBRAVADOR', v_unit_imperadores, 'M', '2013-08-22');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 37. Isabela Mendes Biscaia - Desbravador - Imperatrizes
    UPDATE members SET name = 'Isabela Mendes Biscaia', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2014-10-27', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Isabela Mendes Biscaia', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Isabela Mendes Biscaia', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2014-10-27');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 38. Vitoria Mel Santana Dantas - Desbravador - Baronesas
    UPDATE members SET name = 'Vitoria Mel Santana Dantas', role = 'DESBRAVADOR', unit_id = v_unit_baronesas,
        gender = 'F', birth_date = '2011-02-15', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Vitoria Mel Santana Dantas', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Vitoria Mel Santana Dantas', 'DESBRAVADOR', v_unit_baronesas, 'F', '2011-02-15');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 39. David Daniel Bezerra Barroso - Desbravador - Imperadores
    UPDATE members SET name = 'David Daniel Bezerra Barroso', role = 'DESBRAVADOR', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '2014-10-01', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('David Daniel Bezerra Barroso', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'David Daniel Bezerra Barroso', 'DESBRAVADOR', v_unit_imperadores, 'M', '2014-10-01');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 40. David Dantas da Silva - Desbravador - Imperadores
    UPDATE members SET name = 'David Dantas da Silva', role = 'DESBRAVADOR', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '2015-08-10', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('David Dantas da Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'David Dantas da Silva', 'DESBRAVADOR', v_unit_imperadores, 'M', '2015-08-10');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 41. Matheus Barrinovo Martins - Desbravador - Imperadores
    UPDATE members SET name = 'Matheus Barrinovo Martins', role = 'DESBRAVADOR', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '2013-08-19', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Matheus Barrinovo Martins', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Matheus Barrinovo Martins', 'DESBRAVADOR', v_unit_imperadores, 'M', '2013-08-19');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 42. Maria Helena Fernandes Gonçalves - Desbravador - Duquesas
    UPDATE members SET name = 'Maria Helena Fernandes Gonçalves', role = 'DESBRAVADOR', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '2012-11-12', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Maria Helena Fernandes Gonçalves', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Maria Helena Fernandes Gonçalves', 'DESBRAVADOR', v_unit_duquesas, 'F', '2012-11-12');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 43. Rafaella Borges da Silva - Desbravador - Baronesas
    UPDATE members SET name = 'Rafaella Borges da Silva', role = 'DESBRAVADOR', unit_id = v_unit_baronesas,
        gender = 'F', birth_date = '2010-08-17', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Rafaella Borges da Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Rafaella Borges da Silva', 'DESBRAVADOR', v_unit_baronesas, 'F', '2010-08-17');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 44. Erik Bueno Pinheiro - Desbravador - Imperadores
    UPDATE members SET name = 'Erik Bueno Pinheiro', role = 'DESBRAVADOR', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '2013-10-17', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Erik Bueno Pinheiro', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Erik Bueno Pinheiro', 'DESBRAVADOR', v_unit_imperadores, 'M', '2013-10-17');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 45. Ana Luiza Ferreira Arrais - Desbravador - Lokomotiva
    UPDATE members SET name = 'Ana Luiza Ferreira Arrais', role = 'DESBRAVADOR', unit_id = v_unit_lokomotiva,
        gender = 'F', birth_date = '2010-01-21', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Ana Luiza Ferreira Arrais', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Ana Luiza Ferreira Arrais', 'DESBRAVADOR', v_unit_lokomotiva, 'F', '2010-01-21');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 46. Pietra Gabriela Vieira dos Santos - Desbravador - Imperatrizes
    UPDATE members SET name = 'Pietra Gabriela Vieira dos Santos', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2014-10-07', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Pietra Gabriela Vieira dos Santos', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Pietra Gabriela Vieira dos Santos', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2014-10-07');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 47. Heloysa Aparecida Fernandes - Desbravador - Duquesas
    UPDATE members SET name = 'Heloysa Aparecida Fernandes', role = 'DESBRAVADOR', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '2013-05-03', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Heloysa Aparecida Fernandes', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Heloysa Aparecida Fernandes', 'DESBRAVADOR', v_unit_duquesas, 'F', '2013-05-03');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 48. Kinê Romero Sow - Desbravador - Imperatrizes
    UPDATE members SET name = 'Kinê Romero Sow', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2014-08-22', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Kinê Romero Sow', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Kinê Romero Sow', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2014-08-22');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 49. Ricardo Daniel Jorge da Silva - Desbravador - Imperadores
    UPDATE members SET name = 'Ricardo Daniel Jorge da Silva', role = 'DESBRAVADOR', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '2014-03-31', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Ricardo Daniel Jorge da Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Ricardo Daniel Jorge da Silva', 'DESBRAVADOR', v_unit_imperadores, 'M', '2014-03-31');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 50. Yasmim Borges Silva - Desbravador - Duquesas
    UPDATE members SET name = 'Yasmim Borges Silva', role = 'DESBRAVADOR', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '2013-09-05', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Yasmim Borges Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Yasmim Borges Silva', 'DESBRAVADOR', v_unit_duquesas, 'F', '2013-09-05');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 51. Natasha Castro Rios Maia - Desbravador - Duquesas
    UPDATE members SET name = 'Natasha Castro Rios Maia', role = 'DESBRAVADOR', unit_id = v_unit_duquesas,
        gender = 'F', birth_date = '2013-04-01', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Natasha Castro Rios Maia', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Natasha Castro Rios Maia', 'DESBRAVADOR', v_unit_duquesas, 'F', '2013-04-01');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 52. Raissa Darielly da Silva - Desbravador - Imperatrizes
    UPDATE members SET name = 'Raissa Darielly da Silva', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2016-01-04', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Raissa Darielly da Silva', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Raissa Darielly da Silva', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2016-01-04');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 53. Julia Lacerda Peixoto - Desbravador - Imperatrizes
    UPDATE members SET name = 'Julia Lacerda Peixoto', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2015-07-29', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Julia Lacerda Peixoto', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Julia Lacerda Peixoto', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2015-07-29');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 54. Catarina Gonçalves Feitosa - Desbravador - Imperatrizes
    UPDATE members SET name = 'Catarina Gonçalves Feitosa', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2016-02-22', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Catarina Gonçalves Feitosa', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Catarina Gonçalves Feitosa', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2016-02-22');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 55. Lívia Gomes Sousa - Desbravador - Imperatrizes
    UPDATE members SET name = 'Lívia Gomes Sousa', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2015-11-14', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Lívia Gomes Sousa', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Lívia Gomes Sousa', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2015-11-14');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 56. Lívia Araújo dos Santos - Desbravador - Imperatrizes
    UPDATE members SET name = 'Lívia Araújo dos Santos', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2016-05-24', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Lívia Araújo dos Santos', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Lívia Araújo dos Santos', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2016-05-24');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 57. Lorena Vera Dias - Desbravador - Imperatrizes
    UPDATE members SET name = 'Lorena Vera Dias', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes,
        gender = 'F', birth_date = '2016-05-04', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Lorena Vera Dias', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Lorena Vera Dias', 'DESBRAVADOR', v_unit_imperatrizes, 'F', '2016-05-04');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 58. John Révisson Santos de Oliveira - Desbravador - Imperadores
    UPDATE members SET name = 'John Révisson Santos de Oliveira', role = 'DESBRAVADOR', unit_id = v_unit_imperadores,
        gender = 'M', birth_date = '2015-11-02', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('John Révisson Santos de Oliveira', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'John Révisson Santos de Oliveira', 'DESBRAVADOR', v_unit_imperadores, 'M', '2015-11-02');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- 59. Carlos Eduardo Carvalho Silva Filho - Desbravador - Barões
    UPDATE members SET name = 'Carlos Eduardo Carvalho Silva Filho', role = 'DESBRAVADOR', unit_id = v_unit_baroes,
        gender = 'M', birth_date = '2009-07-30', deleted_at = NULL
    WHERE UPPER(REPLACE(name, ' ', '')) = UPPER(REPLACE('Carlos Eduardo Carvalho Silva Filho', ' ', ''));
    IF NOT FOUND THEN
        INSERT INTO members (id, name, role, unit_id, gender, birth_date)
        VALUES (gen_random_uuid(), 'Carlos Eduardo Carvalho Silva Filho', 'DESBRAVADOR', v_unit_baroes, 'M', '2009-07-30');
        v_inserted := v_inserted + 1;
    ELSE v_updated := v_updated + 1;
    END IF;

    -- ============================================================
    -- SUMMARY
    -- ============================================================
    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ Migration 048 Complete!';
    RAISE NOTICE '   Updated: % members', v_updated;
    RAISE NOTICE '   Inserted: % new members', v_inserted;
    RAISE NOTICE '   Total soft-deleted (not in list): check query below';
    RAISE NOTICE '============================================================';
END $$;

-- ============================================================
-- STEP 3: Verification Queries
-- ============================================================

-- Count by role
SELECT role, COUNT(*) as total 
FROM members 
WHERE deleted_at IS NULL 
GROUP BY role 
ORDER BY role;

-- Count by unit
SELECT u.name as unit_name, COUNT(m.id) as members
FROM members m
JOIN units u ON m.unit_id = u.id
WHERE m.deleted_at IS NULL
GROUP BY u.name
ORDER BY u.name;

-- Full member list
SELECT m.name, m.role, u.name as unit_name, m.gender, m.birth_date
FROM members m
JOIN units u ON m.unit_id = u.id
WHERE m.deleted_at IS NULL
ORDER BY u.name, m.role, m.name;

-- Soft-deleted members (for audit)
SELECT name, role, deleted_at
FROM members
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC, name;
