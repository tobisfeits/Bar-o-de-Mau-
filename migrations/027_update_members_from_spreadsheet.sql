-- ============================================
-- MIGRATION 027 (FIXED): Update Members from Spreadsheet
-- ============================================
-- This script UPDATES existing members with corrected data
-- ROBUST VERSION: Handles case-insensitive unit matching
-- It PRESERVES: photos, scores, evaluations, IDs
-- It UPDATES: birth_date, role, unit_id, gender

-- ============================================
-- HELPER FUNCTION: Get unit ID safely
-- ============================================

CREATE OR REPLACE FUNCTION get_unit_id_safe(p_unit_name TEXT) 
RETURNS TEXT AS $$
DECLARE
    v_unit_id TEXT;
BEGIN
    -- Try exact match first
    SELECT id INTO v_unit_id 
    FROM units 
    WHERE name = p_unit_name 
    LIMIT 1;
    
    -- If not found, try case-insensitive
    IF v_unit_id IS NULL THEN
        SELECT id INTO v_unit_id 
        FROM units 
        WHERE UPPER(TRIM(name)) = UPPER(TRIM(p_unit_name))
        LIMIT 1;
    END IF;
    
    -- If still not found, raise error
    IF v_unit_id IS NULL THEN
        RAISE EXCEPTION 'Unit not found: %', p_unit_name;
    END IF;
    
    RETURN v_unit_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 1: Update Members (by name match)
-- ============================================

