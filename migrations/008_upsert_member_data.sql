-- Data Upsert Script: Import 68 Members
-- Created: 2026-01-02
-- Description: Upsert member data from spreadsheet with birth_date, gender, role, and unit

-- First, let's map unit names to IDs for reference
-- Imperadores, Barões, Imperatrizes, Duquesas, Baronesas, Lokomotiva

-- Upsert members (INSERT or UPDATE based on name)
-- Using ON CONFLICT to handle duplicates

INSERT INTO members (name, birth_date, gender, role, unit_id, is_counselor) VALUES
-- CONSELHEIROS
('BIANCA VIEIRA AMORIM', '2003-07-06', 'F', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), true),
('DANIELA BEZERRA MARQUES', '1982-09-11', 'F', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), true),
('DEBORAH BARRINOVO MARTINS', '2002-08-01', 'F', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), true),
('EDUARDO MARQUES DE OLIVEIRA', '2004-07-02', 'M', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), true),
('EMILLY LIMA DE FRANCA', '2002-04-06', 'F', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), true),
('JANE VIRGÍNIA RAMOS SANTOS DE OLIVEIRA', '1982-10-23', 'F', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), true),
('LAODICÉIA GONÇALVES DIAS DE SOUZA', '1977-02-04', 'F', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), true),
('LARISSA FERREIRA CAMPOS', '2004-10-14', 'F', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), true),
('LUCAS DE ARAUJO TAVARES', '1995-06-11', 'M', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1), true),
('LUISA GABRIELLA DE SOUSA SILVA', '2004-05-30', 'F', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), true),
('MARLON FERREIRA DA SILVA AMORIM', '1976-03-17', 'M', 'CONSELHEIRO', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1), true),

