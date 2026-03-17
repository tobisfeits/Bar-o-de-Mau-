-- Migration 003: Enable Row Level Security (RLS) policies
-- Created: 2026-01-02
-- Description: Implements RLS policies for members and scores tables

-- ============================================
-- MEMBERS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on members table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admin can see all members
CREATE POLICY "Super Admin Full Access on Members" ON members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid()::text AND role = 'super_admin'
  )
);

-- Policy 2: Conselheiro can only see members from their unit
CREATE POLICY "Conselheiro Unit Access on Members" ON members
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid()::text 
      AND role = 'conselheiro'
      AND unidade_id = members.unit_id
  )
);

-- Policy 3: Desbravador can only see their own profile
CREATE POLICY "Desbravador Self Access on Members" ON members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid()::text 
      AND role = 'desbravador'
      AND name = members.name
  )
);

-- ============================================
-- SCORES TABLE RLS POLICIES
-- ============================================

-- Enable RLS on scores table
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admin can see all scores
CREATE POLICY "Super Admin Full Access on Scores" ON scores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid()::text AND role = 'super_admin'
  )
);

-- Policy 2: Conselheiro can only see scores from their unit's members
CREATE POLICY "Conselheiro Unit Access on Scores" ON scores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users u
    JOIN members m ON m.unit_id = u.unidade_id
    WHERE u.id = auth.uid()::text 
      AND u.role = 'conselheiro'
      AND scores.member_id = m.id
  )
);

-- Policy 3: Desbravador can only see their own scores
CREATE POLICY "Desbravador Self Access on Scores" ON scores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM members m
    JOIN app_users u ON u.name = m.name
    WHERE u.id = auth.uid()::text
      AND u.role = 'desbravador'
      AND scores.member_id = m.id
  )
);

-- ============================================
-- UNITS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on units table
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super Admin can see all units
CREATE POLICY "Super Admin Full Access on Units" ON units
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid()::text AND role = 'super_admin'
  )
);

-- Policy 2: Conselheiro can only see their own unit
CREATE POLICY "Conselheiro Own Unit Access" ON units
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE id = auth.uid()::text 
      AND role = 'conselheiro'
      AND unidade_id = units.id
  )
);

-- Policy 3: Desbravador can see their unit
CREATE POLICY "Desbravador Unit Access" ON units
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM members m
    JOIN app_users u ON u.name = m.name
    WHERE u.id = auth.uid()::text
      AND u.role = 'desbravador'
      AND m.unit_id = units.id
  )
);

-- Verification: Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('members', 'scores', 'units')
ORDER BY tablename, policyname;
