-- Migration 055: Retroactive population of score_session_logs
-- Finds all past dates with scores and inserts them into score_session_logs.
-- Uses the earliest created_at for each date as the first_log_at timestamp.
-- ON CONFLICT DO NOTHING so today's live records are never overwritten.

INSERT INTO score_session_logs (session_date, first_log_at, created_by, created_by_id)
SELECT
    s.date                                          AS session_date,
    MIN(s.created_at)                               AS first_log_at,
    (SELECT created_by FROM scores s2
     WHERE s2.date = s.date
       AND s2.created_at = MIN(s.created_at)
     LIMIT 1)                                       AS created_by,
    (SELECT created_by_id FROM scores s2
     WHERE s2.date = s.date
       AND s2.created_at = MIN(s.created_at)
     LIMIT 1)                                       AS created_by_id
FROM scores s
WHERE s.date < CURRENT_DATE          -- only fully-past sessions
  AND s.deleted_at IS NULL
GROUP BY s.date
ON CONFLICT (session_date) DO NOTHING;

-- Verify: show what was inserted
SELECT
    session_date,
    first_log_at,
    created_by,
    ROUND(EXTRACT(EPOCH FROM (now() - first_log_at)) / 3600) AS hours_elapsed
FROM score_session_logs
ORDER BY session_date DESC;
