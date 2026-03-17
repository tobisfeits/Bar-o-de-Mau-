-- ============================================
-- POPULAR DADOS INICIAIS NO SUPABASE
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Inserir usuários do sistema
INSERT INTO app_users (id, name, pin) VALUES
    ('u1', 'Diane', 'dia2026'),
    ('u2', 'Silas', 'sil2026'),
    ('u3', 'Vânia', 'vân2026'),
    ('u4', 'Tobias', 'tob2026')
ON CONFLICT (id) DO NOTHING;

-- Inserir unidades
INSERT INTO units (id, name, logo) VALUES
    ('u1', 'Barões', 'logo_baroes.png'),
    ('u2', 'Baronesa', 'logo_baronesa.png'),
    ('u3', 'Duquesas', 'logo_duquesas.png'),
    ('u4', 'Imperadores', 'logo_imperadores.jpg'),
    ('u5', 'Imperatrizes', 'logo_imperatrizes.png'),
    ('u6', 'Lokomotiva', 'logo_lokomotiva.png')
ON CONFLICT (id) DO NOTHING;

-- Inserir membros (57 desbravadores)
INSERT INTO members (id, name, unit_id, image, is_counselor) VALUES
    -- Barões (8 membros)
    ('m1', 'JOSUÉ ARAUJO DE OLIVEIRA', 'u1', null, false),
    ('m2', 'ARTHUR BUENO AMANCIO DA SILVA', 'u1', null, false),
    ('m3', 'CARLOS EDUARDO CARVALHO SILVA FILHO', 'u1', null, false),
    ('m4', 'GABRIEL BUENO PINHEIRO', 'u1', null, false),
    ('m5', 'ITALO RAMOS GALÚCIO', 'u1', null, false),
    ('m6', 'LUCAS DE ARAUJO TAVARES', 'u1', null, true),
    ('m7', 'MARLON FERREIRA DA SILVA AMORIM', 'u1', null, true),
    ('m8', 'PEDRO HENRIQUE APOLINÁRIO FEITOSA', 'u1', null, false),
    
    -- Baronesa (10 membros)
    ('m9', 'ANA LUIZA FERREIRA ARRAIS', 'u2', null, false),
    ('m10', 'DANIELA BEZERRA MARQUES', 'u2', null, true),
    ('m11', 'DEBORAH BARRINOVO MARTINS', 'u2', null, true),
    ('m12', 'EMILLY LIMA DE FRANCA', 'u2', null, true),
    ('m13', 'GIOVANNA RAPOSO SANTOS VIDAL', 'u2', null, false),
    ('m14', 'ISABELLA FERREIRA CAMPOS', 'u2', null, false),
    ('m15', 'JULIA DE SOUZA FEITOSA', 'u2', null, false),
    ('m16', 'RAFAELLA BORGES DA SILVA', 'u2', null, false),
    ('m17', 'REVINE JHULE SANTOS DE OLIVEIRA', 'u2', null, false),
    ('m18', 'VITORIA MEL SANTANA DANTAS', 'u2', null, false),
    
    -- Duquesas (11 membros)
    ('m19', 'DIANA MENEZES DA SILVA', 'u3', null, false),
    ('m20', 'HELOYSA APARECIDA FERNANDES', 'u3', null, false),
    ('m21', 'LAODICÉIA GONÇALVES DIAS DE SOUZA', 'u3', null, true),
    ('m22', 'LETÍCIA NUNES DE LIMA', 'u3', null, false),
    ('m23', 'LUISA GABRIELLA DE SOUSA SILVA', 'u3', null, true),
    ('m24', 'MANUELA MARQUES DE OLIVEIRA', 'u3', null, false),
    ('m25', 'MARCELA DE OLIVEIRA MOTA', 'u3', null, false),
    ('m26', 'MARIA HELENA FERNANDES GONÇALVES', 'u3', null, false),
    ('m27', 'REBECCA BUENO AMANCIO DA SILVA', 'u3', null, false),
    ('m28', 'SOPHIA VICTORIA GUTIERREZ LIMA', 'u3', null, false),
    ('m29', 'TALINE RAMOS GALÚCIO', 'u3', null, false),
    
    -- Imperadores (9 membros)
    ('m30', 'ARTHUR DE JESUS PINTO DUARTE', 'u4', null, false),
    ('m31', 'DAVID DANIEL BEZERRA BARROSO', 'u4', null, false),
    ('m32', 'DAVID DANTAS DA SILVA', 'u4', null, false),
    ('m33', 'EDUARDO MARQUES DE OLIVEIRA', 'u4', null, true),
    ('m34', 'ERIK BUENO PINHEIRO', 'u4', null, false),
    ('m35', 'MATHEUS BARRINOVO MARTINS', 'u4', null, false),
    ('m36', 'NICOLLAS GABRIEL BARBOSA DE ALMEIDA', 'u4', null, false),
    ('m37', 'RICARDO DANIEL JORGE DA SILVA', 'u4', null, false),
    ('m38', 'TOBIAS FEITOSA DE MATOS', 'u4', 'tobias_matos.jpg', true),
    
    -- Imperatrizes (8 membros)
    ('m39', 'ANA CLARA DE JESUS PINTO DUARTE', 'u5', null, false),
    ('m40', 'BIANCA VIEIRA AMORIM', 'u5', null, true),
    ('m41', 'ISABELA MENDES BISCAIA', 'u5', null, false),
    ('m42', 'JÚLIA CAROLINA PIRES LIMA', 'u5', null, false),
    ('m43', 'KINÉ ROMERO SOW', 'u5', null, false),
    ('m44', 'LARISSA FERREIRA CAMPOS', 'u5', null, true),
    ('m45', 'PIETRA GABRIELA VIEIRA DOS SANTOS', 'u5', 'pietra_santos.jpg', false),
    ('m46', 'YASMIM BORGES SILVA', 'u5', null, false),
    
    -- Lokomotiva (11 membros)
    ('m47', 'ANDRESSA VIEIRA AMORIM', 'u6', null, false),
    ('m48', 'DIANE GONÇALVES DA SILVA FEITOSA', 'u6', null, false),
    ('m49', 'GUSTAVO MORAIS DOS SANTOS', 'u6', null, false),
    ('m50', 'HELLEN CRISTINA BARBOSA DE ALMEIDA', 'u6', null, false),
    ('m51', 'JANE VIRGÍNIA RAMOS SANTOS DE OLIVEIRA', 'u6', null, false),
    ('m52', 'RAMIA BRAGA DE OLIVEIRA', 'u6', null, false),
    ('m53', 'ROBSON DE ALMEIDA SILVA', 'u6', null, false),
    ('m54', 'SILAS MELCHIOR DA SILVA MELO', 'u6', null, false),
    ('m55', 'TANIA CRISTINA FERREIRA CAMPOS', 'u6', null, false),
    ('m56', 'VÂNIA VIEIRA SILVA AMORIM', 'u6', null, false),
    ('m57', 'VICTOR LUIS BRITIS BEZERRIL', 'u6', null, false)
ON CONFLICT (id) DO NOTHING;

-- Verificar quantos registros foram inseridos
SELECT 'Usuários inseridos:' as tabela, COUNT(*) as total FROM app_users
UNION ALL
SELECT 'Unidades inseridas:', COUNT(*) FROM units
UNION ALL
SELECT 'Desbravadores inseridos:', COUNT(*) FROM members
UNION ALL
SELECT 'Conselheiros inseridos:', COUNT(*) FROM members WHERE is_counselor = true;
