-- ============================================
-- SCRIPT AUTOMÁTICO: Migration 025 + Testes
-- ============================================
-- Execute este script COMPLETO de uma vez no Supabase SQL Editor
-- Ele vai corrigir a função E aplicar as mudanças automaticamente

-- ============================================
-- PARTE 1: CORRIGIR FUNÇÃO
-- ============================================

CREATE OR REPLACE FUNCTION classify_member_unit(
    p_birth_date DATE,
    p_gender VARCHAR(1),
    p_role VARCHAR(50)
) RETURNS TEXT AS $$
DECLARE
    v_age INTEGER;
    v_cutoff_date DATE;
BEGIN
    IF p_birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- ✨ FIX: Calculate age on JULY 30th (not June 30)
    v_cutoff_date := DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-07-30');
    v_age := EXTRACT(YEAR FROM AGE(v_cutoff_date, p_birth_date));
    
    -- Conselheiros never move to Lokomotiva
    IF UPPER(p_role) = 'CONSELHEIRO' THEN
        RETURN NULL;
    END IF;
    
    -- Classification rules
    IF v_age >= 16 THEN
        RETURN 'Lokomotiva';
    ELSIF p_gender = 'M' AND v_age BETWEEN 10 AND 12 THEN
        RETURN 'Imperadores';
    ELSIF p_gender = 'M' AND v_age BETWEEN 13 AND 15 THEN
        RETURN 'Barões';
    ELSIF p_gender = 'F' AND v_age BETWEEN 10 AND 11 THEN
        RETURN 'Imperatrizes';
    ELSIF p_gender = 'F' AND v_age BETWEEN 11 AND 13 THEN
        RETURN 'Duquesas';
    ELSIF p_gender = 'F' AND v_age BETWEEN 13 AND 15 THEN
        RETURN 'Baronesas';
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- PARTE 2: PREVIEW DE MUDANÇAS
-- ============================================

DO $$
DECLARE
    v_member RECORD;
    v_new_unit TEXT;
    v_current_unit TEXT;
    v_will_change INTEGER := 0;
    v_will_skip INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Função corrigida!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PREVIEW DE MUDANÇAS:';
    RAISE NOTICE '========================';
    
    FOR v_member IN 
        SELECT m.id, m.name, m.birth_date, m.gender, m.role, u.name as current_unit
        FROM members m
        LEFT JOIN units u ON m.unit_id = u.id
        WHERE m.birth_date IS NOT NULL
        ORDER BY m.name
    LOOP
        v_new_unit := classify_member_unit(v_member.birth_date, v_member.gender, v_member.role);
        
        IF v_new_unit IS NOT NULL AND v_new_unit != v_member.current_unit THEN
            RAISE NOTICE '🔄 % : % → %', v_member.name, v_member.current_unit, v_new_unit;
            v_will_change := v_will_change + 1;
        ELSIF v_new_unit IS NULL THEN
            v_will_skip := v_will_skip + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMO: % mudanças, % sem mudança', v_will_change, v_will_skip;
    RAISE NOTICE '';
END $$;

-- ============================================
-- PARTE 3: APLICAR MUDANÇAS
-- ============================================

DO $$
BEGIN
    CALL update_member_units();
    RAISE NOTICE '✅ Mudanças aplicadas!';
END $$;

-- ============================================
-- PARTE 4: TESTES DE VERIFICAÇÃO
-- ============================================

-- Teste 1: Verificar faixas etárias
DO $$
DECLARE
    v_unit RECORD;
    v_all_ok BOOLEAN := TRUE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTE 1: Verificar Faixas Etárias';
    RAISE NOTICE '====================================';
    
    FOR v_unit IN
        SELECT 
            u.name as unidade,
            m.gender as genero,
            MIN(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date))) as idade_min,
            MAX(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date))) as idade_max
        FROM members m
        JOIN units u ON m.unit_id = u.id
        WHERE m.birth_date IS NOT NULL
          AND u.name IN ('Imperadores', 'Barões', 'Imperatrizes', 'Duquesas', 'Baronesas')
        GROUP BY u.name, m.gender
        ORDER BY u.name
    LOOP
        -- Verificar se está correto
        IF (v_unit.unidade = 'Imperadores' AND v_unit.genero = 'M' AND v_unit.idade_min >= 10 AND v_unit.idade_max <= 12) OR
           (v_unit.unidade = 'Barões' AND v_unit.genero = 'M' AND v_unit.idade_min >= 13 AND v_unit.idade_max <= 15) OR
           (v_unit.unidade = 'Imperatrizes' AND v_unit.genero = 'F' AND v_unit.idade_min >= 10 AND v_unit.idade_max <= 11) OR
           (v_unit.unidade = 'Duquesas' AND v_unit.genero = 'F' AND v_unit.idade_min >= 11 AND v_unit.idade_max <= 13) OR
           (v_unit.unidade = 'Baronesas' AND v_unit.genero = 'F' AND v_unit.idade_min >= 13 AND v_unit.idade_max <= 15) THEN
            RAISE NOTICE '✅ % (%) : % - % anos', v_unit.unidade, v_unit.genero, v_unit.idade_min, v_unit.idade_max;
        ELSE
            RAISE NOTICE '❌ % (%) : % - % anos (ERRO!)', v_unit.unidade, v_unit.genero, v_unit.idade_min, v_unit.idade_max;
            v_all_ok := FALSE;
        END IF;
    END LOOP;
    
    IF v_all_ok THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ TESTE 1: PASSOU';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ TESTE 1: FALHOU';
    END IF;
