-- Migration 004: Create conselheiro user accounts
-- Created: 2026-01-02
-- Description: Creates user accounts for all conselheiros before assigning them to units

-- Insert conselheiros for Baronesa
INSERT INTO app_users (id, name, must_change_password, role, unidade_id)
VALUES 
  ('c1', 'Daniela', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Baronesa' LIMIT 1)),
  ('c2', 'Deborah', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Baronesa' LIMIT 1)),
  ('c3', 'Emilly', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Baronesa' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Insert conselheiros for Duquesas
INSERT INTO app_users (id, name, must_change_password, role, unidade_id)
VALUES 
  ('c4', 'Laodicéia', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1)),
  ('c5', 'Luisa', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Duquesas' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Insert conselheiros for Imperatrizes
INSERT INTO app_users (id, name, must_change_password, role, unidade_id)
VALUES 
  ('c6', 'Bianca', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1)),
  ('c7', 'Larissa', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Imperatrizes' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Insert conselheiros for Barões
INSERT INTO app_users (id, name, must_change_password, role, unidade_id)
VALUES 
  ('c8', 'Lucas', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1)),
  ('c9', 'Marlon', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Barões' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Insert conselheiros for Imperadores
INSERT INTO app_users (id, name, must_change_password, role, unidade_id)
VALUES 
  ('c10', 'Eduardo', false, 'conselheiro', (SELECT id FROM units WHERE name = 'Imperadores' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Verification query
SELECT 
  u.id,
  u.name as conselheiro,
  u.role,
  un.name as unidade
FROM app_users u
LEFT JOIN units un ON u.unidade_id = un.id
WHERE u.role IN ('super_admin', 'conselheiro')
ORDER BY un.name, u.name;
