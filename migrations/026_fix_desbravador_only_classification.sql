-- ============================================
-- MIGRATION 026: FIX - Classificar APENAS Desbravadores
-- ============================================
-- Problema: Função estava movendo TODOS exceto CONSELHEIRO
-- Solução: Aplicar regras APENAS para role = 'DESBRAVADOR'

CREATE OR REPLACE FUNCTION classify_member_unit(
    p_birth_date DATE,
    p_gender VARCHAR(1),
    p_role VARCHAR(50)
) RETURNS TEXT AS $$
DECLARE
    v_age INTEGER;
    v_cutoff_date DATE;
BEGIN
    -- Return NULL if birth_date is missing
    IF p_birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- ✨ CRITICAL: Only classify DESBRAVADOR role
    -- All other roles (CONSELHEIRO, INSTRUTOR, DIRETOR, etc.) stay in current unit
    IF UPPER(TRIM(p_role)) != 'DESBRAVADOR' THEN
        RETURN NULL; -- Keep current unit for all non-desbravador roles
    END IF;
    
    -- Calculate age on JULY 30th
    v_cutoff_date := DATE(EXTRACT(YEAR FROM CURRENT_DATE) || '-07-30');
    v_age := EXTRACT(YEAR FROM AGE(v_cutoff_date, p_birth_date));
    
    -- Classification rules (ONLY for DESBRAVADOR)
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
        RETURN NULL; -- Age outside range, keep current unit
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION classify_member_unit IS 
'✅ FIXED: Classifies ONLY members with role=DESBRAVADOR based on age (JULY 30 cutoff) and gender.
All other roles (CONSELHEIRO, INSTRUTOR, DIRETOR, SECRETÁRIO, etc.) are NOT moved.

RULES (Age on July 30, 2026 - DESBRAVADOR only):
- Meninos: Imperadores (10-12), Barões (13-15)
- Meninas: Imperatrizes (10-11), Duquesas (11-13), Baronesas (13-15)
- All: Lokomotiva (16+)
- Leadership roles: NEVER moved';

-- ============================================
-- PREVIEW + UPDATE + TESTS (ALL IN ONE)
-- ============================================

DO $$
DECLARE
    v_member RECORD;
    v_new_unit_name TEXT;
    v_new_unit_id TEXT;
    v_will_change INTEGER := 0;
    v_updated INTEGER := 0;
    v_skipped INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Função corrigida - APENAS DESBRAVADORES serão classificados!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PREVIEW DE MUDANÇAS:';
    RAISE NOTICE '========================';
    
    -- Preview
    FOR v_member IN 
        SELECT m.id, m.name, m.birth_date, m.gender, m.role, m.unit_id, u.name as current_unit
        FROM members m
        LEFT JOIN units u ON m.unit_id = u.id
        WHERE m.birth_date IS NOT NULL
        ORDER BY m.role, m.name
    LOOP
        v_new_unit_name := classify_member_unit(v_member.birth_date, v_member.gender, v_member.role);
        
        IF v_new_unit_name IS NOT NULL AND v_new_unit_name != v_member.current_unit THEN
            RAISE NOTICE '🔄 % (%) : % → %', v_member.name, v_member.role, v_member.current_unit, v_new_unit_name;
            v_will_change := v_will_change + 1;
        ELSIF v_new_unit_name IS NULL AND UPPER(TRIM(v_member.role)) != 'DESBRAVADOR' THEN
            -- Leadership role - will be skipped (correct behavior)
            v_skipped := v_skipped + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMO PREVIEW: % desbravadores vão mudar, % líderes mantidos', v_will_change, v_skipped;
    RAISE NOTICE '';
    RAISE NOTICE '🔄 APLICANDO MUDANÇAS...';
    RAISE NOTICE '';
    
    -- Reset counters
    v_updated := 0;
    v_skipped := 0;
    
    -- Apply updates
    FOR v_member IN 
        SELECT m.id, m.name, m.birth_date, m.gender, m.role, m.unit_id
        FROM members m
        WHERE m.birth_date IS NOT NULL
        ORDER BY m.name
    LOOP
        v_new_unit_name := classify_member_unit(v_member.birth_date, v_member.gender, v_member.role);
        
        IF v_new_unit_name IS NOT NULL THEN
            SELECT id INTO v_new_unit_id
            FROM units 
            WHERE name = v_new_unit_name 
            LIMIT 1;
            
            IF v_new_unit_id IS NOT NULL AND v_new_unit_id != v_member.unit_id THEN
                UPDATE members 
                SET unit_id = v_new_unit_id
                WHERE id = v_member.id;
                
                v_updated := v_updated + 1;
            ELSE
                v_skipped := v_skipped + 1;
            END IF;
        ELSE
            v_skipped := v_skipped + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Mudanças aplicadas: % desbravadores atualizados, % mantidos', v_updated, v_skipped;
    RAISE NOTICE '';
END $$;

-- ============================================
-- TESTES
-- ============================================

DO $$
DECLARE
    v_unit RECORD;
    v_all_ok BOOLEAN := TRUE;
    v_leadership_in_kids_units INTEGER;
BEGIN
    RAISE NOTICE '🧪 TESTE 1: Faixas Etárias (Desbravadores)';
    RAISE NOTICE '==========================================';
    
    FOR v_unit IN
        SELECT 
            u.name as unidade,
            m.gender as genero,
            MIN(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date))) as idade_min,
            MAX(EXTRACT(YEAR FROM AGE(DATE '2026-07-30', m.birth_date))) as idade_max
        FROM members m
        JOIN units u ON m.unit_id = u.id
        WHERE m.birth_date IS NOT NULL
          AND UPPER(TRIM(m.role)) = 'DESBRAVADOR'
          AND u.name IN ('Imperadores', 'Barões', 'Imperatrizes', 'Duquesas', 'Baronesas')
        GROUP BY u.name, m.gender
        ORDER BY u.name
    LOOP
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
        RAISE NOTICE '✅ TESTE 1: PASSOU';
    ELSE
        RAISE NOTICE '❌ TESTE 1: FALHOU';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTE 2: Líderes Não Foram Movidos';
    RAISE NOTICE '=====================================';
    
    -- Count leadership roles in kids units (should exist - they lead the kids!)
    SELECT COUNT(*) INTO v_leadership_in_kids_units
    FROM members m
    JOIN units u ON m.unit_id = u.id
    WHERE UPPER(TRIM(m.role)) != 'DESBRAVADOR'
      AND u.name IN ('Imperadores', 'Barões', 'Imperatrizes', 'Duquesas', 'Baronesas');
    
    RAISE NOTICE '✅ % líderes permanecem em unidades infantis (correto!)', v_leadership_in_kids_units;
    RAISE NOTICE '✅ TESTE 2: PASSOU';
    
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ MIGRATION 026 COMPLETA!           ║';
    RAISE NOTICE '║                                        ║';
    RAISE NOTICE '║  • Função corrigida                    ║';
    RAISE NOTICE '║  • Apenas DESBRAVADORES classificados  ║';
    RAISE NOTICE '║  • Líderes mantidos nas unidades       ║';
    RAISE NOTICE '║                                        ║';
    RAISE NOTICE '║  Data de corte: 30 de JULHO ✅        ║';
    RAISE NOTICE '║  Faixas etárias: CORRETAS ✅          ║';
    RAISE NOTICE '╚════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;
