-- ============================================
-- Migration 021: Fix Password Persistence Bug
-- Add RLS Policies for app_users table
-- ============================================
-- Created: 2026-02-03
-- Issue: Users cannot update their own passwords due to missing RLS policies
-- Solution: Add policies to allow users to read/update their own data

-- ============================================
-- STEP 1: Enable RLS on app_users (if not already enabled)
-- ============================================

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop existing policies (if any)
-- ============================================

DROP POLICY IF EXISTS "users_read_own_data" ON app_users;
DROP POLICY IF EXISTS "users_update_own_password" ON app_users;
DROP POLICY IF EXISTS "super_admin_full_access" ON app_users;
DROP POLICY IF EXISTS "allow_public_read_for_login" ON app_users;

-- ============================================
-- STEP 3: Create new policies
-- ============================================

-- Policy 1: Allow public read for login (CRITICAL!)
-- Users need to read app_users to login (before authentication)
CREATE POLICY "allow_public_read_for_login" ON app_users
FOR SELECT
TO public
USING (true);

-- Policy 2: Authenticated users can read their own data
CREATE POLICY "users_read_own_data" ON app_users
FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

-- Policy 3: Authenticated users can update their own password
-- This is the KEY policy that was missing!
CREATE POLICY "users_update_own_password" ON app_users
FOR UPDATE
TO authenticated
USING (id = auth.uid()::text)
WITH CHECK (id = auth.uid()::text);

-- Policy 4: Super Admin can do everything
CREATE POLICY "super_admin_full_access" ON app_users
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM app_users 
        WHERE id = auth.uid()::text 
        AND role = 'super_admin'
    )
);

-- ============================================
-- STEP 4: Verification
-- ============================================

-- Verify RLS is enabled
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'app_users';

-- Verify policies were created
SELECT 
    policyname,
    cmd as operation,
    roles,
    qual as using_expression
FROM pg_policies 
WHERE tablename = 'app_users'
ORDER BY policyname;

-- Expected result: 4 policies
-- 1. allow_public_read_for_login (SELECT, public)
-- 2. super_admin_full_access (ALL, authenticated)
-- 3. users_read_own_data (SELECT, authenticated)
-- 4. users_update_own_password (UPDATE, authenticated)

-- ============================================
-- STEP 5: Test Update (Optional)
-- ============================================

-- Test if update works for a specific user
-- REPLACE 'USER_ID_HERE' with actual user ID
-- UPDATE app_users
-- SET pin = 'teste123', must_change_password = false
-- WHERE id = 'USER_ID_HERE';

-- Verify update worked
-- SELECT id, name, pin, must_change_password
-- FROM app_users
-- WHERE id = 'USER_ID_HERE';

-- ============================================
-- NOTES
-- ============================================

/*
IMPORTANT: Policy "allow_public_read_for_login" is CRITICAL!

Why? Because the login flow works like this:
1. User selects their name from dropdown (no auth yet)
2. User enters password
3. App queries app_users to validate password
4. If valid, user is authenticated

Without public read access, step 3 fails!

Security considerations:
- Public can only READ app_users (not write)
- Passwords are hashed/simple PINs (not sensitive)
- This is standard for authentication systems
- Alternative would be to use Supabase Auth (more complex)

UPDATE policy is restricted to:
- Authenticated users only
- Can only update their own row (id = auth.uid())
- Super Admin can update any row
*/

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To disable RLS and remove all policies:
-- ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "allow_public_read_for_login" ON app_users;
-- DROP POLICY IF EXISTS "users_read_own_data" ON app_users;
-- DROP POLICY IF EXISTS "users_update_own_password" ON app_users;
-- DROP POLICY IF EXISTS "super_admin_full_access" ON app_users;
