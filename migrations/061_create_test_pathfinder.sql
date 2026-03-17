-- Migration 061: Create Test Pathfinder for Verification
-- Created: 2026-03-09
-- Description: Insert TEST_USER_01 to allow safe verification of scoring logic

INSERT INTO members (name, birth_date, gender, role, unit_id, is_counselor) 
VALUES ('TEST_USER_01', '2010-01-01', 'M', 'DESBRAVADOR', 'u1', false);
