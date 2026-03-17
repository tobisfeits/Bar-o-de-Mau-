-- Migration 056: Mass Update Absences for 10 Dias de Oração (REFINED)
-- Created: 2026-03-04
-- Description: Mark all members as absent if they are NOT in the provided "Present" lists.
-- Features: 
--  1. Uses unaccent-like logic for robust name matching
--  2. Prevents duplicates using ON CONFLICT
--  3. Ignores names in the present list that don't exist in the members table (visitors)

DO $$
DECLARE
    v_date DATE;
    v_present_names TEXT[];
    v_member_record RECORD;
    v_total_updated INTEGER := 0;
    v_total_skipped_present INTEGER := 0;
    
    -- Function to normalize names (Internal to this block)
    -- Removes common accents, lowercase, and removes spaces
    v_norm_name TEXT;
    
    -- Helper to normalize a string
    -- Note: We use a simple regex approach for accents to be safe if unaccent extension isn't enabled
    -- but usually Supabase has it. We'll use a robust replace chain for common PT accents.
    -- (INITCAP/LOWER/REPLACE chain is simpler for this maintenance script)
BEGIN
    -- Loop through each date provided by the user
    FOR v_date, v_present_names IN 
        SELECT TO_DATE('19/02/2026', 'DD/MM/YYYY'), ARRAY['Arthur de Jesus Pinto Duarte', 'Daniela Bezerra Marques', 'Isabela Mendes Biscaia', 'Isabella Ferreira Campos', 'Julia de Souza Feitosa', 'Kinê Romero Sow', 'Maria Helena Fernandes Gonçalves', 'Manuela Marques de Oliveira', 'Marcela de Oliveira Mota', 'Natasha Castro Rios Maia', 'Pietra Gabriela Vieira dos Santos', 'Raissa Darielly da Silva', 'Ricardo Daniel Jorge da Silva', 'Lívia Araújo dos Santos', 'Ana Clara de Jesus Pinto Duarte', 'Murilo Passos', 'Vitoria Mel Santana Dantas', 'Desconhecido (Realme RMX399)', 'Diana Menezes da Silva', 'Matheus Barrinovo Martins', 'John Révisson Santos de Oliveira', 'David Dantas da Silva', 'Bianca Vieira Amorim', 'Vânia Vieira Silva Amorim', 'Tobias Feitosa de Matos', 'Andressa', 'Gerson', 'Fernanda']
        UNION ALL
        SELECT TO_DATE('20/02/2026', 'DD/MM/YYYY'), ARRAY['Arthur de Jesus Pinto Duarte', 'Ana Clara de Jesus Pinto Duarte', 'Arthur Bueno Amancio da Silva', 'Lívia Araújo dos Santos', 'Diana Menezes da Silva', 'Erik Bueno Pinheiro', 'Catarina Gonçalves Feitosa', 'Gabriel Bueno Pinheiro', 'Isabela Mendes Biscaia', 'Ítalo Ramos Glaucio', 'John Révisson Santos de Oliveira', 'Julia de Souza Feitosa', 'Kinê Romero Sow', 'Lorena Vera Dias', 'Manuela Marques de Oliveira', 'Marcela de Oliveira Mota', 'Nicollas Gabriel Barbosa de Almeida', 'Ricardo Daniel Jorge da Silva', 'Maria Helena Fernandes Gonçalves', 'Pietra Gabriela Vieira dos Santos', 'Josué Araujo de Oliveira', 'Ana Luiza Ferreira Arrais', 'Isabella Ferreira Campos', 'Vânia Vieira Silva Amorim', 'Tobias Feitosa de Matos', 'Emilly Lima de Franca', 'Eduardo Marques de Oliveira', 'Bianca Vieira Amorim', 'Andressa', 'Marlon Ferreira da Silva Amorim', 'Gerson', 'Antonia', 'Fernanda', 'Daniela Bezerra Marques', 'Matheus Lindoso']
        UNION ALL
        SELECT TO_DATE('21/02/2026', 'DD/MM/YYYY'), ARRAY['Nicollas Gabriel Barbosa de Almeida', 'Matheus Barrinovo Martins', 'Taline Ramos Galúcio', 'Ítalo Ramos Glaucio', 'Arthur de Jesus Pinto Duarte', 'David Daniel Bezerra Barroso', 'Isabella Ferreira Campos', 'Manuela Marques de Oliveira', 'Josué Araujo de Oliveira', 'Yasmim Borges Silva', 'Maria Helena Fernandes Gonçalves', 'Isabela Mendes Biscaia', 'Diana Menezes da Silva', 'Ana Clara de Jesus Pinto Duarte', 'Guilherme', 'Marcela de Oliveira Mota', 'Julie', 'Jane Virgínia Ramos S. de Oliveira', 'John Révisson Santos de Oliveira', 'Murilo Passos', 'Clarisel', 'Vânia Vieira Silva Amorim', 'Tobias Feitosa de Matos', 'Eduardo Marques de Oliveira', 'Bianca Vieira Amorim', 'Andressa', 'Gerson', 'Daniela Bezerra Marques', 'Matheus Lindoso', 'Pietra Gabriela Vieira dos Santos', 'Ricardo Daniel Jorge da Silva', 'Vitoria Mel Santana Dantas', 'Ana Luiza Ferreira Arrais', 'Catarina Gonçalves Feitosa', 'Natasha Castro Rios Maia']
        UNION ALL
        SELECT TO_DATE('22/02/2026', 'DD/MM/YYYY'), ARRAY['Josué Araujo de Oliveira', 'Isabella Ferreira Campos', 'Manuela Marques de Oliveira', 'Arthur de Jesus Pinto Duarte', 'Ana Clara de Jesus Pinto Duarte']
        UNION ALL
        SELECT TO_DATE('23/02/2026', 'DD/MM/YYYY'), ARRAY['Arthur de Jesus Pinto Duarte', 'Ana Clara de Jesus Pinto Duarte', 'David Daniel Bezerra Barroso', 'Isabela Mendes Biscaia', 'Isabella Ferreira Campos', 'Natasha Castro Rios Maia', 'Maria Helena Fernandes Gonçalves', 'Diana Menezes da Silva', 'Murilo Passos', 'Pietra Gabriela Vieira dos Santos', 'Ricardo Daniel Jorge da Silva', 'Vitoria Mel Santana Dantas', 'Manuela Marques de Oliveira', 'Ana Luiza Ferreira Arrais', 'Josué Araujo de Oliveira', 'Nicollas Gabriel Barbosa de Almeida', 'Catarina Gonçalves Feitosa']
        UNION ALL
        SELECT TO_DATE('24/02/2026', 'DD/MM/YYYY'), ARRAY['Arthur de Jesus Pinto Duarte', 'Ana Clara de Jesus Pinto Duarte', 'Carlos Eduardo Carvalho Silva Filho', 'Catarina Gonçalves Feitosa', 'Diana Menezes da Silva', 'Erik Bueno Pinheiro', 'Heloysa Aparecida Fernandes', 'Isabella Ferreira Campos', 'Josué Araujo de Oliveira', 'John Révisson Santos de Oliveira', 'Kinê Romero Sow', 'Manuela Marques de Oliveira', 'Maria Helena Fernandes Gonçalves', 'Murilo Passos', 'Pietra Gabriela Vieira dos Santos', 'Ricardo Daniel Jorge da Silva', 'Taline Ramos Galúcio', 'David Daniel Bezerra Barroso', 'Vânia Vieira Silva Amorim', 'Tobias Feitosa de Matos', 'Emilly Lima de Franca', 'Eduardo Marques de Oliveira', 'Bianca Vieira Amorim', 'Andressa', 'Gerson', 'Fernanda', 'Daniela Bezerra Marques', 'Matheus Lindoso']
        UNION ALL
        SELECT TO_DATE('26/02/2026', 'DD/MM/YYYY'), ARRAY['Arthur de Jesus Pinto Duarte', 'Ana Clara de Jesus Pinto Duarte', 'Ricardo Daniel Jorge da Silva', 'David Daniel Bezerra Barroso', 'Heloysa Aparecida Fernandes', 'Josué Araujo de Oliveira', 'John Révisson Santos de Oliveira', 'Kinê Romero Sow', 'Manuela Marques de Oliveira', 'Marcela de Oliveira Mota', 'Maria Helena Fernandes Gonçalves', 'Murilo Passos', 'Pietra Gabriela Vieira dos Santos', 'Nicollas Gabriel Barbosa de Almeida', 'Natasha Castro Rios Maia', 'Ítalo Ramos Glaucio', 'Taline Ramos Galúcio', 'Andressa', 'Bianca Vieira Amorim', 'Vânia Vieira Silva Amorim', 'Tobias Feitosa de Matos', 'Matheus Lindoso', 'Gerson', 'Fernanda']
    LOOP
        -- Process active members
        FOR v_member_record IN 
            SELECT id, name FROM members 
            WHERE active = true AND deleted_at IS NULL
        LOOP
            -- Check if member (by normalized name) is in the present list
            -- Normalize function: lower + unaccent (via translate) + trim
            -- translate list covers common PT chars: áàâãéêíóôõúç
            IF NOT EXISTS (
                SELECT 1 FROM unnest(v_present_names) AS p_name
                WHERE 
                    LOWER(REPLACE(translate(p_name, 'áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ', 'aaaaeeiooouucAAAAEEIOOOUUC'), ' ', '')) = 
                    LOWER(REPLACE(translate(v_member_record.name, 'áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ', 'aaaaeeiooouucAAAAEEIOOOUUC'), ' ', ''))
            ) THEN
                -- MARK AS ABSENT
                INSERT INTO scores (member_id, date, is_absent, items, created_by, created_at)
                VALUES (
                    v_member_record.id, 
                    v_date, 
                    true, 
                    '{}'::jsonb, 
                    'Sistema (Ajuste Massivo)', 
                    NOW()
                )
                ON CONFLICT (member_id, date) 
                DO UPDATE SET 
                    is_absent = true,
                    items = '{}'::jsonb,
                    created_by = 'Sistema (Ajuste Massivo)',
                    updated_at = NOW();
                
                v_total_updated := v_total_updated + 1;
            ELSE
                v_total_skipped_present := v_total_skipped_present + 1;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '✅ Mass update complete.';
    RAISE NOTICE '   Total marked as Absent: %', v_total_updated;
    RAISE NOTICE '   Total skipped (Present): %', v_total_skipped_present;
END $$;
