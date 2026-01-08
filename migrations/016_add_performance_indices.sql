-- Migration 016: Add Database Indices for Performance
-- Created: 2026-01-08
-- Description: Add composite indices for frequently queried columns

-- Index for scores by member and date (most common query)
CREATE INDEX IF NOT EXISTS idx_scores_member_date 
ON scores(member_id, score_date DESC);

-- Index for scores by unit (for unit rankings)
CREATE INDEX IF NOT EXISTS idx_scores_unit_date 
ON scores(unit_id, score_date DESC);

-- Index for active members by unit
CREATE INDEX IF NOT EXISTS idx_members_unit_active 
ON members(unit_id, is_active) 
WHERE is_active = true;

-- Index for counselor evaluations by unit and date
CREATE INDEX IF NOT EXISTS idx_counselor_eval_unit_date 
ON counselor_evaluations(unit_id, evaluation_date DESC);

-- Index for members by birthdate (for birthday alerts)
CREATE INDEX IF NOT EXISTS idx_members_birthdate 
ON members(birthdate) 
WHERE birthdate IS NOT NULL;

-- Index for app_users by role (for RBAC queries)
CREATE INDEX IF NOT EXISTS idx_app_users_role 
ON app_users(role);

-- Index for app_users by unit (for filtering)
CREATE INDEX IF NOT EXISTS idx_app_users_unit 
ON app_users(unidade_id) 
WHERE unidade_id IS NOT NULL;

-- Verification query
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
