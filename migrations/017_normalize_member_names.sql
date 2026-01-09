-- Migration 017: Normalize Member Names to Title Case
-- Created: 2026-01-09
-- Description: Convert all member names from UPPERCASE to Title Case with Portuguese connectives

-- Update member names to Title Case
-- This will handle Portuguese connectives: da, de, do, das, dos, e

UPDATE members
SET name = INITCAP(LOWER(name));

-- Manual corrections for Portuguese connectives
-- PostgreSQL's INITCAP doesn't handle Portuguese connectives correctly
-- We need to fix them manually

UPDATE members
SET name = REPLACE(name, ' Da ', ' da ')
WHERE name LIKE '% Da %';

UPDATE members
SET name = REPLACE(name, ' De ', ' de ')
WHERE name LIKE '% De %';

UPDATE members
SET name = REPLACE(name, ' Do ', ' do ')
WHERE name LIKE '% Do %';

UPDATE members
SET name = REPLACE(name, ' Das ', ' das ')
WHERE name LIKE '% Das %';

UPDATE members
SET name = REPLACE(name, ' Dos ', ' dos ')
WHERE name LIKE '% Dos %';

UPDATE members
SET name = REPLACE(name, ' E ', ' e ')
WHERE name LIKE '% E %';

-- Verification query
SELECT 
    id,
    name,
    unit_id
FROM members
ORDER BY name;

-- Expected results:
-- CARLOS EDUARDO CARVALHO SILVA FILHO → Carlos Eduardo Carvalho Silva Filho
-- GABRIEL BUENO PINHEIRO → Gabriel Bueno Pinheiro
-- ITALO RAMOS GALÚCIO → Italo Ramos Galúcio
-- JOSUÉ ARAUJO DE OLIVEIRA → Josué Araujo de Oliveira
-- LUCAS DE ARAUJO TAVARES → Lucas de Araujo Tavares
-- MARLON FERREIRA DA SILVA AMORIM → Marlon Ferreira da Silva Amorim
-- PEDRO HENRIQUE APOLINÁRIO FEITOSA → Pedro Henrique Apolinário Feitosa
