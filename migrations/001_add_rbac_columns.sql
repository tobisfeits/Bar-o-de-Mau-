-- Migration 001: Add RBAC columns to app_users table
-- Created: 2026-01-02
-- Description: Adds role and unidade_id columns to support Role-Based Access Control

-- Step 1: Add role column with constraint
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'desbravador' 
CHECK (role IN ('super_admin', 'conselheiro', 'desbravador'));

-- Step 2: Add unidade_id column as foreign key to units table
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS unidade_id TEXT REFERENCES units(id);

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_app_users_unidade_id ON app_users(unidade_id);

-- Step 4: Update Tobias as Super Admin
UPDATE app_users 
SET role = 'super_admin' 
WHERE name = 'Tobias';

-- Verification query
SELECT id, name, role, unidade_id 
FROM app_users 
ORDER BY role, name;
