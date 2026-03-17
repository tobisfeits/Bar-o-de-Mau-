-- Migration 044: Soft Delete System
-- Created: 2026-02-12
-- Description: Implement soft delete functionality to prevent permanent data loss
-- Priority: HIGH - Data protection enhancement

-- ============================================================================
-- PHASE 1: ADD DELETED_AT COLUMNS
-- ============================================================================

-- Add deleted_at to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add deleted_at to scores table
ALTER TABLE scores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Optional: Add to units (rarely deleted)
ALTER TABLE units ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- PHASE 2: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Index for members (most queries will filter by deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON members(deleted_at) 
WHERE deleted_at IS NULL;

-- Index for scores
CREATE INDEX IF NOT EXISTS idx_scores_deleted_at ON scores(deleted_at) 
WHERE deleted_at IS NULL;

-- Index for units
CREATE INDEX IF NOT EXISTS idx_units_deleted_at ON units(deleted_at) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- PHASE 3: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to soft delete a member
CREATE OR REPLACE FUNCTION soft_delete_member(p_member_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE members 
    SET deleted_at = NOW()
    WHERE id = p_member_id 
      AND deleted_at IS NULL;
    
    RAISE NOTICE 'Member % soft deleted', p_member_id;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete a score
CREATE OR REPLACE FUNCTION soft_delete_score(p_member_id TEXT, p_date DATE)
RETURNS void AS $$
BEGIN
    UPDATE scores 
    SET deleted_at = NOW()
    WHERE member_id = p_member_id 
      AND date = p_date
      AND deleted_at IS NULL;
    
    RAISE NOTICE 'Score for member % on date % soft deleted', p_member_id, p_date;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a soft deleted member
CREATE OR REPLACE FUNCTION restore_member(p_member_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE members 
    SET deleted_at = NULL
    WHERE id = p_member_id;
    
    RAISE NOTICE 'Member % restored', p_member_id;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a soft deleted score
CREATE OR REPLACE FUNCTION restore_score(p_member_id TEXT, p_date DATE)
RETURNS void AS $$
BEGIN
    UPDATE scores 
    SET deleted_at = NULL
    WHERE member_id = p_member_id 
      AND date = p_date;
    
    RAISE NOTICE 'Score for member % on date % restored', p_member_id, p_date;
END;
$$ LANGUAGE plpgsql;

-- Function to permanently delete old soft-deleted records (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_soft_deleted(days_old INTEGER DEFAULT 365)
RETURNS TABLE(table_name TEXT, deleted_count BIGINT) AS $$
DECLARE
    cutoff_date TIMESTAMPTZ;
    member_count BIGINT;
    score_count BIGINT;
BEGIN
    cutoff_date := NOW() - (days_old || ' days')::INTERVAL;
    
    -- Delete old soft-deleted members
    DELETE FROM members 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < cutoff_date;
    GET DIAGNOSTICS member_count = ROW_COUNT;
    
    -- Delete old soft-deleted scores
    DELETE FROM scores 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < cutoff_date;
    GET DIAGNOSTICS score_count = ROW_COUNT;
    
    -- Return results
    RETURN QUERY SELECT 'members'::TEXT, member_count
    UNION ALL SELECT 'scores'::TEXT, score_count;
    
    RAISE NOTICE 'Cleanup complete: % members, % scores permanently deleted', 
                 member_count, score_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 4: CREATE CONVENIENT VIEWS
-- ============================================================================

-- View for active members only
CREATE OR REPLACE VIEW active_members AS
SELECT * FROM members WHERE deleted_at IS NULL;

-- View for active scores only
CREATE OR REPLACE VIEW active_scores AS
SELECT * FROM scores WHERE deleted_at IS NULL;

-- View for deleted members (for admin/recovery)
CREATE OR REPLACE VIEW deleted_members AS
SELECT 
    id,
    name,
    unit_id,
    deleted_at,
    EXTRACT(DAY FROM (NOW() - deleted_at)) as days_since_deletion
FROM members 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- View for deleted scores (for admin/recovery)
CREATE OR REPLACE VIEW deleted_scores AS
SELECT 
    member_id,
    date,
    deleted_at,
    items,
    EXTRACT(DAY FROM (NOW() - deleted_at)) as days_since_deletion
FROM scores 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- ============================================================================
-- PHASE 5: UPDATE EXISTING VIEWS TO RESPECT SOFT DELETE
-- ============================================================================

-- Recreate members_with_units to exclude deleted members
DROP VIEW IF EXISTS members_with_units CASCADE;
CREATE VIEW members_with_units AS
SELECT 
    m.*,
    u.name as unit_name
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.deleted_at IS NULL;

-- Recreate birthday views to exclude deleted members
DROP VIEW IF EXISTS upcoming_birthdays CASCADE;
CREATE VIEW upcoming_birthdays AS
SELECT 
    m.id,
    m.name as member_name,
    m.birth_date,
    u.name as unit_name,
    EXTRACT(YEAR FROM AGE(m.birth_date)) as current_age
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.deleted_at IS NULL
  AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM m.birth_date) >= EXTRACT(DAY FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM m.birth_date) <= EXTRACT(DAY FROM CURRENT_DATE) + 7
ORDER BY EXTRACT(DAY FROM m.birth_date);

DROP VIEW IF EXISTS todays_birthdays CASCADE;
CREATE VIEW todays_birthdays AS
SELECT 
    m.id,
    m.name as member_name,
    m.birth_date,
    u.name as unit_name,
    EXTRACT(YEAR FROM AGE(m.birth_date)) as current_age
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE m.deleted_at IS NULL
  AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM m.birth_date) = EXTRACT(DAY FROM CURRENT_DATE);

-- ============================================================================
-- PHASE 6: VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SOFT DELETE SYSTEM INSTALLED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Columns added: deleted_at';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '✅ Helper functions available:';
    RAISE NOTICE '   - soft_delete_member(member_id)';
    RAISE NOTICE '   - soft_delete_score(member_id, date)';
    RAISE NOTICE '   - restore_member(member_id)';
    RAISE NOTICE '   - restore_score(member_id, date)';
    RAISE NOTICE '   - cleanup_old_soft_deleted(days)';
    RAISE NOTICE '✅ Views created:';
    RAISE NOTICE '   - active_members';
    RAISE NOTICE '   - active_scores';
    RAISE NOTICE '   - deleted_members';
    RAISE NOTICE '   - deleted_scores';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Remember to update application code!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Show stats
SELECT 
    'members' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as active,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted
FROM members
UNION ALL
SELECT 
    'scores' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as active,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted
FROM scores;
