-- Migration 014: Create Counselor Logins
-- Created: 2026-01-06
-- Description: Create login credentials for all counselors with RBAC
-- Based on existing members with role='CONSELHEIRO'

-- ============================================
-- BARONESAS (u1) - 3 Conselheiros
-- ============================================

-- Daniela Bezerra Marques
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'daniela_baronesas',
    'Daniela',
    'dan2026',
    'conselheiro',
    'u1',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- Deborah Barrinovo Martins
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'deborah_baronesas',
    'Deborah',
    'deb2026',
    'conselheiro',
    'u1',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- Emilly Lima de Franca
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'emilly_baronesas',
    'Emilly',
    'emi2026',
    'conselheiro',
    'u1',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- ============================================
-- BARÕES (u2) - 2 Conselheiros
-- ============================================

-- Lucas de Araujo Tavares
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'lucas_baroes',
    'Lucas',
    'luc2026',
    'conselheiro',
    'u2',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- Marlon Ferreira da Silva Amorim
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'marlon_baroes',
    'Marlon',
    'mar2026',
    'conselheiro',
    'u2',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- ============================================
-- DUQUESAS (u3) - 2 Conselheiros
-- ============================================

-- Laodicéia Gonçalves Dias de Souza
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'laodiceia_duquesas',
    'Laodicéia',
    'lao2026',
    'conselheiro',
    'u3',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- Luisa Gabriella de Sousa Silva
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'luisa_duquesas',
    'Luisa',
    'lui2026',
    'conselheiro',
    'u3',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- ============================================
-- IMPERADORES (u4) - 1 Conselheiro
-- ============================================

-- Eduardo Marques de Oliveira
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'eduardo_imperadores',
    'Eduardo',
    'edu2026',
    'conselheiro',
    'u4',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- ============================================
-- IMPERATRIZES (u5) - 2 Conselheiros
-- ============================================

-- Bianca Vieira Amorim
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'bianca_imperatrizes',
    'Bianca',
    'bia2026',
    'conselheiro',
    'u5',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- Larissa Ferreira Campos
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'larissa_imperatrizes',
    'Larissa',
    'lar2026',
    'conselheiro',
    'u5',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- ============================================
-- LOKOMOTIVA (u6) - 2 Conselheiros
-- ============================================

-- Hellen Cristina Barbosa de Almeida
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'hellen_lokomotiva',
    'Hellen',
    'hel2026',
    'conselheiro',
    'u6',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- Robson de Almeida Silva
INSERT INTO app_users (id, name, pin, role, unidade_id, must_change_password)
VALUES (
    'robson_lokomotiva',
    'Robson',
    'rob2026',
    'conselheiro',
    'u6',
    false
) ON CONFLICT (id) DO UPDATE SET
    pin = EXCLUDED.pin,
    role = EXCLUDED.role,
    unidade_id = EXCLUDED.unidade_id;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

SELECT 
    app_users.id,
    app_users.name,
    app_users.pin,
    app_users.role,
    app_users.unidade_id,
    units.name as unit_name
FROM app_users
LEFT JOIN units ON app_users.unidade_id = units.id
WHERE app_users.role = 'conselheiro'
ORDER BY units.name, app_users.name;
