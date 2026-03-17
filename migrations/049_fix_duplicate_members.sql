-- ============================================================
-- Migration 049: Fix Duplicate Members from Name Mismatches
-- Created: 2026-02-23
-- Description: Migration 048 created duplicates because member
--   names in the DB had slight spelling differences from the
--   official list. This migration:
--   1. Updates old (soft-deleted) records with correct names/data
--   2. Restores them (clears deleted_at)
--   3. Removes the newly inserted duplicates
-- ============================================================

DO $$
DECLARE
    v_old_id TEXT;
    v_new_id TEXT;
    v_fixed INTEGER := 0;
    v_unit_imperadores TEXT;
    v_unit_imperatrizes TEXT;
    v_unit_baronesas TEXT;
    v_unit_baroes TEXT;
    v_unit_duquesas TEXT;
    v_unit_lokomotiva TEXT;
BEGIN
    -- Get unit IDs
    SELECT id INTO v_unit_imperadores FROM units WHERE name = 'Imperadores' LIMIT 1;
    SELECT id INTO v_unit_imperatrizes FROM units WHERE name = 'Imperatrizes' LIMIT 1;
    SELECT id INTO v_unit_baronesas FROM units WHERE name = 'Baronesas' LIMIT 1;
    SELECT id INTO v_unit_baroes FROM units WHERE name = 'Barões' LIMIT 1;
    SELECT id INTO v_unit_duquesas FROM units WHERE name = 'Duquesas' LIMIT 1;
    SELECT id INTO v_unit_lokomotiva FROM units WHERE name = 'Lokomotiva' LIMIT 1;

    -- ============================================================
    -- For each mismatched pair:
    --   1. Find old record ID (soft-deleted, has score history)
    --   2. Find new record ID (just inserted, no scores)
    --   3. Update old record with correct name/data, un-delete it
    --   4. Delete the new duplicate
    -- ============================================================

    -- 1. Diana Meneses Do Silva → Diana Menezes da Silva
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%DIANA MENESES%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Diana Menezes da Silva' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Diana Menezes da Silva', role = 'DESBRAVADOR', unit_id = v_unit_duquesas, gender = 'F', birth_date = '2013-03-03', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Diana Menezes da Silva';
    END IF;

    -- 2. Emily Lima De Franca → Emilly Lima de Franca
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%EMILY LIMA%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Emilly Lima de Franca' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Emilly Lima de Franca', role = 'CONSELHEIRO', unit_id = v_unit_baronesas, gender = 'F', birth_date = '2002-04-06', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Emilly Lima de Franca';
    END IF;

    -- 3. Giovanna Raposo Santos Lessa → Giovanna Raposo Santos Vidal
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%GIOVANNA RAPOSO%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Giovanna Raposo Santos Vidal' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Giovanna Raposo Santos Vidal', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva, gender = 'F', birth_date = '2009-10-31', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Giovanna Raposo Santos Vidal';
    END IF;

    -- 4. Helevsa Aparecida Fernandes → Heloysa Aparecida Fernandes
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%HELEV%APARECIDA%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Heloysa Aparecida Fernandes' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Heloysa Aparecida Fernandes', role = 'DESBRAVADOR', unit_id = v_unit_duquesas, gender = 'F', birth_date = '2013-05-03', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Heloysa Aparecida Fernandes';
    END IF;

    -- 5. Isabela Mendes Teixeira → Isabela Mendes Biscaia
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%ISABELA MENDES%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Isabela Mendes Biscaia' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Isabela Mendes Biscaia', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes, gender = 'F', birth_date = '2014-10-27', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Isabela Mendes Biscaia';
    END IF;

    -- 6. Ítalo Ramos Glaucio → Ítalo Ramos Glaúcio
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%TALO RAMOS GLAUCIO%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Ítalo Ramos Glaúcio' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Ítalo Ramos Glaúcio', role = 'DESBRAVADOR', unit_id = v_unit_baroes, gender = 'M', birth_date = '2012-04-22', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Ítalo Ramos Glaúcio';
    END IF;

    -- 7. Jane Virgínia Ramos De Oliveira → Jane Virgínia Ramos Santos de Oliveira
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%JANE VIRG%NIA RAMOS%OLIVEIRA%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Jane Virgínia Ramos Santos de Oliveira' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Jane Virgínia Ramos Santos de Oliveira', role = 'CONSELHEIRO', unit_id = v_unit_lokomotiva, gender = 'F', birth_date = '1982-10-23', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Jane Virgínia Ramos Santos de Oliveira';
    END IF;

    -- 8. Josué Araujo De Souza → Josué Araujo de Oliveira
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%JOSU%ARAUJO%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Josué Araujo de Oliveira' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Josué Araujo de Oliveira', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva, gender = 'M', birth_date = '2010-03-03', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Josué Araujo de Oliveira';
    END IF;

    -- 9. Kiné Romero Sow → Kinê Romero Sow
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%KIN%ROMERO%SOW%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Kinê Romero Sow' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Kinê Romero Sow', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes, gender = 'F', birth_date = '2014-08-22', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Kinê Romero Sow';
    END IF;

    -- 10. Luísa Gabrielle De Sousa Silva → Luisa Gabriella de Sousa Silva
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%LU%SA GABRIEL%SOUSA SILVA%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Luisa Gabriella de Sousa Silva' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Luisa Gabriella de Sousa Silva', role = 'CONSELHEIRO', unit_id = v_unit_duquesas, gender = 'F', birth_date = '2004-05-30', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Luisa Gabriella de Sousa Silva';
    END IF;

    -- 11. Marcela De Oliveira Maia → Marcela de Oliveira Mota
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%MARCELA%OLIVEIRA MA%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Marcela de Oliveira Mota' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Marcela de Oliveira Mota', role = 'DESBRAVADOR', unit_id = v_unit_baronesas, gender = 'F', birth_date = '2012-06-27', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Marcela de Oliveira Mota';
    END IF;

    -- 12. Nicollas Gabriel Santana De Almeida → Nicollas Gabriel Barbosa de Almeida
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%NICOLLAS GABRIEL%ALMEIDA%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Nicollas Gabriel Barbosa de Almeida' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Nicollas Gabriel Barbosa de Almeida', role = 'DESBRAVADOR', unit_id = v_unit_imperadores, gender = 'M', birth_date = '2013-11-27', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Nicollas Gabriel Barbosa de Almeida';
    END IF;

    -- 13. Pietra Gabriela Véras Dos Santos → Pietra Gabriela Vieira dos Santos
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%PIETRA GABRIELA V%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Pietra Gabriela Vieira dos Santos' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Pietra Gabriela Vieira dos Santos', role = 'DESBRAVADOR', unit_id = v_unit_imperatrizes, gender = 'F', birth_date = '2014-10-07', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Pietra Gabriela Vieira dos Santos';
    END IF;

    -- 14. Ricardo Daniel Jorgo Da Silva → Ricardo Daniel Jorge da Silva
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%RICARDO DANIEL JORG%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Ricardo Daniel Jorge da Silva' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Ricardo Daniel Jorge da Silva', role = 'DESBRAVADOR', unit_id = v_unit_imperadores, gender = 'M', birth_date = '2014-03-31', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Ricardo Daniel Jorge da Silva';
    END IF;

    -- 15. Sophia Victoria Ramirez Lima → Sophia Victoria Gutierrez Lima
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%SOPHIA VICTORIA%LIMA%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Sophia Victoria Gutierrez Lima' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Sophia Victoria Gutierrez Lima', role = 'DESBRAVADOR', unit_id = v_unit_duquesas, gender = 'F', birth_date = '2012-10-19', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Sophia Victoria Gutierrez Lima';
    END IF;

    -- 16. Victor Luis Britis Novais → Victor Luis Britis Bezerril
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%VICTOR LUIS BRITIS%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Victor Luis Britis Bezerril' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Victor Luis Britis Bezerril', role = 'INSTRUTOR', unit_id = v_unit_lokomotiva, gender = 'M', birth_date = '2009-06-22', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Victor Luis Britis Bezerril';
    END IF;

    -- 17. Arthur Bueno Pinheiro Da Silva → Arthur Bueno Amancio da Silva
    SELECT id INTO v_old_id FROM members WHERE UPPER(name) LIKE '%ARTHUR BUENO%SILVA%' AND deleted_at IS NOT NULL LIMIT 1;
    SELECT id INTO v_new_id FROM members WHERE name = 'Arthur Bueno Amancio da Silva' AND deleted_at IS NULL LIMIT 1;
    IF v_old_id IS NOT NULL AND v_new_id IS NOT NULL THEN
        UPDATE members SET name = 'Arthur Bueno Amancio da Silva', role = 'DESBRAVADOR', unit_id = v_unit_baroes, gender = 'M', birth_date = '2011-02-01', deleted_at = NULL WHERE id = v_old_id;
        DELETE FROM members WHERE id = v_new_id;
        v_fixed := v_fixed + 1;
        RAISE NOTICE 'Fixed: Arthur Bueno Amancio da Silva';
    END IF;

    -- ============================================================
    -- NOTE: These 2 members stay soft-deleted (not in official list):
    --   - Letícia Nunes De Bna
    --   - Revine Jnule Santana De Oliveira
    -- ============================================================

    RAISE NOTICE '============================================================';
    RAISE NOTICE '✅ Migration 049 Complete! Fixed % duplicate members', v_fixed;
    RAISE NOTICE '============================================================';
END $$;

-- ============================================================
-- Verification Queries
-- ============================================================

-- Should be 0 duplicates
SELECT name, COUNT(*) as duplicates
FROM members
WHERE deleted_at IS NULL
GROUP BY name
HAVING COUNT(*) > 1;

-- Total active members (should be 55)
SELECT COUNT(*) as total_active FROM members WHERE deleted_at IS NULL;

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

-- Remaining soft-deleted (should only be members truly removed from club)
SELECT name, role, deleted_at
FROM members
WHERE deleted_at IS NOT NULL
ORDER BY name;