DO $$
DECLARE
    v_unit_id TEXT;
    v_updated_count INTEGER := 0;
    v_not_found_count INTEGER := 0;
    v_error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting member updates...';
    RAISE NOTICE '';

    -- Catarina Gonçalves Feitosa
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2016-02-22', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'CATARINA GONÇALVES FEITOSA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating CATARINA GONÇALVES FEITOSA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Lívia Araújo Dos Santos
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2016-05-24', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'LÍVIA ARAÚJO DOS SANTOS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating LÍVIA ARAÚJO DOS SANTOS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Lorena Vera Dias
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2016-05-04', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'LORENA VERA DIAS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating LORENA VERA DIAS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Ana Clara De Jesus Pinto Duarte
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2015-05-22', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'ANA CLARA DE JESUS PINTO DUARTE';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating ANA CLARA DE JESUS PINTO DUARTE: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- David Dantas Da Silva
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '2015-08-10', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'DAVID DANTAS DA SILVA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating DAVID DANTAS DA SILVA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- John Rêvisson Santos De Oliveira
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '2015-11-02', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'JOHN RÊVISSON SANTOS DE OLIVEIRA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating JOHN RÊVISSON SANTOS DE OLIVEIRA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Julia Lacerda Peixoto
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2015-07-29', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'JULIA LACERDA PEIXOTO';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating JULIA LACERDA PEIXOTO: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Lívia Gomes Sousa
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2015-11-14', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'LÍVIA GOMES SOUSA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating LÍVIA GOMES SOUSA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- David Daniel Bezerra Barroso
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '2014-10-01', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'DAVID DANIEL BEZERRA BARROSO';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating DAVID DANIEL BEZERRA BARROSO: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Isabela Mendes Biscaia
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2014-10-27', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'ISABELA MENDES BISCAIA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating ISABELA MENDES BISCAIA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Kiné Romero Sow
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2014-08-22', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'KINÉ ROMERO SOW';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating KINÉ ROMERO SOW: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Pietra Gabriela Vieira Dos Santos
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2014-10-07', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'PIETRA GABRIELA VIEIRA DOS SANTOS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating PIETRA GABRIELA VIEIRA DOS SANTOS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Ricardo Daniel Jorge Da Silva
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '2014-03-31', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'RICARDO DANIEL JORGE DA SILVA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating RICARDO DANIEL JORGE DA SILVA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Arthur De Jesus Pinto Duarte
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '2013-08-22', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'ARTHUR DE JESUS PINTO DUARTE';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating ARTHUR DE JESUS PINTO DUARTE: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Diana Menezes Da Silva
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2013-03-03', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'DIANA MENEZES DA SILVA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating DIANA MENEZES DA SILVA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Erik Bueno Pinheiro
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '2013-10-17', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'ERIK BUENO PINHEIRO';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating ERIK BUENO PINHEIRO: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Heloysa Aparecida Fernandes
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2013-05-03', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'HELOYSA APARECIDA FERNANDES';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating HELOYSA APARECIDA FERNANDES: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Letícia Nunes De Lima
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2013-05-25', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'LETÍCIA NUNES DE LIMA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating LETÍCIA NUNES DE LIMA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Matheus Barrinovo Martins
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '2013-08-19', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'MATHEUS BARRINOVO MARTINS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating MATHEUS BARRINOVO MARTINS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Nicollas Gabriel Barbosa De Almeida
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '2013-11-27', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'NICOLLAS GABRIEL BARBOSA DE ALMEIDA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating NICOLLAS GABRIEL BARBOSA DE ALMEIDA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Taline Ramos Galúcio
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2013-07-21', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'TALINE RAMOS GALÚCIO';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating TALINE RAMOS GALÚCIO: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Yasmim Borges Silva
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2013-09-05', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'YASMIM BORGES SILVA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating YASMIM BORGES SILVA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Ítalo Ramos Glaucio
    BEGIN
        v_unit_id := get_unit_id_safe('Barões');
        UPDATE members SET birth_date = '2012-04-22', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'ÍTALO RAMOS GLAUCIO';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating ÍTALO RAMOS GLAUCIO: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Manuela Marques De Oliveira
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2012-06-03', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'MANUELA MARQUES DE OLIVEIRA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating MANUELA MARQUES DE OLIVEIRA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Marcela De Oliveira Mota
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2012-06-27', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'MARCELA DE OLIVEIRA MOTA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating MARCELA DE OLIVEIRA MOTA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Maria Helena Fernandes Gonçalves
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2012-11-12', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'MARIA HELENA FERNANDES GONÇALVES';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating MARIA HELENA FERNANDES GONÇALVES: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Rebecca Bueno Amancio Da Silva
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2012-09-19', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'REBECCA BUENO AMANCIO DA SILVA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating REBECCA BUENO AMANCIO DA SILVA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Sophia Victoria Gutierrez Lima
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2012-10-19', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'SOPHIA VICTORIA GUTIERREZ LIMA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating SOPHIA VICTORIA GUTIERREZ LIMA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Gabriel Bueno Pinheiro
    BEGIN
        v_unit_id := get_unit_id_safe('Barões');
        UPDATE members SET birth_date = '2011-08-18', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'GABRIEL BUENO PINHEIRO';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating GABRIEL BUENO PINHEIRO: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Vitoria Mel Santana Dantas
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '2011-02-15', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'VITORIA MEL SANTANA DANTAS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating VITORIA MEL SANTANA DANTAS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Arthur Bueno Amancio Da Silva
    BEGIN
        v_unit_id := get_unit_id_safe('Barões');
        UPDATE members SET birth_date = '2011-02-01', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'ARTHUR BUENO AMANCIO DA SILVA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating ARTHUR BUENO AMANCIO DA SILVA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Isabella Ferreira Campos
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '2010-05-06', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'ISABELLA FERREIRA CAMPOS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating ISABELLA FERREIRA CAMPOS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Josué Araujo De Oliveira
    BEGIN
        v_unit_id := get_unit_id_safe('Barões');
        UPDATE members SET birth_date = '2010-03-03', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'JOSUÉ ARAUJO DE OLIVEIRA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating JOSUÉ ARAUJO DE OLIVEIRA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Julia De Souza Feitosa
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '2010-11-28', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'JULIA DE SOUZA FEITOSA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating JULIA DE SOUZA FEITOSA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Rafaella Borges Da Silva
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '2010-08-17', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'RAFAELLA BORGES DA SILVA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating RAFAELLA BORGES DA SILVA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Revine Jhule Santos De Oliveira
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '2010-11-22', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'REVINE JHULE SANTOS DE OLIVEIRA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating REVINE JHULE SANTOS DE OLIVEIRA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Ana Luiza Ferreira Arrais
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '2010-01-21', role = 'INSTRUTOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'ANA LUIZA FERREIRA ARRAIS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating ANA LUIZA FERREIRA ARRAIS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Carlos Eduardo Carvalho Silva Filho
    BEGIN
        v_unit_id := get_unit_id_safe('Barões');
        UPDATE members SET birth_date = '2009-07-30', role = 'DESBRAVADOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'CARLOS EDUARDO CARVALHO SILVA FILHO';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating CARLOS EDUARDO CARVALHO SILVA FILHO: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Giovanna Raposo Santos Vidal
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '2009-10-31', role = 'INSTRUTOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'GIOVANNA RAPOSO SANTOS VIDAL';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating GIOVANNA RAPOSO SANTOS VIDAL: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Júlia Carolina Pires Lima
    BEGIN
        v_unit_id := get_unit_id_safe('Lokomotiva');
        UPDATE members SET birth_date = '2009-03-24', role = 'INSTRUTOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'JÚLIA CAROLINA PIRES LIMA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating JÚLIA CAROLINA PIRES LIMA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Victor Luis Britis Bezerril
    BEGIN
        v_unit_id := get_unit_id_safe('Lokomotiva');
        UPDATE members SET birth_date = '2009-06-22', role = 'INSTRUTOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'VICTOR LUIS BRITIS BEZERRIL';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating VICTOR LUIS BRITIS BEZERRIL: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Eduardo Marques De Oliveira
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '2004-07-01', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'EDUARDO MARQUES DE OLIVEIRA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating EDUARDO MARQUES DE OLIVEIRA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Larissa Ferreira Campos
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2004-04-14', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'LARISSA FERREIRA CAMPOS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating LARISSA FERREIRA CAMPOS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Luisa Gabriella De Sousa Silva
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '2004-05-30', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'LUISA GABRIELLA DE SOUSA SILVA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating LUISA GABRIELLA DE SOUSA SILVA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Bianca Vieira Amorim
    BEGIN
        v_unit_id := get_unit_id_safe('Imperatrizes');
        UPDATE members SET birth_date = '2003-07-06', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'BIANCA VIEIRA AMORIM';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating BIANCA VIEIRA AMORIM: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Deborah Barrinovo Martins
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '2002-08-01', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'DEBORAH BARRINOVO MARTINS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating DEBORAH BARRINOVO MARTINS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Emilly Lima De Franca
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '2002-04-06', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'EMILLY LIMA DE FRANCA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating EMILLY LIMA DE FRANCA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Silas Melchior Da Silva Melo
    BEGIN
        v_unit_id := get_unit_id_safe('Lokomotiva');
        UPDATE members SET birth_date = '2002-06-06', role = 'DIRETOR DE CLUBE', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'SILAS MELCHIOR DA SILVA MELO';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating SILAS MELCHIOR DA SILVA MELO: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Lucas De Araujo Tavares
    BEGIN
        v_unit_id := get_unit_id_safe('Barões');
        UPDATE members SET birth_date = '1995-06-11', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'LUCAS DE ARAUJO TAVARES';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating LUCAS DE ARAUJO TAVARES: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Tobias Feitosa De Matos
    BEGIN
        v_unit_id := get_unit_id_safe('Imperadores');
        UPDATE members SET birth_date = '1985-02-02', role = 'DIRETOR ASSOCIADO', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'TOBIAS FEITOSA DE MATOS';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating TOBIAS FEITOSA DE MATOS: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Diane Gonçalves Da Silva Feitosa
    BEGIN
        v_unit_id := get_unit_id_safe('Lokomotiva');
        UPDATE members SET birth_date = '1984-03-01', role = 'SECRETÁRIO DO CLUBE', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'DIANE GONÇALVES DA SILVA FEITOSA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating DIANE GONÇALVES DA SILVA FEITOSA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Hellen Cristina Barbosa De Almeida
    BEGIN
        v_unit_id := get_unit_id_safe('Lokomotiva');
        UPDATE members SET birth_date = '1983-10-15', role = 'INSTRUTOR', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'HELLEN CRISTINA BARBOSA DE ALMEIDA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating HELLEN CRISTINA BARBOSA DE ALMEIDA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Daniela Bezerra Marques
    BEGIN
        v_unit_id := get_unit_id_safe('Baronesas');
        UPDATE members SET birth_date = '1982-09-11', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'DANIELA BEZERRA MARQUES';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating DANIELA BEZERRA MARQUES: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Jane Virgínia Ramos Santos De Oliveira
    BEGIN
        v_unit_id := get_unit_id_safe('Lokomotiva');
        UPDATE members SET birth_date = '1982-10-23', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'JANE VIRGÍNIA RAMOS SANTOS DE OLIVEIRA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating JANE VIRGÍNIA RAMOS SANTOS DE OLIVEIRA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Robson De Almeida Silva
    BEGIN
        v_unit_id := get_unit_id_safe('Lokomotiva');
        UPDATE members SET birth_date = '1982-10-19', role = 'INSTRUTOR', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'ROBSON DE ALMEIDA SILVA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating ROBSON DE ALMEIDA SILVA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Laodicéia Gonçalves Dias De Souza
    BEGIN
        v_unit_id := get_unit_id_safe('Duquesas');
        UPDATE members SET birth_date = '1977-02-04', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'LAODICÉIA GONÇALVES DIAS DE SOUZA';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating LAODICÉIA GONÇALVES DIAS DE SOUZA: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Marlon Ferreira Da Silva Amorim
    BEGIN
        v_unit_id := get_unit_id_safe('Barões');
        UPDATE members SET birth_date = '1976-03-17', role = 'CONSELHEIRO', unit_id = v_unit_id, gender = 'M'
        WHERE name = 'MARLON FERREIRA DA SILVA AMORIM';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating MARLON FERREIRA DA SILVA AMORIM: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    -- Vânia Vieira Silva Amorim
    BEGIN
        v_unit_id := get_unit_id_safe('Lokomotiva');
        UPDATE members SET birth_date = '1973-04-16', role = 'DIRETOR ASSOCIADO', unit_id = v_unit_id, gender = 'F'
        WHERE name = 'VÂNIA VIEIRA SILVA AMORIM';
        IF FOUND THEN v_updated_count := v_updated_count + 1; ELSE v_not_found_count := v_not_found_count + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error updating VÂNIA VIEIRA SILVA AMORIM: %', SQLERRM;
        v_error_count := v_error_count + 1;
    END;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Update complete!';
    RAISE NOTICE 'Updated: % members', v_updated_count;
    RAISE NOTICE 'Not found: % members', v_not_found_count;
    RAISE NOTICE 'Errors: % members', v_error_count;
    
    IF v_not_found_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  Some members were not found - they may need to be added manually';
    END IF;
    
    IF v_error_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ Some updates failed - check error messages above';
    END IF;
END $$;

-- ============================================
-- STEP 2: Cleanup helper function
-- ============================================

DROP FUNCTION IF EXISTS get_unit_id_safe(TEXT);

-- ============================================
-- STEP 3: Verify Updates
-- ============================================

SELECT 
    'Verification: Members by Role' as check_name,
    role,
    COUNT(*) as count
FROM members
GROUP BY role
ORDER BY count DESC;

SELECT 
    'Verification: Members by Unit' as check_name,
    u.name as unit,
    COUNT(*) as count
FROM members m
JOIN units u ON m.unit_id = u.id
GROUP BY u.name
ORDER BY u.name;
