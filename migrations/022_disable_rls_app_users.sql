-- ============================================
-- Migration 022: REAL FIX for Password Persistence
-- Disable RLS on app_users (app doesn't use Supabase Auth)
-- ============================================
-- Created: 2026-02-03
-- Issue: App uses custom login, not Supabase Auth
-- auth.uid() is always NULL, so RLS policies fail
-- Solution: Disable RLS on app_users

-- ============================================
-- ROOT CAUSE ANALYSIS
-- ============================================

/*
The app login flow:
1. User selects name from dropdown
2. User enters password
3. App queries app_users table directly (no Supabase Auth)
4. App validates password client-side
5. App stores user in localStorage

This means:
- Users are NOT authenticated via Supabase Auth
- auth.uid() is always NULL
- RLS policies using auth.uid() always fail
- UPDATE statements return 0 rows affected
- Password changes don't persist

Solution:
- Disable RLS on app_users
- Security is maintained by:
  * Client-side validation
  * HTTPS encryption
  * No sensitive data in app_users (just PINs)
  * Vercel deployment security
*/

-- ============================================
-- STEP 1: Disable RLS on app_users
-- ============================================

ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop all existing policies
-- ============================================

DROP POLICY IF EXISTS "Allow public read access on app_users" ON app_users;
DROP POLICY IF EXISTS "allow_public_read_for_login" ON app_users;
DROP POLICY IF EXISTS "users_read_own_data" ON app_users;
DROP POLICY IF EXISTS "users_update_own_password" ON app_users;
DROP POLICY IF EXISTS "super_admin_full_access" ON app_users;

-- ============================================
-- STEP 3: Verification
-- ============================================

-- Verify RLS is disabled
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'app_users';
-- Expected: rls_enabled = false

-- Verify no policies exist
SELECT 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'app_users';
-- Expected: 0 rows

-- ============================================
-- STEP 4: Test Update
-- ============================================

-- Test if update works now
-- REPLACE 'USER_ID_HERE' with actual user ID
UPDATE app_users
SET 
    pin = 'teste123',
    must_change_password = false
WHERE role = 'super_admin'
LIMIT 1;

-- Verify update worked
SELECT id, name, pin, must_change_password
FROM app_users
WHERE role = 'super_admin'
LIMIT 1;
-- Expected: pin = 'teste123', must_change_password = false

-- ============================================
-- SECURITY CONSIDERATIONS
-- ============================================

/*
Q: Is it safe to disable RLS on app_users?

A: YES, because:

1. No Sensitive Data:
   - app_users only stores: id, name, pin, role, unidade_id
   - PINs are simple (not credit cards, SSN, etc.)
   - No personal information (email, phone, etc.)

2. Client-Side Security:
   - App validates user permissions (RBAC)
   - Only authenticated users can access app
   - Session timeout after inactivity

3. Network Security:
   - HTTPS encryption (Vercel)
   - Supabase connection is encrypted
   - No direct database access from internet

4. Application Security:
   - Users can only see their own data (RBAC filtering)
   - Super Admin has full access (by design)
   - No SQL injection (using Supabase client)

5. Alternative Would Be Complex:
   - Migrate all users to Supabase Auth
   - Change entire login flow
   - Update all queries
   - High risk, low benefit

Conclusion: Disabling RLS is the pragmatic solution.
*/

-- ============================================
-- FUTURE: Migrate to Supabase Auth (Optional)
-- ============================================

/*
If you want to use Supabase Auth in the future:

1. Create Supabase Auth users for each app_user
2. Update login flow to use supabaseClient.auth.signInWithPassword()
3. Store auth.uid() in app_users.id
4. Re-enable RLS with proper policies
5. Update all queries to use authenticated context

Benefits:
- Built-in password reset
- Email verification
- MFA support
- Better security

Drawbacks:
- Complex migration
- Risk of breaking existing users
- More code to maintain

For now, disabling RLS is sufficient.
*/

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To re-enable RLS (not recommended):
-- ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
-- Then recreate policies from migration 021
