-- ============================================================
-- FIX UNIT LOGOS: Restore correct logo paths
-- Created: 2026-02-10
-- ============================================================

-- Check current logo paths
SELECT id, name, logo FROM units ORDER BY name;

-- Update with correct logo paths (.png extension)
UPDATE units SET logo = '/fotos/baronesas.png' WHERE name = 'Baronesas';
UPDATE units SET logo = '/fotos/baroes.png' WHERE name = 'Barões';
UPDATE units SET logo = '/fotos/duquesas.png' WHERE name = 'Duquesas';
UPDATE units SET logo = '/fotos/imperadores.png' WHERE name = 'Imperadores';
UPDATE units SET logo = '/fotos/imperatrizes.png' WHERE name = 'Imperatrizes';
UPDATE units SET logo = '/fotos/lokomotiva.png' WHERE name = 'Lokomotiva';

-- Verify updated paths
SELECT id, name, logo FROM units ORDER BY name;
