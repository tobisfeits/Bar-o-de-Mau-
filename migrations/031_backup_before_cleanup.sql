-- ============================================================
-- BACKUP: Create backup tables before cleanup
-- Created: 2026-02-10
-- Description: Backup all data before reimport
-- ============================================================

-- ============================================================
-- STEP 1: Drop old backup tables if they exist
-- ============================================================
DROP TABLE IF EXISTS members_backup_2026_02_10 CASCADE;
DROP TABLE IF EXISTS units_backup_2026_02_10 CASCADE;
DROP TABLE IF EXISTS scores_backup_2026_02_10 CASCADE;
DROP TABLE IF EXISTS counselor_scores_backup_2026_02_10 CASCADE;

-- ============================================================
-- STEP 2: Create backup tables with ALL data
-- ============================================================

-- Backup members
CREATE TABLE members_backup_2026_02_10 AS 
SELECT * FROM members;

-- Backup units
CREATE TABLE units_backup_2026_02_10 AS 
SELECT * FROM units;

-- Backup scores
CREATE TABLE scores_backup_2026_02_10 AS 
SELECT * FROM scores;

-- Backup counselor_scores
CREATE TABLE counselor_scores_backup_2026_02_10 AS 
SELECT * FROM counselor_scores;

-- ============================================================
-- STEP 3: Verify backup counts
-- ============================================================
DO $$
DECLARE
    v_members_count INTEGER;
    v_units_count INTEGER;
    v_scores_count INTEGER;
    v_counselor_scores_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_members_count FROM members_backup_2026_02_10;
    SELECT COUNT(*) INTO v_units_count FROM units_backup_2026_02_10;
    SELECT COUNT(*) INTO v_scores_count FROM scores_backup_2026_02_10;
    SELECT COUNT(*) INTO v_counselor_scores_count FROM counselor_scores_backup_2026_02_10;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ BACKUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Backup Summary:';
    RAISE NOTICE '   - Members: % rows', v_members_count;
    RAISE NOTICE '   - Units: % rows', v_units_count;
    RAISE NOTICE '   - Scores: % rows', v_scores_count;
    RAISE NOTICE '   - Counselor Scores: % rows', v_counselor_scores_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  To restore from backup, run: 035_restore_from_backup.sql';
    RAISE NOTICE '';
END $$;

-- ============================================================
-- STEP 4: Export current state for reference
-- ============================================================
SELECT 
    'CURRENT STATE' as info,
    u.name as unit,
    m.role,
    COUNT(*) as count
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
GROUP BY u.name, m.role
ORDER BY u.name, m.role;
