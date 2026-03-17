-- Migration 002: Populate conselheiros with their respective units
-- Created: 2026-01-02
-- Description: Maps all conselheiros to their units based on the provided specification
-- Note: unidade_id is TEXT type to match units(id)

-- Baronesa: Daniela, Deborah, Emilly
UPDATE app_users 
SET role = 'conselheiro', 
    unidade_id = (SELECT id FROM units WHERE name = 'Baronesa' LIMIT 1)
WHERE name IN ('Daniela', 'Deborah', 'Emilly');

-- Duquesas: Laodicéia, Luisa
UPDATE app_users 
SET role = 'conselheiro', 
    unidade_id = (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1)
WHERE name IN ('Laodicéia', 'Luisa');

-- Imperatrizes: Bianca, Larissa
UPDATE app_users 
SET role = 'conselheiro', 
    unidade_id = (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1)
WHERE name IN ('Bianca', 'Larissa');

-- Barões: Lucas, Marlon
UPDATE app_users 
SET role = 'conselheiro', 
    unidade_id = (SELECT id FROM units WHERE name = 'Barões' LIMIT 1)
WHERE name IN ('Lucas', 'Marlon');

-- Imperadores: Eduardo, Tobias
UPDATE app_users 
SET role = 'conselheiro', 
    unidade_id = (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1)
WHERE name IN ('Eduardo');

-- Note: Tobias is already set as super_admin in migration 001

-- Verification query
SELECT 
  u.name as conselheiro,
  u.role,
  un.name as unidade
FROM app_users u
LEFT JOIN units un ON u.unidade_id = un.id
WHERE u.role IN ('super_admin', 'conselheiro')
ORDER BY un.name, u.name;
