-- ============================================================
-- SECURITY AUDIT: Check RLS policies and permissions
-- Created: 2026-02-10
-- ============================================================

-- ============================================================
-- 1. CHECK RLS STATUS ON ALL TABLES
-- ============================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- 2. LIST ALL RLS POLICIES
-- ============================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- 3. CHECK TABLE GRANTS
-- ============================================================
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- ============================================================
-- 4. CHECK AUTHENTICATION MECHANISM
-- ============================================================
-- System uses PIN authentication (not passwords)
SELECT 
    id,
    name,
    role,
    LENGTH(pin) as pin_length,
    must_change_password,
    unidade_id
FROM app_users
ORDER BY role, name
LIMIT 10;

-- ============================================================
-- 5. CHECK FOR ORPHANED RECORDS
-- ============================================================
-- Members without units
SELECT COUNT(*) as orphaned_members
FROM members
WHERE unit_id IS NULL OR unit_id NOT IN (SELECT id FROM units);

-- Scores without members
SELECT COUNT(*) as orphaned_scores
FROM scores
WHERE member_id NOT IN (SELECT id FROM members);

-- ============================================================
-- 6. CHECK DATA VALIDATION
-- ============================================================
-- Invalid birth dates
SELECT COUNT(*) as invalid_birthdates
FROM members
WHERE birth_date > CURRENT_DATE OR birth_date < '1900-01-01';

-- Invalid scores
SELECT COUNT(*) as invalid_scores
FROM scores
WHERE score < 0 OR score > 100;