-- DESBRAVADORES
('ANA CLARA DE JESUS PINTO DUARTE', '2015-05-22', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('ANA LUIZA FERREIRA ARRAIS', '2010-01-21', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), false),
('ARTHUR BUENO AMANCIO DA SILVA', '2011-02-01', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1), false),
('ARTHUR DE JESUS PINTO DUARTE', '2013-08-22', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), false),
('CARLOS EDUARDO CARVALHO SILVA FILHO', '2009-07-30', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1), false),
('DAVID DANIEL BEZERRA BARROSO', '2014-10-01', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), false),
('DAVID DANTAS DA SILVA', '2015-08-10', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), false),
('DIANA MENEZES DA SILVA', '2013-03-03', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), false),
('ERIK BUENO PINHEIRO', '2013-10-17', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), false),
('GABRIEL BUENO PINHEIRO', '2011-08-18', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1), false),
('GIOVANNA RAPOSO SANTOS VIDAL', '2009-10-31', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), false),
('HELOYSA APARECIDA FERNANDES', '2013-05-03', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), false),
('ISABELA MENDES BISCAIA', '2014-10-27', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('ISABELLA FERREIRA CAMPOS', '2010-05-06', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), false),
('ITALO RAMOS GALÚCIO', '2012-04-22', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1), false),
('JOSUÉ ARAUJO DE OLIVEIRA', '2010-03-03', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1), false),
('JULIA DE SOUZA FEITOSA', '2010-08-28', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), false),
('KINÉ ROMERO SOW', '2014-08-22', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('LETÍCIA NUNES DE LIMA', '2013-05-25', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), false),
('MANUELA MARQUES DE OLIVEIRA', '2012-06-03', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), false),
('MARCELA DE OLIVEIRA MOTA', '2012-06-27', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), false),
('MARIA HELENA FERNANDES GONÇALVES', '2012-11-12', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), false),
('MATHEUS BARRINOVO MARTINS', '2013-08-19', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), false),
('NICOLLAS GABRIEL BARBOSA DE ALMEIDA', '2013-11-27', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), false),
('PEDRO HENRIQUE APOLINÁRIO FEITOSA', '2009-11-29', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1), false),
('PIETRA GABRIELA VIEIRA DOS SANTOS', '2014-10-07', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('RAFAELLA BORGES DA SILVA', '2010-08-17', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), false),
('REBECCA BUENO AMANCIO DA SILVA', '2012-09-19', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), false),
('REVINE JHULE SANTOS DE OLIVEIRA', '2010-11-22', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), false),
('RICARDO DANIEL JORGE DA SILVA', '2014-03-31', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), false),
('TALINE RAMOS GALÚCIO', '2013-07-21', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), false),
('VITORIA MEL SANTANA DANTAS', '2011-03-15', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), false),
('YASMIM BORGES SILVA', '2013-09-05', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('JOHN RÉVISSON SANTOS DE OLIVEIRA', '2015-11-02', 'M', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), false),
('JULIA LACERDA PEIXOTO', '2015-07-29', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('LÍVIA COSTA SOUSA', '2015-11-14', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('LÍVIA ARAUJO DOS SANTOS', '2016-05-24', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('LORENA VERA DIAS', '2016-05-04', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('CATARINA GONÇALVES FEITOSA', '2016-02-22', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1), false),
('JÚLIA CAROLINA PIRES LIMA', '2009-03-24', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Baronesas' LIMIT 1), false),
('SOPHIA VICTORIA GUTIERREZ LIMA', '2012-10-21', 'F', 'DESBRAVADOR', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1), false),

-- DIRETORES ASSOCIADOS
('TOBIAS FEITOSA DE MATOS', '1985-02-02', 'M', 'DIRETOR ASSOCIADO', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1), false),
('VÂNIA VIEIRA SILVA AMORIM', '1973-04-16', 'F', 'DIRETOR ASSOCIADO', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false),

-- DIRETOR DE CLUBE
('SILAS MELCHIOR DA SILVA MELO', '2002-06-06', 'M', 'DIRETOR DE CLUBE', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false),

-- INSTRUTORES
('ANDRESSA VIEIRA AMORIM', '2007-03-18', 'F', 'INSTRUTOR', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false),
('GUSTAVO MORAIS DOS SANTOS', '2009-03-08', 'M', 'INSTRUTOR', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false),
('HELLEN CRISTINA BARBOSA DE ALMEIDA', '1983-10-15', 'F', 'INSTRUTOR', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false),
('JÚLIA CAROLINA PIRES LIMA', '2009-03-24', 'F', 'INSTRUTOR', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false),
('ROBSON DE ALMEIDA SILVA', '1982-10-19', 'M', 'INSTRUTOR', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false),
('TANIA CRISTINA FERREIRA CAMPOS', '1969-06-29', 'F', 'INSTRUTOR', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false),
('VICTOR LUIS BRITIS BEZERRIL', '2009-06-22', 'M', 'INSTRUTOR', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false),

-- SECRETÁRIO DO CLUBE
('DIANE GONÇALVES DA SILVA FEITOSA', '1984-03-01', 'F', 'SECRETÁRIO DO CLUBE', (SELECT id FROM units WHERE name = 'Lokomotiva' LIMIT 1), false)

ON CONFLICT (name) 
DO UPDATE SET
    birth_date = EXCLUDED.birth_date,
    gender = EXCLUDED.gender,
    role = EXCLUDED.role,
    unit_id = EXCLUDED.unit_id,
    is_counselor = EXCLUDED.is_counselor;

-- Verification query
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN birth_date IS NOT NULL THEN 1 END) as with_birth_date,
    COUNT(CASE WHEN gender IS NOT NULL THEN 1 END) as with_gender,
    COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as with_role
FROM members;

-- Count by role
SELECT 
    role,
    COUNT(*) as count
FROM members
WHERE role IS NOT NULL
GROUP BY role
ORDER BY count DESC;

-- Count by unit
SELECT 
    u.name as unit_name,
    COUNT(m.id) as member_count
FROM units u
LEFT JOIN members m ON u.id = m.unit_id
GROUP BY u.name
ORDER BY member_count DESC;