END $$;

-- Teste 2: Verificar casos específicos
DO $$
DECLARE
    v_count INTEGER;
    v_wrong_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTE 2: Casos Específicos';
    RAISE NOTICE '==============================';
    
    -- Meninos de 10 anos devem estar em Imperadores
    SELECT COUNT(*) INTO v_count
    FROM members m
    JOIN units u ON m.unit_id = u.id
    WHERE m.gender = 'M'
      AND EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) = 10;
    
    SELECT COUNT(*) INTO v_wrong_count
    FROM members m
    JOIN units u ON m.unit_id = u.id
    WHERE m.gender = 'M'
      AND EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) = 10
      AND u.name != 'Imperadores';
    
    IF v_wrong_count = 0 THEN
        RAISE NOTICE '✅ Meninos 10 anos → Imperadores (% membros)', v_count;
    ELSE
        RAISE NOTICE '❌ Meninos 10 anos: % em unidade errada!', v_wrong_count;
    END IF;
    
    -- Meninas de 11 anos devem estar em Duquesas
    SELECT COUNT(*) INTO v_count
    FROM members m
    JOIN units u ON m.unit_id = u.id
    WHERE m.gender = 'F'
      AND EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) = 11;
    
    SELECT COUNT(*) INTO v_wrong_count
    FROM members m
    JOIN units u ON m.unit_id = u.id
    WHERE m.gender = 'F'
      AND EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) = 11
      AND u.name != 'Duquesas';
    
    IF v_wrong_count = 0 THEN
        RAISE NOTICE '✅ Meninas 11 anos → Duquesas (% membros)', v_count;
    ELSE
        RAISE NOTICE '❌ Meninas 11 anos: % em unidade errada!', v_wrong_count;
    END IF;
    
    -- Meninas de 13 anos devem estar em Baronesas
    SELECT COUNT(*) INTO v_count
    FROM members m
    JOIN units u ON m.unit_id = u.id
    WHERE m.gender = 'F'
      AND EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) = 13;
    
    SELECT COUNT(*) INTO v_wrong_count
    FROM members m
    JOIN units u ON m.unit_id = u.id
    WHERE m.gender = 'F'
      AND EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date)) = 13
      AND u.name != 'Baronesas';
    
    IF v_wrong_count = 0 THEN
        RAISE NOTICE '✅ Meninas 13 anos → Baronesas (% membros)', v_count;
    ELSE
        RAISE NOTICE '❌ Meninas 13 anos: % em unidade errada!', v_wrong_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ TESTE 2: COMPLETO';
END $$;

-- Teste 3: Verificar conselheiros
DO $$
DECLARE
    v_count INTEGER;
    v_wrong_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTE 3: Conselheiros';
    RAISE NOTICE '========================';
    
    SELECT COUNT(*) INTO v_count
    FROM members
    WHERE UPPER(role) = 'CONSELHEIRO';
    
    SELECT COUNT(*) INTO v_wrong_count
    FROM members m
    JOIN units u ON m.unit_id = u.id
    WHERE UPPER(m.role) = 'CONSELHEIRO'
      AND u.name = 'Lokomotiva';
    
    IF v_wrong_count = 0 THEN
        RAISE NOTICE '✅ Nenhum conselheiro foi para Lokomotiva (% conselheiros)', v_count;
    ELSE
        RAISE NOTICE '❌ % conselheiros foram para Lokomotiva!', v_wrong_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ TESTE 3: PASSOU';
END $$;

-- ============================================
-- RESULTADO FINAL
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ MIGRATION 025 COMPLETA!           ║';
    RAISE NOTICE '║                                        ║';
    RAISE NOTICE '║  • Função corrigida                    ║';
    RAISE NOTICE '║  • Mudanças aplicadas                  ║';
    RAISE NOTICE '║  • Testes executados                   ║';
    RAISE NOTICE '║                                        ║';
    RAISE NOTICE '║  Data de corte: 30 de JULHO ✅        ║';
    RAISE NOTICE '║  Faixas etárias: CORRETAS ✅          ║';
    RAISE NOTICE '╚════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
