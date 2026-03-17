-- ============================================
-- BARÃO DE MAUÁ - SUPABASE DATABASE SCHEMA
-- Sistema de Pontuação de Desbravadores
-- ============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: units (Unidades)
-- ============================================
CREATE TABLE units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por nome
CREATE INDEX idx_units_name ON units(name);

-- ============================================
-- TABELA: members (Desbravadores)
-- ============================================
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    image TEXT,
    is_counselor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_members_unit_id ON members(unit_id);
CREATE INDEX idx_members_is_counselor ON members(is_counselor);
CREATE INDEX idx_members_name ON members(name);

-- ============================================
-- TABELA: scores (Pontuações dos Desbravadores)
-- ============================================
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_absent BOOLEAN DEFAULT FALSE,
    items JSONB NOT NULL DEFAULT '{}',
    created_by TEXT,
    created_by_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, date)
);

-- Índices
CREATE INDEX idx_scores_member_id ON scores(member_id);
CREATE INDEX idx_scores_date ON scores(date);
CREATE INDEX idx_scores_created_by_id ON scores(created_by_id);

-- ============================================
-- TABELA: counselor_scores (Avaliações de Conselheiros)
-- ============================================
CREATE TABLE counselor_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counselor_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '{}',
    created_by TEXT,
    created_by_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(counselor_id, date)
);

-- Índices
CREATE INDEX idx_counselor_scores_counselor_id ON counselor_scores(counselor_id);
CREATE INDEX idx_counselor_scores_date ON counselor_scores(date);

-- ============================================
-- TABELA: app_users (Usuários do Sistema)
-- ============================================
CREATE TABLE app_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counselor_scores_updated_at BEFORE UPDATE ON counselor_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselor_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE SEGURANÇA
-- ============================================

-- UNITS: Leitura pública, escrita autenticada
CREATE POLICY "Allow public read access on units"
    ON units FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on units"
    ON units FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on units"
    ON units FOR UPDATE
    USING (true);

-- MEMBERS: Leitura pública, escrita autenticada
CREATE POLICY "Allow public read access on members"
    ON members FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on members"
    ON members FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on members"
    ON members FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on members"
    ON members FOR DELETE
    USING (true);

-- SCORES: Leitura pública, escrita autenticada
CREATE POLICY "Allow public read access on scores"
    ON scores FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on scores"
    ON scores FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on scores"
    ON scores FOR UPDATE
    USING (true);

-- COUNSELOR_SCORES: Leitura pública, escrita autenticada
CREATE POLICY "Allow public read access on counselor_scores"
    ON counselor_scores FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on counselor_scores"
    ON counselor_scores FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on counselor_scores"
    ON counselor_scores FOR UPDATE
    USING (true);

-- APP_USERS: Apenas leitura pública (segurança!)
CREATE POLICY "Allow public read access on app_users"
    ON app_users FOR SELECT
    USING (true);

-- ============================================
-- DADOS INICIAIS (SEED)
-- ============================================

-- Inserir usuários
INSERT INTO app_users (id, name, pin) VALUES
    ('u1', 'Diane', 'dia2026'),
    ('u2', 'Silas', 'sil2026'),
    ('u3', 'Vânia', 'vân2026'),
    ('u4', 'Tobias', 'tob2026');

-- Inserir unidades
INSERT INTO units (id, name, logo) VALUES
    ('u1', 'Barões', 'logo_baroes.png'),
    ('u2', 'Baronesa', 'logo_baronesa.png'),
    ('u3', 'Duquesas', 'logo_duquesas.png'),
    ('u4', 'Imperadores', 'logo_imperadores.jpg'),
    ('u5', 'Imperatrizes', 'logo_imperatrizes.png'),
    ('u6', 'Lokomotiva', 'logo_lokomotiva.png');

