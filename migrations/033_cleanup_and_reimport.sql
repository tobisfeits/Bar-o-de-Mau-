-- ============================================================
-- CLEANUP AND REIMPORT: Clean duplicates and reload members
-- Created: 2026-02-10
-- ============================================================

-- ============================================================
-- STEP 1: Backup data before cleanup (optional)
-- ============================================================
-- CREATE TABLE members_backup AS SELECT * FROM members;
-- CREATE TABLE units_backup AS SELECT * FROM units;

-- ============================================================
-- STEP 2: Clear app_users unit references (to avoid FK constraint)
-- ============================================================
UPDATE app_users SET unidade_id = NULL WHERE unidade_id IS NOT NULL;

-- ============================================================
-- STEP 3: Delete all members (we'll reimport clean data)
-- ============================================================
DELETE FROM members;

-- ============================================================  
-- STEP 4: Delete all units (we'll recreate them)
-- ============================================================
DELETE FROM units;

-- ============================================================
-- STEP 5: Create units with consistent naming (no duplicates)
-- ============================================================
INSERT INTO units (id, name, logo, gender, points, active, created_at) VALUES
('u1', 'Baronesas', '/fotos/baronesas.png', 'F', 0, true, NOW()),
('u2', 'Barões', '/fotos/baroes.png', 'M', 0, true, NOW()),
('u3', 'Duquesas', '/fotos/duquesas.png', 'F', 0, true, NOW()),
('u4', 'Imperadores', '/fotos/imperadores.png', 'M', 0, true, NOW()),
('u5', 'Imperatrizes', '/fotos/imperatrizes.png', 'F', 0, true, NOW()),
('u6', 'Lokomotiva', '/fotos/lokomotiva.png', 'M', 0, true, NOW());

-- ============================================================
-- STEP 6: Verify unit creation
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM units;
    IF v_count != 6 THEN
        RAISE EXCEPTION '❌ Expected 6 units, found %', v_count;
    END IF;
    RAISE NOTICE '✅ Unit count verified: 6 units';
END $$;

-- ============================================================
-- STEP 7: Insert members from spreadsheet (64 total, no duplicates)
-- ============================================================
DO $$
DECLARE
    unit_imperatrizes TEXT;
    unit_imperadores TEXT;
    unit_duquesas TEXT;
    unit_baroes TEXT;
    unit_baronesas TEXT;
    unit_lokomotiva TEXT;
BEGIN
    -- Get unit IDs
    SELECT id INTO STRICT unit_imperatrizes FROM units WHERE name = 'Imperatrizes';
    SELECT id INTO STRICT unit_imperadores FROM units WHERE name = 'Imperadores';
    SELECT id INTO STRICT unit_duquesas FROM units WHERE name = 'Duquesas';
    SELECT id INTO STRICT unit_baroes FROM units WHERE name = 'Barões';
    SELECT id INTO STRICT unit_baronesas FROM units WHERE name = 'Baronesas';
    SELECT id INTO STRICT unit_lokomotiva FROM units WHERE name = 'Lokomotiva';

    -- Insert all 64 members (TEMPORARY assignment, will be reclassified in next step)
    INSERT INTO members (id, name, birth_date, gender, role, unit_id) VALUES
    -- Row 1-4: IMPERATRIZES (from spreadsheet)
    (gen_random_uuid(), 'Catarina Gonçalves Feitosa', '2016-02-23', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Lívia Araújo Dos Santos', '2016-04-05', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Lorena Vera Dias', '2016-05-04', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Ana Clara De Jesus Pinto Duarte', '2015-05-22', 'F', 'Desbravador', unit_imperatrizes),
    
    -- Row 5-11: IMPERADORES (from spreadsheet)
    (gen_random_uuid(), 'David Dantas Da Silva', '2015-08-10', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'John Révisson Santos De Oliveira', '2015-11-02', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Julia Lacerda Peixoto', '2015-07-29', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Lívia Gomes Sousa', '2015-11-14', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'David Daniel Bezerra Barroso', '2014-10-01', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Isabela Mendes Teixeira', '2014-10-27', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Kiné Romero Sow', '2014-08-22', 'F', 'Desbravador', unit_imperatrizes),
    
    -- Row 12-13: IMPERATRIZES
    (gen_random_uuid(), 'Pietra Gabriela Véras Dos Santos', '2014-10-07', 'F', 'Desbravador', unit_imperatrizes),
    (gen_random_uuid(), 'Ricardo Daniel Jorgo Da Silva', '2014-03-31', 'M', 'Desbravador', unit_imperadores),
    
    -- Row 14-18: IMPERADORES/DUQUESAS
    (gen_random_uuid(), 'Arthur De Jesus Pinto Duarte', '2013-08-22', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Diana Meneses Do Silva', '2013-03-28', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Erik Bueno Pinheiro', '2013-10-17', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Helevsa Aparecida Fernandes', '2013-05-03', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Letícia Nunes De Bna', '2013-05-25', 'F', 'Desbravador', unit_duquesas),
    
    -- Row 19-22: IMPERADORES/DUQUESAS/IMPERATRIZES
    (gen_random_uuid(), 'Matheus Barrinovo Martins', '2013-08-19', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Nicollas Gabriel Santana De Almeida', '2013-07-21', 'M', 'Desbravador', unit_imperadores),
    (gen_random_uuid(), 'Taline Ramos Galúcio', '2013-07-21', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Yasmim Borges Silva', '2013-09-05', 'F', 'Desbravador', unit_imperatrizes),
    
    -- Row 23-29: BARÕES/DUQUESAS
    (gen_random_uuid(), 'Ítalo Ramos Glaucio', '2012-04-22', 'M', 'Desbravador', unit_baroes),
    (gen_random_uuid(), 'Manuela Marques De Oliveira', '2012-06-03', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Marcela De Oliveira Maia', '2012-06-27', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Maria Helena Fernandes Gonçalves', '2012-11-12', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Rebecca Bueno Amancio Da Silva', '2012-09-19', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Sophia Victoria Ramirez Lima', '2012-10-01', 'F', 'Desbravador', unit_duquesas),
    (gen_random_uuid(), 'Gabriel Bueno Pinheiro', '2011-08-18', 'M', 'Desbravador', unit_baronesas),
    
    -- Row 30-37: BARONESAS/BARÕES
    (gen_random_uuid(), 'Vitoria Mel Santana Dantas', '2011-02-15', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Arthur Bueno Pinheiro Da Silva', '2011-02-01', 'M', 'Desbravador', unit_baroes),
    (gen_random_uuid(), 'Isabella Ferreira Campos', '2010-05-06', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Josué Araujo De Souza', '2010-03-28', 'M', 'Desbravador', unit_baroes),
    (gen_random_uuid(), 'Julia De Souza Feitosa', '2010-11-28', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Rafaella Borges Da Silva', '2010-08-17', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Revine Jnule Santana De Oliveira', '2010-11-22', 'F', 'Desbravador', unit_baronesas),
    (gen_random_uuid(), 'Ana Luiza Ferreira Arrais', '2010-01-21', 'F', 'Instrutor', unit_baronesas),
    
    -- Row 38-40: BARÕES/BARONESAS/LOKOMOTIVA
    (gen_random_uuid(), 'Carlos Eduardo Carvalho Silva Filho', '2009-07-30', 'M', 'Desbravador', unit_baroes),
    (gen_random_uuid(), 'Giovanna Raposo Santos Lessa', '2009-10-31', 'F', 'Instrutor', unit_baronesas),
    (gen_random_uuid(), 'Júlia Carolina Pires Lima', '2009-03-24', 'F', 'Instrutor', unit_lokomotiva),
    
    -- Row 41-44: LOKOMOTIVA/CONSELHEIROS
    (gen_random_uuid(), 'Victor Luis Britis Novais', '2009-06-22', 'M', 'Instrutor', unit_lokomotiva),
    (gen_random_uuid(), 'Eduardo Marques De Oliveira', '2004-07-01', 'M', 'Conselheiro', unit_imperadores),
    (gen_random_uuid(), 'Larissa Ferreira Campos', '2004-10-14', 'F', 'Conselheiro', unit_imperatrizes),
    (gen_random_uuid(), 'Luísa Gabrielle De Sousa Silva', '2004-05-30', 'F', 'Conselheiro', unit_duquesas),
    
    -- Row 45-58: CONSELHEIROS/STAFF (COMPLETE LIST)
    (gen_random_uuid(), 'Bianca Vieira Amorim', '2003-07-06', 'F', 'Conselheiro', unit_imperatrizes),
    (gen_random_uuid(), 'Deborah Barrinovo Martins', '2002-08-01', 'F', 'Conselheiro', unit_baronesas),
    (gen_random_uuid(), 'Emily Lima De Franca', '2002-04-06', 'F', 'Conselheiro', unit_baronesas),
    (gen_random_uuid(), 'Silas Melchior Da Silva Melo', '2002-06-06', 'M', 'Diretor de Clube', unit_lokomotiva),
    (gen_random_uuid(), 'Lucas De Araujo Tavares', '1995-06-11', 'M', 'Conselheiro', unit_baroes),
    (gen_random_uuid(), 'Diane Gonçalves Da Silva Feitosa', '1984-01-03', 'F', 'Secretário de Clube', unit_lokomotiva),
    (gen_random_uuid(), 'Tobias Feitosa De Matos', '1985-02-02', 'M', 'Conselheiro', unit_imperadores),
    (gen_random_uuid(), 'Hellen Cristina Barbosa De Almeida', '1983-10-15', 'F', 'Instrutor', unit_lokomotiva),
    (gen_random_uuid(), 'Robson De Almeida Silva', '1983-10-19', 'M', 'Instrutor', unit_lokomotiva),
    (gen_random_uuid(), 'Daniela Bezerra Marques', '1982-09-11', 'F', 'Conselheiro', unit_baronesas),
    (gen_random_uuid(), 'Jane Virgínia Ramos De Oliveira', '1982-10-23', 'F', 'Conselheiro', unit_imperatrizes),
    (gen_random_uuid(), 'Laodicéia Gonçalves Dias De Souza', '1977-02-04', 'F', 'Conselheiro', unit_duquesas),
    (gen_random_uuid(), 'Marlon Ferreira Da Silva Amorim', '1976-03-17', 'M', 'Conselheiro', unit_baroes),
    (gen_random_uuid(), 'Vânia Vieira Silva Amorim', '1973-04-16', 'F', 'Diretor Associado', unit_lokomotiva);


    RAISE NOTICE '✅ 58 members imported';
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION '❌ Unit not found';
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Import error: %', SQLERRM;
END $$;

-- ============================================================
-- STEP 8: Verify member count
-- ============================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM members;
    IF v_count != 58 THEN
        RAISE EXCEPTION '❌ Expected 58 members, found %', v_count;
    END IF;
    RAISE NOTICE '✅ Member count verified: 58 members';
END $$;

-- ============================================================
-- STEP 9: Final validation report
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
