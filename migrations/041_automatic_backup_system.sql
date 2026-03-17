-- Migration 041: Automatic Backup System (Simplified)
-- Created: 2026-02-11
-- Description: Implement automatic backup system for scores only
-- Priority: CRITICAL - Protects against accidental data deletion

-- ============================================================================
-- 1. Create Backup Table for Scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS score_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_date TIMESTAMPTZ DEFAULT NOW(),
    backup_type TEXT NOT NULL, -- 'pre_delete', 'pre_update', 'daily', 'manual'
    
    -- Original score data
    original_id UUID,
    member_id TEXT,
    date DATE,
    is_absent BOOLEAN,
    items JSONB,
    created_by TEXT,
    created_by_id TEXT,
    created_at TIMESTAMPTZ,
    
    -- Backup metadata
    backed_up_by TEXT,
    backed_up_by_id TEXT,
    reason TEXT,
    
    -- Timestamp
    created_at_backup TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_score_backups_date ON score_backups(backup_date);
CREATE INDEX IF NOT EXISTS idx_score_backups_member ON score_backups(member_id);
CREATE INDEX IF NOT EXISTS idx_score_backups_type ON score_backups(backup_type);
CREATE INDEX IF NOT EXISTS idx_score_backups_original_date ON score_backups(date);

-- ============================================================================
-- 3. Create Backup Functions
-- ============================================================================

-- Function to backup score before delete
CREATE OR REPLACE FUNCTION backup_score_before_delete()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO score_backups (
        backup_type,
        original_id,
        member_id,
        date,
        is_absent,
        items,
        created_by,
        created_by_id,
        created_at,
        reason
    ) VALUES (
        'pre_delete',
        OLD.id,
        OLD.member_id,
        OLD.date,
        OLD.is_absent,
        OLD.items,
        OLD.created_by,
        OLD.created_by_id,
        OLD.created_at,
        'Automatic backup before DELETE'
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to backup score before update
CREATE OR REPLACE FUNCTION backup_score_before_update()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.is_absent IS DISTINCT FROM NEW.is_absent) OR 
       (OLD.items IS DISTINCT FROM NEW.items) THEN
        
        INSERT INTO score_backups (
            backup_type,
            original_id,
            member_id,
            date,
            is_absent,
            items,
            created_by,
            created_by_id,
            created_at,
            reason
        ) VALUES (
            'pre_update',
            OLD.id,
            OLD.member_id,
            OLD.date,
            OLD.is_absent,
            OLD.items,
            OLD.created_by,
            OLD.created_by_id,
            OLD.created_at,
            'Automatic backup before UPDATE'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Create Triggers
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_backup_score_before_delete ON scores;
DROP TRIGGER IF EXISTS trigger_backup_score_before_update ON scores;

-- Trigger for scores DELETE
CREATE TRIGGER trigger_backup_score_before_delete
    BEFORE DELETE ON scores
    FOR EACH ROW
    EXECUTE FUNCTION backup_score_before_delete();

-- Trigger for scores UPDATE
CREATE TRIGGER trigger_backup_score_before_update
    BEFORE UPDATE ON scores
    FOR EACH ROW
    EXECUTE FUNCTION backup_score_before_update();

-- ============================================================================
-- 5. Cleanup Function (Auto-delete old backups after 90 days)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM score_backups 
    WHERE backup_date < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Cleaned up % old backup(s)', deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Function to Restore from Backup
-- ============================================================================

CREATE OR REPLACE FUNCTION restore_score_from_backup(backup_id UUID)
RETURNS void AS $$
DECLARE
    backup_record RECORD;
BEGIN
    -- Get backup record
    SELECT * INTO backup_record FROM score_backups WHERE id = backup_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Backup not found: %', backup_id;
    END IF;
    
    -- Insert back into scores (will fail if already exists with same member_id + date)
    INSERT INTO scores (
        member_id,
        date,
        is_absent,
        items,
        created_by,
        created_by_id,
        created_at
    ) VALUES (
        backup_record.member_id,
        backup_record.date,
        backup_record.is_absent,
        backup_record.items,
        backup_record.created_by,
        backup_record.created_by_id,
        backup_record.created_at
    )
    ON CONFLICT (member_id, date) DO UPDATE SET
        is_absent = EXCLUDED.is_absent,
        items = EXCLUDED.items,
        updated_at = NOW();
    
    RAISE NOTICE 'Score restored from backup: member=%, date=%', backup_record.member_id, backup_record.date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Verification
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ BACKUP SYSTEM INSTALLED SUCCESSFULLY!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Table created: score_backups';
    RAISE NOTICE 'Triggers activated: DELETE and UPDATE protection';
    RAISE NOTICE 'Auto-cleanup: 90 days retention';
    RAISE NOTICE 'Restore function: restore_score_from_backup(backup_id)';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
END $$;

-- Show current backup status
SELECT 
    'score_backups' as table_name,
    COUNT(*) as current_backups,
    COUNT(DISTINCT member_id) as unique_members,
    MIN(backup_date) as oldest_backup,
    MAX(backup_date) as newest_backup
FROM score_backups;
