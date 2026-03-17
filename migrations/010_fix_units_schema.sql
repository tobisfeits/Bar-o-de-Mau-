-- Migration 010: Fix Units Table Schema and Seed Data
-- Created: 2026-01-02
-- Description: Add missing columns and seed initial units

-- Add missing columns to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE units ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Disable RLS to allow public access (app uses custom auth)
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;

-- Clear any existing units
DELETE FROM units;

-- Insert the 6 initial units with correct schema
INSERT INTO units (id, name, logo, gender, points, active, created_at) VALUES
('u1', 'Baronesas', '/fotos/baronesas.jpg', 'F', 0, true, NOW()),
('u2', 'Barões', '/fotos/baroes.jpg', 'M', 0, true, NOW()),
('u3', 'Duquesas', '/fotos/duquesas.jpg', 'F', 0, true, NOW()),
('u4', 'Imperadores', '/fotos/imperadores.jpg', 'M', 0, true, NOW()),
('u5', 'Imperatrizes', '/fotos/imperatrizes.jpg', 'F', 0, true, NOW()),
('u6', 'Lokomotiva', '/fotos/lokomotiva.jpg', 'M', 0, true, NOW());

-- Verification query
SELECT id, name, gender, points, active FROM units ORDER BY name;
