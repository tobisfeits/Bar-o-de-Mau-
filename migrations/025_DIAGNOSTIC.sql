-- ============================================
-- DIAGNÓSTICO: Por que as idades estão erradas?
-- ============================================

-- Ver membros com idades fora da faixa esperada
SELECT 
    m.name,
    m.gender,
    m.birth_date,
    EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) as idade_atual,
    u.name as unidade_atual,
    classify_member_unit(m.birth_date, m.gender, m.role) as unidade_sugerida,
    m.role,
    CASE 
        WHEN classify_member_unit(m.birth_date, m.gender, m.role) IS NULL THEN 'Conselheiro ou sem regra'
        WHEN classify_member_unit(m.birth_date, m.gender, m.role) = u.name THEN 'OK'
        ELSE 'PRECISA MUDAR!'
    END as status
FROM members m
JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND u.name IN ('Imperadores', 'Barões', 'Imperatrizes', 'Duquesas', 'Baronesas')
ORDER BY 
    CASE WHEN classify_member_unit(m.birth_date, m.gender, m.role) != u.name THEN 0 ELSE 1 END,
    idade_atual DESC;

-- ============================================
-- ANÁLISE: Quantos precisam mudar?
-- ============================================

SELECT 
    COUNT(*) as total_membros,
    COUNT(CASE WHEN classify_member_unit(m.birth_date, m.gender, m.role) != u.name 
                AND classify_member_unit(m.birth_date, m.gender, m.role) IS NOT NULL 
           THEN 1 END) as precisam_mudar,
    COUNT(CASE WHEN classify_member_unit(m.birth_date, m.gender, m.role) = u.name THEN 1 END) as ja_corretos,
    COUNT(CASE WHEN classify_member_unit(m.birth_date, m.gender, m.role) IS NULL THEN 1 END) as sem_mudanca
FROM members m
JOIN units u ON m.unit_id = u.id
WHERE m.birth_date IS NOT NULL
  AND u.name IN ('Imperadores', 'Barões', 'Imperatrizes', 'Duquesas', 'Baronesas');

-- ============================================
-- VERIFICAR: A função está correta?
-- ============================================

-- Testar função com casos específicos
SELECT 
    'Menino 10 anos' as caso,
    classify_member_unit(DATE '2016-01-01', 'M', NULL) as resultado_esperado_imperadores;

SELECT 
    'Menina 11 anos' as caso,
    classify_member_unit(DATE '2015-01-01', 'F', NULL) as resultado_esperado_duquesas;

SELECT 
    'Menina 13 anos' as caso,
    classify_member_unit(DATE '2013-01-01', 'F', NULL) as resultado_esperado_baronesas;

-- ============================================
-- POSSÍVEL CAUSA: Conselheiros?
-- ============================================

SELECT 
    m.name,
    m.role,
    EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) as idade,
    u.name as unidade
FROM members m
JOIN units u ON m.unit_id = u.id
WHERE UPPER(m.role) = 'CONSELHEIRO'
  OR m.role LIKE '%Conselheiro%'
  OR m.role LIKE '%conselheiro%'
ORDER BY idade DESC;
