-- Migration 015: Disable Counselor Logins
-- Temporarily disable the 12 counselor accounts created in migration 014
-- Keeping only the 4 original users: Tobias, Diane, Vânia, Silas
-- The counselor accounts will be re-enabled later with specific rules

-- Delete the 12 counselor accounts
DELETE FROM app_users 
WHERE id IN (
    'bia2026',  -- Bianca (Imperatrizes)
    'lar2026',  -- Larissa (Imperatrizes)
    'dan2026',  -- Daniela (Baronesas)
    'deb2026',  -- Deborah (Baronesas)
    'emi2026',  -- Emilly (Baronesas)
    'luc2026',  -- Lucas (Barões)
    'mar2026',  -- Marlon (Barões)
    'lao2026',  -- Laodicéia (Duquesas)
    'lui2026',  -- Luisa (Duquesas)
    'edu2026',  -- Eduardo (Imperadores)
    'hel2026',  -- Hellen (Lokomotiva)
    'rob2026'   -- Robson (Lokomotiva)
);

-- Verify only 4 users remain
SELECT 
    id,
    name,
    role,
    unidade_id
FROM app_users
ORDER BY name;
