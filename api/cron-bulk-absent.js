import { createClient } from '@supabase/supabase-js';

// Instanciar credenciais do ambiente
// Exige SUPABASE_SERVICE_ROLE_KEY no Vercel (bypassa RLS passivo)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    // 1. Autorização Opcional do Vercel
    if (process.env.CRON_SECRET) {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error('[CRON] Unauthorized request attempted.');
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    }

    // Válvula DRY RUN nativa para Rollout Progressivo
    const isDryRun = process.env.CRON_DRY_RUN === 'true' || req.query.dry_run === 'true';

    console.log(`[CRON_SERVICE_3B] Starting Bulk Absent Job. DRY_RUN: ${isDryRun}`);

    if (!supabaseUrl || !supabaseKey) {
         console.error('[CRON_SERVICE_3B] Missing Supabase config.');
         return res.status(500).json({ error: 'Config missing' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Travar timezone em 'America/Sao_Paulo' absoluto
    const now = new Date();
    const options = { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' };
    const dateBr = new Intl.DateTimeFormat('pt-BR', options).format(now);
    const dateKey = dateBr.split('/').reverse().join('-'); // Gera formato YYYY-MM-DD local
    
    console.log(`[CRON_SERVICE_3B] Reference BRT Date: ${dateKey}`);

    try {
        // 3. Validação Fail-Safe no Calendário Oficial
        const { data: events, error: calError } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('date', dateKey);

        if (calError) throw calError;

        const todayEvent = events && events.length > 0 ? events[0] : null;

        // Se NÃO E regular ou FOI cancelado, CRON Aborta na primeira etapa
        if (!todayEvent || todayEvent.type !== 'reuniao_regular' || todayEvent.is_canceled) {
            console.log('[CRON_SERVICE_3B] Abortando. Date is not mapped as reuniao_regular or is canceled.');
            return res.status(200).json({ 
                status: 'skipped', 
                reason: 'Not a strictly enabled regular meeting day', 
                dateKey 
            });
        }

        // 4. Identificando unidades que não farão parte do cálculo (Unidades TESTE)
        const { data: units, error: unitError } = await supabase.from('units').select('id, name');
        if (unitError) throw unitError;
        const testeUnits = units.filter(u => u.name.toUpperCase().includes('TESTE') || u.name.toUpperCase().includes('TEST')).map(u => u.id);

        // Fetch de todos os Active Members
        const { data: members, error: membersError } = await supabase
            .from('members')
            .select('id, name, unit_id')
            .eq('active', true)
            .is('deleted_at', null);

        if (membersError) throw membersError;

        const eligibleMembers = members.filter(m => !testeUnits.includes(m.unit_id));

        // 5. Fetch dos registros existentes de pontuação para o dia
        const { data: scores, error: scoresError } = await supabase
            .from('scores')
            .select('member_id')
            .eq('date', dateKey);

        if (scoresError) throw scoresError;

        const scoredIds = new Set(scores.map(s => s.member_id));

        // 6. Definição Objetiva de PENDENTE (Zero registros na tabela)
        const pendingMembers = eligibleMembers.filter(m => !scoredIds.has(m.id));

        console.log(`[CRON_SERVICE_3B] Found ${pendingMembers.length} pendings among ${eligibleMembers.length} valid members.`);

        if (pendingMembers.length === 0) {
            return res.status(200).json({ status: 'completed_empty', inserted: 0, dryRun: isDryRun });
        }

        // 7. Preparando Payload conforme arquitetura Fase 1 & 3B
        const rowsToInsert = pendingMembers.map(m => ({
            member_id: m.id,
            date: dateKey,
            is_absent: true,
            items: {}, // Objeto vazio para items JSONB
            created_by: 'SYSTEM_CRON',
            audit_source: 'CRON_SERVICE_3B',
            created_by_id: null
        }));

        // 9. Aplicação DRY_RUN (Não destrutiva)
        if (isDryRun) {
            console.log('[CRON_SERVICE_3B] --- DRY RUN ENGAGED ---');
            console.log(`[CRON_SERVICE_3B] Target inserts: ${rowsToInsert.length}`);
            return res.status(200).json({ 
                status: 'completed_dry_run', 
                wouldInsert: rowsToInsert.length,
                pendingCount: pendingMembers.length,
                samplePayload: rowsToInsert.slice(0, 3) 
            });
        }

        // 10. Execução Final (LIVE) - Usando Upsert Seguro (A mesma da repository.js)
        const { error: insertError } = await supabase
            .from('scores')
            .upsert(rowsToInsert, { onConflict: 'member_id,date' });

        if (insertError) throw insertError;

        console.log(`[CRON_SERVICE_3B] SUCESSO. ${rowsToInsert.length} omissões cobertas e carimbadas com Falta.`);
        return res.status(200).json({ status: 'completed_live', inserted: rowsToInsert.length });

    } catch (error) {
        console.error('[CRON_SERVICE_3B] Fatal Task Error:', error);
        return res.status(500).json({ status: 'error', reason: error.message });
    }
}
