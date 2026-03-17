-- Migration 054 FIXED: Remove incompatible FK, use text for created_by_id
-- Run this instead of 054_score_session_logs.sql

CREATE TABLE IF NOT EXISTS score_session_logs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_date    date NOT NULL UNIQUE,
    first_log_at    timestamptz NOT NULL DEFAULT now(),
    created_by      text,
    created_by_id   text   -- text to match app_users.id type (no FK needed)
);

ALTER TABLE score_session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "score_session_logs_read"
    ON score_session_logs FOR SELECT USING (true);

CREATE POLICY "score_session_logs_insert"
    ON score_session_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "score_session_logs_admin_delete"
    ON score_session_logs FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_score_session_logs_date
    ON score_session_logs (session_date);

CREATE INDEX IF NOT EXISTS idx_score_session_logs_first_log
    ON score_session_logs (first_log_at);
