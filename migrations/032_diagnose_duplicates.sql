-- ============================================================
-- DIAGNOSTIC: Find Duplicates (Units and Members)
-- Created: 2026-02-10
-- ============================================================

-- ============================================================
-- 1. CHECK FOR DUPLICATE UNIT NAMES
-- ============================================================
SELECT 
    '🔍 DUPLICATE UNIT NAMES' as check_type,
    name,
    COUNT(*) as count,
    STRING_AGG(id::TEXT, ', ') as unit_ids
FROM units
GROUP BY name
HAVING COUNT(*) > 1;

-- ============================================================
-- 2. CHECK FOR SIMILAR UNIT NAMES (accent variations)
-- ============================================================
SELECT 
    '📋 ALL UNITS (watch for Baroes vs Barões)' as check_type,
    id,
    name,
    UPPER(name) as normalized_name,
    created_at
FROM units
ORDER BY UPPER(name);

-- ============================================================
-- 3. CHECK FOR DUPLICATE MEMBER NAMES
-- ============================================================
SELECT 
    '👥 DUPLICATE MEMBER NAMES' as check_type,
    m.name,
    COUNT(*) as count,
    STRING_AGG(m.id::TEXT, ', ') as member_ids,
    STRING_AGG(m.birth_date::TEXT, ', ') as birth_dates,
    STRING_AGG(u.name, ', ') as units
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
GROUP BY m.name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ============================================================
-- 4. COUNT MEMBERS BY UNIT
-- ============================================================
SELECT 
    '📊 MEMBER COUNT BY UNIT' as check_type,
    u.name as unit,
    COUNT(m.id) as total_members
FROM units u
LEFT JOIN members m ON m.unit_id = u.id
GROUP BY u.name
ORDER BY u.name;

-- ============================================================
-- 5. FIND MEMBERS WITH NULL UNIT_ID
-- ============================================================
SELECT 
    '⚠️ MEMBERS WITHOUT UNIT' as check_type,
    id,
    name,
    role,
    birth_date,
    unit_id
FROM members
WHERE unit_id IS NULL;

-- ============================================================
-- 6. TOTAL COUNTS SUMMARY
-- ============================================================
SELECT 'Total Units:' as metric, COUNT(*)::TEXT as value FROM units
UNION ALL
SELECT 'Total Members:' as metric, COUNT(*)::TEXT as value FROM members
UNION ALL
SELECT 'Members with NULL unit:' as metric, COUNT(*)::TEXT as value FROM members WHERE unit_id IS NULL
UNION ALL
SELECT 'Duplicate member names:' as metric, COUNT(DISTINCT name)::TEXT as value FROM (
    SELECT name FROM members GROUP BY name HAVING COUNT(*) > 1
) sub;
