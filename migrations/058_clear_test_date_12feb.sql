-- Migration 058: Clear test scores and session log for 12/02/2026
-- Note: 25/02/2026 was already cleaned in migration 057.

-- 1. Hard-delete all scores for 12/02/2026
DELETE FROM scores WHERE date = '2026-02-12';

-- 2. Remove the session log (clears the "58 pendentes / Iniciada por Silas" alert)
DELETE FROM score_session_logs WHERE session_date = '2026-02-12';

-- Verify: both should return 0
SELECT COUNT(*) AS remaining_scores FROM scores WHERE date = '2026-02-12';
SELECT COUNT(*) AS remaining_logs FROM score_session_logs WHERE session_date = '2026-02-12';
