-- Migration 057: Clear test scores and session log for 25/02/2026
-- This deletes all scores (including the empty mass import) and the session trigger for that date.

-- 1. Hard-delete all scores for 25/02/2026
DELETE FROM scores
WHERE date = '2026-02-25'
  AND (created_by = 'Importação Planilha' OR created_by = 'Tobias');

-- 2. Remove the session log so the 24h trigger is also cleared
DELETE FROM score_session_logs
WHERE session_date = '2026-02-25';

-- Verify: confirm nothing remains for that date
SELECT COUNT(*) AS remaining_scores FROM scores WHERE date = '2026-02-25';
SELECT COUNT(*) AS remaining_logs FROM score_session_logs WHERE session_date = '2026-02-25';
