-- Migration 005: Add Member Demographics
-- Created: 2026-01-02
-- Description: Add birth_date, gender, and role columns to members table

-- Add new columns
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(1) CHECK (gender IN ('M', 'F')),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'DESBRAVADOR';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_birth_date ON members(birth_date);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);
CREATE INDEX IF NOT EXISTS idx_members_gender ON members(gender);

-- Add comment for documentation
COMMENT ON COLUMN members.birth_date IS 'Member birth date for age calculation';
COMMENT ON COLUMN members.gender IS 'Member gender: M (Male) or F (Female)';
COMMENT ON COLUMN members.role IS 'Member role: DESBRAVADOR, CONSELHEIRO, INSTRUTOR, etc.';

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'members' 
  AND column_name IN ('birth_date', 'gender', 'role')
ORDER BY column_name;
