-- Migration 009: Seed Initial Units
-- Created: 2026-01-02
-- Description: Insert the 6 initial units for the club

INSERT INTO units (id, name, logo, created_at) VALUES
('baronesas', 'Baronesas', '/fotos/baronesas.jpg', NOW()),
('baroes', 'Barões', '/fotos/baroes.jpg', NOW()),
('duquesas', 'Duquesas', '/fotos/duquesas.jpg', NOW()),
('imperadores', 'Imperadores', '/fotos/imperadores.jpg', NOW()),
('imperatrizes', 'Imperatrizes', '/fotos/imperatrizes.jpg', NOW()),
('lokomotiva', 'Lokomotiva', '/fotos/lokomotiva.jpg', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verification query
SELECT id, name, logo FROM units ORDER BY name;
