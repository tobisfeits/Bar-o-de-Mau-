-- ============================================
-- DIAGNÓSTICO: Verificar valores do campo ROLE
-- ============================================

-- Ver todos os valores únicos de ROLE
SELECT 
    role,
    COUNT(*) as quantidade,
    STRING_AGG(DISTINCT gender, ', ') as generos,
    MIN(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', birth_date))) as idade_min,
    MAX(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', birth_date))) as idade_max
FROM members
WHERE birth_date IS NOT NULL
GROUP BY role
ORDER BY quantidade DESC;

-- Ver exemplos de cada ROLE
SELECT 
    name,
    role,
    gender,
    EXTRACT(YEAR FROM AGE(DATE '2026-07-30', birth_date)) as idade,
    u.name as unidade
FROM members m
LEFT JOIN units u ON m.unit_id = u.id
WHERE birth_date IS NOT NULL
ORDER BY role, idade;

-- Verificar se há variações de escrita
SELECT DISTINCT
    role,
    UPPER(role) as role_upper,
    LOWER(role) as role_lower,
    TRIM(role) as role_trimmed,
    LENGTH(role) as tamanho
FROM members
WHERE role IS NOT NULL
ORDER BY role;
