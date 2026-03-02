-- ============================================================
-- Migration 053: Add Ana Luiza Arrais to Scoring Assistant Role
-- Created: 2026-03-01
-- Description: 
--   Grants access to Ana Luiza Arrais with 'auxiliar' role.
--   PIN format: first 3 letters of name + 2026
-- ============================================================

INSERT INTO app_users (id, name, pin, role, must_change_password)
VALUES ('aux7', 'Ana Luiza Arrais', 'ana2026', 'auxiliar', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Verification
-- SELECT id, name, role FROM app_users WHERE name = 'Ana Luiza Arrais';
