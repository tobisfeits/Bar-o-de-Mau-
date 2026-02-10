-- ============================================================
-- RESTORE: Restore data from backup (if needed)
-- Created: 2026-02-10
-- Description: Restore all data from backup tables
-- ⚠️  ONLY USE IF YOU NEED TO UNDO THE CLEANUP!
-- ============================================================

-- ============================================================
-- STEP 1: Clear current data
-- ============================================================
TRUNCATE members CASCADE;
TRUNCATE units CASCADE;
TRUNCATE scores CASCADE;
TRUNCATE counselor_scores CASCADE;

-- ============================================================
-- STEP 2: Restore from backup
-- ============================================================

-- Restore units first (members depend on units)
INSERT INTO units 
SELECT * FROM units_backup_2026_02_10;

-- Restore members
INSERT INTO members 
SELECT * FROM members_backup_2026_02_10;

-- Restore scores
INSERT INTO scores 
SELECT * FROM scores_backup_2026_02_10;

-- Restore counselor_scores
INSERT INTO counselor_scores 
SELECT * FROM counselor_scores_backup_2026_02_10;

-- ============================================================
-- STEP 3: Verify restoration
-- ============================================================
DO $$
DECLARE
    v_members_count INTEGER;
    v_units_count INTEGER;
    v_scores_count INTEGER;
    v_counselor_scores_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_members_count FROM members;
    SELECT COUNT(*) INTO v_units_count FROM units;
    SELECT COUNT(*) INTO v_scores_count FROM scores;
    SELECT COUNT(*) INTO v_counselor_scores_count FROM counselor_scores;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ RESTORATION COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Restored counts:';
    RAISE NOTICE '   - Members: %', v_members_count;
    RAISE NOTICE '   - Units: %', v_units_count;
    RAISE NOTICE '   - Scores: %', v_scores_count;
    RAISE NOTICE '   - Counselor Scores: %', v_counselor_scores_count;
    RAISE NOTICE '';
END $$;
