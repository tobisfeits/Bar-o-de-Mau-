-- Quick verification: Count total members
SELECT COUNT(*) as total_members FROM members;

-- Check for duplicates by name
SELECT 
    name, 
    COUNT(*) as count,
    STRING_AGG(id::TEXT, ', ') as ids
FROM members
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;