-- Inserir membros (57 desbravadores)
INSERT INTO members (id, name, unit_id, image, is_counselor) VALUES
    -- Barões
    ('m1', 'JOSUÉ ARAUJO DE OLIVEIRA', 'u1', null, false),
    ('m2', 'ARTHUR BUENO AMANCIO DA SILVA', 'u1', null, false),
    ('m3', 'CARLOS EDUARDO CARVALHO SILVA FILHO', 'u1', null, false),
    ('m4', 'GABRIEL BUENO PINHEIRO', 'u1', null, false),
    ('m5', 'ITALO RAMOS GALÚCIO', 'u1', null, false),
    ('m6', 'LUCAS DE ARAUJO TAVARES', 'u1', null, true),
    ('m7', 'MARLON FERREIRA DA SILVA AMORIM', 'u1', null, true),
    ('m8', 'PEDRO HENRIQUE APOLINÁRIO FEITOSA', 'u1', null, false),
    
    -- Baronesa
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
    
    -- Duquesas
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
    
    -- Imperadores
    ('m30', 'ARTHUR DE JESUS PINTO DUARTE', 'u4', null, false),
    ('m31', 'DAVID DANIEL BEZERRA BARROSO', 'u4', null, false),
    ('m32', 'DAVID DANTAS DA SILVA', 'u4', null, false),
    ('m33', 'EDUARDO MARQUES DE OLIVEIRA', 'u4', null, true),
    ('m34', 'ERIK BUENO PINHEIRO', 'u4', null, false),
    ('m35', 'MATHEUS BARRINOVO MARTINS', 'u4', null, false),
    ('m36', 'NICOLLAS GABRIEL BARBOSA DE ALMEIDA', 'u4', null, false),
    ('m37', 'RICARDO DANIEL JORGE DA SILVA', 'u4', null, false),
    ('m38', 'TOBIAS FEITOSA DE MATOS', 'u4', 'tobias_matos.jpg', true),
    
    -- Imperatrizes
    ('m39', 'ANA CLARA DE JESUS PINTO DUARTE', 'u5', null, false),
    ('m40', 'BIANCA VIEIRA AMORIM', 'u5', null, true),
    ('m41', 'ISABELA MENDES BISCAIA', 'u5', null, false),
    ('m42', 'JÚLIA CAROLINA PIRES LIMA', 'u5', null, false),
    ('m43', 'KINÉ ROMERO SOW', 'u5', null, false),
    ('m44', 'LARISSA FERREIRA CAMPOS', 'u5', null, true),
    ('m45', 'PIETRA GABRIELA VIEIRA DOS SANTOS', 'u5', 'pietra_santos.jpg', false),
    ('m46', 'YASMIM BORGES SILVA', 'u5', null, false),
    
    -- Lokomotiva
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
    ('m57', 'VICTOR LUIS BRITIS BEZERRIL', 'u6', null, false);

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Membros com informações da unidade
CREATE OR REPLACE VIEW members_with_units AS
SELECT 
    m.*,
    u.name as unit_name,
    u.logo as unit_logo
FROM members m
JOIN units u ON m.unit_id = u.id;

-- View: Ranking de conselheiros (exemplo para hoje)
CREATE OR REPLACE VIEW counselor_ranking_today AS
SELECT 
    m.id,
    m.name,
    m.unit_id,
    u.name as unit_name,
    cs.items,
    cs.created_by,
    cs.created_at
FROM members m
JOIN units u ON m.unit_id = u.id
LEFT JOIN counselor_scores cs ON m.id = cs.counselor_id AND cs.date = CURRENT_DATE
WHERE m.is_counselor = true
ORDER BY m.name;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE units IS 'Unidades do clube de desbravadores';
COMMENT ON TABLE members IS 'Desbravadores cadastrados';
COMMENT ON TABLE scores IS 'Pontuações diárias dos desbravadores';
COMMENT ON TABLE counselor_scores IS 'Avaliações dos conselheiros';
COMMENT ON TABLE app_users IS 'Usuários do sistema';

-- ============================================
-- FIM DO SCHEMA
-- ============================================
