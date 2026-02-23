-- ============================================================
-- Migration 051: Create Auxiliar de Pontuação Role
-- Created: 2026-02-23
-- Description: 
--   Creates 6 new users with 'auxiliar' role for score-only access.
--   These users can: view all units, score members, save scores.
--   They cannot: view reports, ranking, upload photos, manage members.
-- ============================================================

-- Insert new auxiliar users
-- PIN format: first 3 letters of name + 2026
-- All users will be prompted to change password on first login
INSERT INTO app_users (id, name, pin, role, must_change_password)
VALUES
    ('aux1', 'Robson',          'rob2026', 'auxiliar', true),
    ('aux2', 'Hellen',          'hel2026', 'auxiliar', true),
    ('aux3', 'Isabela Campos',  'isa2026', 'auxiliar', true),
    ('aux4', 'Victor',          'vic2026', 'auxiliar', true),
    ('aux5', 'Nicoly',          'nic2026', 'auxiliar', true),
    ('aux6', 'Larissa Marques', 'lar2026', 'auxiliar', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- SELECT id, name, role, must_change_password 
-- FROM app_users 
-- WHERE role = 'auxiliar'
-- ORDER BY name;
