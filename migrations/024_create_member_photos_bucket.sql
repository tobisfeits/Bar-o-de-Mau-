-- ============================================
-- Migration 024: Create and Configure member-photos Bucket
-- ============================================
-- Created: 2026-02-03
-- Issue: Bucket member-photos doesn't exist or is not public
-- Solution: Create bucket and set as public

-- ============================================
-- STEP 1: Create bucket if not exists
-- ============================================

-- Insert bucket (will fail silently if exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Ensure bucket is public
-- ============================================

UPDATE storage.buckets
SET public = true
WHERE id = 'member-photos';

-- ============================================
-- STEP 3: Verification
-- ============================================

-- Verify bucket exists and is public
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE id = 'member-photos';

-- Expected result:
-- id: member-photos
-- name: member-photos
-- public: true
-- created_at: [timestamp]

-- ============================================
-- NOTES
-- ============================================

/*
WHY THIS IS NEEDED:

The bucket 'member-photos' was referenced in code but never created in Supabase.
This causes 400 Bad Request errors when trying to access photos.

WHAT THIS DOES:

1. Creates the bucket if it doesn't exist
2. Sets public = true to allow public read access
3. Verifies the bucket is properly configured

PUBLIC ACCESS:

Setting public = true means:
- Photos can be accessed via public URLs
- No authentication required to VIEW photos
- Storage policies still control UPLOAD/DELETE
- This is safe for profile photos (non-sensitive)

ALTERNATIVE:

If you want private photos (requires authentication):
1. Set public = false
2. Update PhotoManager to use signed URLs
3. Implement auth token in requests
*/
