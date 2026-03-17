-- Migration 013: Update Imperadores Logo
-- Created: 2026-01-06
-- Description: Add logo for Imperadores unit

UPDATE units SET logo = '/fotos/imperadores.png' WHERE id = 'u4' AND name = 'Imperadores';

-- Verification query
SELECT id, name, logo FROM units WHERE id = 'u4';
