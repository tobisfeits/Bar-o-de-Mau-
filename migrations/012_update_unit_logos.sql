-- Migration 012: Update Unit Logos
-- Created: 2026-01-06
-- Description: Update unit logo paths with new uploaded images

UPDATE units SET logo = '/fotos/baronesas.png' WHERE id = 'u1' AND name = 'Baronesas';
UPDATE units SET logo = '/fotos/baroes.png' WHERE id = 'u2' AND name = 'Baroes';
UPDATE units SET logo = '/fotos/duquesas.png' WHERE id = 'u3' AND name = 'Duquesas';
UPDATE units SET logo = NULL WHERE id = 'u4' AND name = 'Imperadores'; -- Logo not provided yet
UPDATE units SET logo = '/fotos/imperatrizes.png' WHERE id = 'u5' AND name = 'Imperatrizes';
UPDATE units SET logo = '/fotos/lokomotiva.png' WHERE id = 'u6' AND name = 'Lokomotiva';

-- Verification query
SELECT id, name, logo FROM units ORDER BY name;
