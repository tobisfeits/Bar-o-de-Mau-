-- ============================================================
-- SECURITY IMPROVEMENT: Implement PIN Hashing
-- Created: 2026-02-10
-- Priority: CRITICAL
-- Effort: Low
-- ============================================================

-- ============================================================
-- STEP 1: Add hashed_pin column
-- ============================================================

ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS hashed_pin TEXT;

-- ============================================================
-- STEP 2: Force all users to change PIN on next login
-- ============================================================

UPDATE app_users 
SET must_change_password = true;

-- ============================================================
-- STEP 3: Create function to verify PIN hash
-- ============================================================

-- Note: Actual bcrypt hashing will be done in JavaScript
-- This is a placeholder function for future server-side validation

CREATE OR REPLACE FUNCTION verify_pin_hash(
    p_username TEXT,
    p_pin TEXT,
    p_hashed_pin TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- This will be replaced with actual bcrypt verification
    -- For now, just a placeholder
    RETURN p_hashed_pin IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verify_pin_hash IS 
'Placeholder for PIN verification. Will be replaced with bcrypt verification in Edge Function.';

-- ============================================================
-- STEP 4: Verification queries
-- ============================================================

-- Check column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
AND column_name = 'hashed_pin';

-- Check all users need to change password
SELECT 
    name, 
    role,
    must_change_password,
    hashed_pin IS NOT NULL as has_hashed_pin
FROM app_users
ORDER BY role, name;

-- ============================================================
-- IMPORTANT NOTES
-- ============================================================

/*
After running this migration:

1. All users will be forced to change their PIN on next login
2. The application will hash new PINs using bcrypt before storing
3. Old plaintext PINs will remain in `pin` column temporarily
4. Once all users have changed PINs, we can drop the `pin` column

Security Benefits:
- PINs will be hashed using bcrypt (industry standard)
- Database breach won't expose actual PINs
- Rainbow table attacks won't work

Next Steps:
1. Update frontend code to hash PINs (see 040_pin_hashing_client.js)
2. Test PIN change flow
3. Verify all users have migrated
4. Drop old `pin` column (migration 041)
*/
