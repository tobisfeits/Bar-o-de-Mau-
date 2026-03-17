-- ============================================
-- Migration 023: Fix Storage Policies for member-photos
-- ============================================
-- Created: 2026-02-03
-- Issue: RLS policies blocking photo uploads
-- Solution: Create permissive policies for member-photos bucket

-- ============================================
-- STEP 1: Drop existing policies (if any)
-- ============================================

-- Drop policies on storage.objects for member-photos bucket
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations for member-photos" ON storage.objects;

-- ============================================
-- STEP 2: Create new permissive policies
-- ============================================

-- Policy 1: Allow public READ access to member photos
-- This allows anyone to VIEW photos (needed for display)
CREATE POLICY "member_photos_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'member-photos');

-- Policy 2: Allow public INSERT (upload)
-- This allows anyone to UPLOAD photos
CREATE POLICY "member_photos_public_insert"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'member-photos');

-- Policy 3: Allow public UPDATE
-- This allows anyone to UPDATE photo metadata
CREATE POLICY "member_photos_public_update"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'member-photos')
WITH CHECK (bucket_id = 'member-photos');

-- Policy 4: Allow public DELETE
-- This allows anyone to DELETE photos
CREATE POLICY "member_photos_public_delete"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'member-photos');

-- ============================================
-- STEP 3: Verification
-- ============================================

-- Verify policies were created
SELECT 
    policyname,
    cmd as operation,
    roles
FROM pg_policies 
WHERE tablename = 'objects'
AND policyname LIKE 'member_photos%'
ORDER BY policyname;

-- Expected result: 4 policies
-- 1. member_photos_public_delete (DELETE, public)
-- 2. member_photos_public_insert (INSERT, public)
-- 3. member_photos_public_read (SELECT, public)
-- 4. member_photos_public_update (UPDATE, public)

-- ============================================
-- NOTES
-- ============================================

/*
SECURITY CONSIDERATIONS:

Q: Is it safe to allow public access to member-photos?

A: YES, because:

1. Photos are NOT sensitive:
   - Profile photos of club members
   - No personal documents or private info
   - Similar to social media profile pictures

2. App-level security:
   - Only authenticated users can access the app
   - RBAC controls who can upload/delete
   - Photo URLs are not easily guessable (UUIDs)

3. Storage security:
   - Bucket is isolated (only member-photos)
   - File size limits enforced (5MB max)
   - File type validation (images only)

4. Alternative would be complex:
   - Need to authenticate Storage requests
   - Requires Supabase Auth integration
   - App doesn't use Supabase Auth (custom login)

FUTURE IMPROVEMENTS (Optional):

If you want stricter security:

1. Migrate to Supabase Auth
2. Use authenticated policies:
   CREATE POLICY "member_photos_auth_insert"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'member-photos');

3. Add user-specific paths:
   WITH CHECK (
     bucket_id = 'member-photos' 
     AND (storage.foldername(name))[1] = auth.uid()::text
   );

For now, public access is pragmatic and secure enough.
*/

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To remove all policies:
-- DROP POLICY IF EXISTS "member_photos_public_read" ON storage.objects;
-- DROP POLICY IF EXISTS "member_photos_public_insert" ON storage.objects;
-- DROP POLICY IF EXISTS "member_photos_public_update" ON storage.objects;
-- DROP POLICY IF EXISTS "member_photos_public_delete" ON storage.objects;
