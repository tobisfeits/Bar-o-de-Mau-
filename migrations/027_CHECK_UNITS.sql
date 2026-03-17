-- ============================================
-- DIAGNÓSTICO: Verificar nomes das unidades
-- ============================================

-- Ver todos os nomes de unidades no banco
SELECT 
    id,
    name,
    LENGTH(name) as tamanho,
    '"' || name || '"' as com_aspas
FROM units
ORDER BY name;

-- Ver se há espaços ou caracteres especiais
SELECT 
    name,
    UPPER(name) as maiuscula,
    TRIM(name) as sem_espacos,
    name = 'Barões' as match_baroes,
    name = 'BARÕES' as match_baroes_upper
FROM units
ORDER BY name;
