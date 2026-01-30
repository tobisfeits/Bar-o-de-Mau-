-- Migration 018: Reset All Scores
-- Created: 2026-01-25
-- Description: Clear all scoring data for fresh start
-- WARNING: This will DELETE all score records permanently!

-- Delete all member scores
DELETE FROM scores;

-- Delete all counselor evaluations
DELETE FROM counselor_evaluations;

-- Verification queries
SELECT 
    'scores' as table_name,
    COUNT(*) as remaining_records
FROM scores
UNION ALL
SELECT 
    'counselor_evaluations' as table_name,
    COUNT(*) as remaining_records
FROM counselor_evaluations;

-- Expected result: Both tables should show 0 records

-- Success message
SELECT 
    '✅ All scores cleared successfully!' as status,
    'Ready for fresh scoring on ' || CURRENT_DATE as message;
