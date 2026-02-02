-- Migration 020: Add Profile Photos Support
-- Created: 2026-02-02
-- Description: Add photo_url column to members table for profile photos

-- ============================================
-- Add photo_url column
-- ============================================
ALTER TABLE members
ADD COLUMN photo_url TEXT;

COMMENT ON COLUMN members.photo_url 
IS 'URL to member profile photo in Supabase Storage bucket member-photos';

-- ============================================
-- Create index for faster queries (optional)
-- ============================================
-- Only index non-null values to save space
CREATE INDEX idx_members_photo_url ON members(photo_url) 
WHERE photo_url IS NOT NULL;

COMMENT ON INDEX idx_members_photo_url 
IS 'Index for members with profile photos';

-- ============================================
-- Verification Query
-- ============================================
-- Run this after migration to verify
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'members' AND column_name = 'photo_url';
