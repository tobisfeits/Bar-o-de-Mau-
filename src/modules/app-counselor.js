import { Store } from '../data/store.js';
import { Utils } from './ui-utils.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { Toast } from '../ui/toast.js';
import { Loading } from '../ui/loading.js';
import { CONFIG } from '../config/constants.js';

export const CounselorMethods = {
    // Capture state for change detection
    captureCounselorState() {
        const toggles = document.querySelectorAll('.counselor-toggle');
        const state = {};
        toggles.forEach(t => state[t.dataset.id] = t.checked);
        return JSON.stringify(state);
    },

    async renderCounselorEvaluation(counselorId) {
        const users = await Store.getUsers();
        const member = users.find(u => u.id === counselorId);
        if (!member || (member.role.toLowerCase() !== 'conselheiro' && member.role.toLowerCase() !== 'super_admin')) {
            Toast.show('Conselheiro não encontrado!', 'error');
            this.navigate('dashboard');
            return;
        }

        const units = await Store.getUnits();
        const unit = units.find(u => u.id === (member.unidade_id || member.unitId));
        const dateKey = this.counselorScoringDate || this.currentDate || Utils.getTodayKey();
        this.counselorScoringDate = dateKey;
        const existingScore = await Store.getCounselorScore(counselorId, dateKey) || { items: {} };
        const currentTotal = Utils.countCounselorTotal(existingScore);

        const html = `
            <div class="slide-in pb-24">
                <!-- Header com Botão Voltar -->
                <div class="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-lg">
                    <div class="flex items-center justify-between">
                        <button onclick="App.goBack()" 
                                class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            <span class="font-bold text-sm uppercase">Voltar</span>
                        </button>
                        <span class="text-brand-gold font-bold text-sm bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">
                            ${unit ? unit.name : 'Sem Unidade'}
                        </span>
                    </div>
                    <!-- Date Picker -->
                    <div class="mt-3 flex items-center justify-center gap-2">
                        <i data-lucide="calendar" class="w-4 h-4 text-slate-400"></i>
                        <label class="relative cursor-pointer">
                            <input type="date" id="counselor-date-picker" value="${dateKey}"
                                   onchange="App.changeCounselorScoringDate('${counselorId}', this.value)"
                                   class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-bold text-center focus:border-brand-gold outline-none cursor-pointer">
                        </label>
                        <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            ${dateKey === Utils.getTodayKey() ? 'Hoje' : 'Retroativo'}
                        </span>
                    </div>
                </div>
                
                <div class="text-center border-b-2 border-dashed border-slate-700 pb-4 mb-6">
                    <div class="flex flex-col items-center justify-center gap-2 mb-2">
                        ${member.photo_url || member.image
                ? `<img src="${member.photo_url || member.image}" 
                                   class="w-24 h-24 rounded-full object-cover border-4 border-brand-gold/30 shadow-lg" 
                                   alt="${member.name}">`
                : `<div class="w-24 h-24 rounded-full bg-brand-gold/20 flex items-center justify-center border-4 border-brand-gold/30">
                                   <i data-lucide="user-check" class="w-12 h-12 text-brand-gold"></i>
                               </div>`
            }
                        <h2 class="text-2xl font-black text-white uppercase tracking-wide leading-none">
                            ${Sanitizer.normalizeName(member.name)}
                        </h2>
                        <span class="text-xs px-3 py-1 bg-brand-gold/20 text-brand-gold rounded-full font-bold uppercase tracking-wider border border-brand-gold/30">
                            Conselheiro
                        </span>
                    </div>
                    <p class="text-sm font-bold text-slate-400 uppercase">Unidade: ${unit ? unit.name : 'Sem unidade / Global'}</p>
                </div>
                
                <div class="text-center mb-4">
                    <span class="text-lg font-bold text-slate-400">
                        Avaliação Pessoal: 
                        <span id="counselor-score-val" class="text-brand-gold">${currentTotal}</span>/100
                    </span>
                </div>
                
                <div id="counselor-scoring-list" class="space-y-2">
                    ${CONFIG.COUNSELOR_ITEMS.map(item => `
                        <div class="bg-slate-900 rounded-lg p-3 border border-slate-800 
                                    shadow-sm flex items-center justify-between">
                            <span class="font-bold text-slate-200 text-sm">
                                ${item.name}
                            </span>
                            <div class="flex items-center gap-3">
                                <span class="font-bold text-brand-gold text-sm">
                                    ${item.points} pts
                                </span>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only peer counselor-toggle" 
                                           data-id="${item.id}" 
                                           ${existingScore.items && existingScore.items[item.id] ? 'checked' : ''}>
                                    <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer 
                                              peer-checked:after:translate-x-full peer-checked:after:border-white 
                                              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                              after:bg-white after:border-gray-300 after:border after:rounded-full 
                                              after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="fixed bottom-6 left-4 right-4 flex flex-col gap-3">
                    <button onclick="App.saveCounselorScore('${counselorId}')" 
                            class="w-full py-4 rounded-xl font-bold text-white 
                                   bg-brand-navy shadow-xl shadow-brand-navy/30 
                                   flex items-center justify-center gap-2 
                                   active:scale-95 transition-transform uppercase 
                                   tracking-widest text-sm">
                        <i data-lucide="save" class="w-5 h-5"></i>
                        Salvar Avaliação
                    </button>
                </div>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.toggleNavigation(true);

        // Event listeners
        document.querySelectorAll('.counselor-toggle').forEach(toggle => {
            toggle.addEventListener('change', () => this.recalcCounselorScore());
        });

        // Capturar estado inicial para detectar mudanças (opcional)
        // this.initialCounselorState = null;
        // setTimeout(() => {
        //    this.initialCounselorState = this.captureCounselorState();
        // }, 100);
    },

    recalcCounselorScore() {
        const toggles = document.querySelectorAll('.counselor-toggle:checked');

        let total = 0;
        toggles.forEach(toggle => {
            const item = CONFIG.COUNSELOR_ITEMS.find(i => i.id === toggle.dataset.id);
            if (item) total += item.points;
        });

        const valEl = document.getElementById('counselor-score-val');
        if (valEl) valEl.textContent = total;
    },

    async saveCounselorScore(counselorId) {
        const users = await Store.getUsers();
        const member = users.find(u => u.id === counselorId);
        if (!member) return;

        const scoreToggles = document.querySelectorAll('.counselor-toggle');
        const items = {};

        scoreToggles.forEach(toggle => {
            items[toggle.dataset.id] = toggle.checked;
        });

        const scoreData = { items };
        const saveDate = this.counselorScoringDate || Utils.getTodayKey();
        await Store.saveCounselorScore(counselorId, saveDate, scoreData);

        const isRetroactive = saveDate !== Utils.getTodayKey();
        Toast.show(isRetroactive ? `Avaliação salva para ${Utils.formatDate(saveDate)}!` : 'Avaliação salva com sucesso!', 'success');

        // Clear counselor scoring date
        this.counselorScoringDate = null;

        this.navigate('dashboard');
    },

    changeCounselorScoringDate(counselorId, newDate) {
        if (!newDate) return;
        this.counselorScoringDate = newDate;
        this.renderCounselorEvaluation(counselorId);
    },

    // ── Helper: build date range for ranking preset ─────────────────────────
    _rankingPresetRange(preset) {
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];

        if (preset === 'semana') {
            const d = new Date(today);
            d.setDate(d.getDate() - 6);
            return { start: d.toISOString().split('T')[0], end: todayKey, label: 'Esta Semana' };
        }
        if (preset === 'ano') {
            return { start: `${today.getFullYear()}-01-01`, end: todayKey, label: `Ano ${today.getFullYear()}` };
        }
        if (preset === 'hoje') {
            return { start: todayKey, end: todayKey, label: 'Hoje' };
        }
        // Default: 'mes'
        const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        return { start, end: todayKey, label: 'Mês Atual' };
    },

    async renderCounselorRanking(preset, customStart, customEnd) {
        Loading.show('Calculando ranking...');

        try {
            // Default to current month
            const activePreset = preset || this._rankingPreset || 'mes';
            this._rankingPreset = activePreset;

            const today = new Date().toISOString().split('T')[0];
            let rangeStart, rangeEnd, rangeLabel;

            if (activePreset === 'custom' && customStart && customEnd) {
                rangeStart = customStart;
                rangeEnd = customEnd;
                rangeLabel = `${Utils.formatDate(customStart)} – ${Utils.formatDate(customEnd)}`;
                this._rankingCustomStart = customStart;
                this._rankingCustomEnd = customEnd;
            } else if (activePreset === 'custom') {
                // Restore saved custom range if available
                rangeStart = this._rankingCustomStart || today;
                rangeEnd = this._rankingCustomEnd || today;
                rangeLabel = `${Utils.formatDate(rangeStart)} – ${Utils.formatDate(rangeEnd)}`;
            } else {
                const range = this._rankingPresetRange(activePreset);
                rangeStart = range.start;
                rangeEnd = range.end;
                rangeLabel = range.label;
            }

            // Fetch all scores in range to cache them before parallel calc
            await Store.fetchScoresRange(rangeStart, rangeEnd);

            // Fetch counselors from app_users table (role = 'Conselheiro' or 'super_admin' with unit)
            const allUsers = await Store.getUsers();
            const counselorUsers = allUsers.filter(u => 
                u.role && 
                (u.role.toLowerCase() === 'conselheiro' || u.role.toLowerCase() === 'super_admin') && 
                u.unidade_id
            );
            const units = await Store.getUnits();

            console.log(`📊 Ranking: Found ${counselorUsers.length} counselors from app_users`);

            const rankingsPromises = counselorUsers.map(async (counselor) => {
                const unit = units.find(u => u.id === counselor.unidade_id);
                if (!unit || unit.name.toUpperCase().includes('TESTE')) {
                    return null;
                }

                // 70%: Average points of desbravadores in this unit
                const unitData = await Utils.calculateUnitEfficiencyRange(unit.id, rangeStart, rangeEnd);
                // 30%: Personal counselor evaluation scores (toggles from counselor_scores)
                const personalData = await Utils.calculateCounselorPersonalScoreRange(counselor.id, rangeStart, rangeEnd);
                
                let finalScore = null;
                if (unitData.score !== null && personalData.score !== null) {
                    finalScore = (unitData.score * 0.7) + (personalData.score * 0.3);
                }

                return { 
                    counselor: { id: counselor.id, name: counselor.name }, 
                    unit, 
                    unitEfficiency: unitData.score, 
                    coverageText: unitData.coverageText,
                    evaluatedCount: unitData.evaluatedCount,
                    personalScore: personalData.score, 
                    finalScore 
                };
            });

            const rankings = (await Promise.all(rankingsPromises))
                .filter(r => r !== null) // Filters out the explicit null returned for 'TESTE' unit
                .sort((a, b) => {
                    if (a.finalScore === null && b.finalScore === null) return 0;
                    if (a.finalScore === null) return 1;
                    if (b.finalScore === null) return -1;
                    return b.finalScore - a.finalScore;
                });

            const medals = ['🥇', '🥈', '🥉'];
            const presets = [
                { id: 'hoje',   label: 'Hoje' },
                { id: 'semana', label: 'Semana' },
                { id: 'mes',    label: 'Mês' },
                { id: 'ano',    label: 'Ano' },
                { id: 'custom', label: 'Custom' },
            ];

            const html = `
            <div class="slide-in pb-20">
                <!-- Header -->
                <div class="text-center mb-5">
                    <div class="bg-brand-gold/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-brand-gold/30">
                        <i data-lucide="trophy" class="w-8 h-8 text-brand-gold"></i>
                    </div>
                    <h2 class="text-xl font-black text-white uppercase tracking-widest">Ranking de Conselheiros</h2>
                    <p class="text-xs text-slate-500 mt-1">Fórmula: (Eficiência × 70%) + (Pessoal × 30%)</p>
                </div>

                <!-- Preset Filters -->
                <div class="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                    ${presets.map(p => `
                        <button onclick="App.renderCounselorRanking('${p.id}')"
                                class="flex-shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs transition-all
                                       ${activePreset === p.id
                                           ? 'bg-brand-gold text-slate-900'
                                           : 'bg-slate-800 text-slate-400 hover:text-white'}">
                            ${p.label}
                        </button>
                    `).join('')}
                </div>

                <!-- Custom Range (shown only when custom is active) -->
                <div id="ranking-custom-range" class="${activePreset === 'custom' ? '' : 'hidden'} bg-slate-900 rounded-xl border border-slate-700 p-3 mb-4 flex gap-2 items-end">
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase">De</label>
                        <input type="date" id="ranking-start" value="${this._rankingCustomStart || rangeStart}" max="${today}"
                               class="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-gold">
                    </div>
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Até</label>
                        <input type="date" id="ranking-end" value="${this._rankingCustomEnd || today}" max="${today}"
                               class="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-gold">
                    </div>
                    <button onclick="App.applyRankingCustomRange()"
                            class="px-4 py-1.5 bg-brand-gold text-slate-900 rounded-lg font-bold text-sm whitespace-nowrap">
                        Filtrar
                    </button>
                </div>

                <!-- Period Label -->
                <div class="flex items-center gap-2 mb-4">
                    <i data-lucide="calendar-range" class="w-3.5 h-3.5 text-brand-gold shrink-0"></i>
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${rangeLabel}</span>
                </div>

                <!-- Rankings -->
                <div class="space-y-3">
                    ${rankings.filter(r => r.finalScore !== null).map((rank, index) => {
                        const medalIndex = index < 3 ? medals[index] : `${index + 1}º`;
                        return `
                        <div class="bg-slate-900 rounded-xl border ${index < 3 ? 'border-brand-gold/30' : 'border-slate-800'} p-4 shadow-sm">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl">${medalIndex}</span>
                                    <div>
                                        <h3 class="font-bold text-white text-sm">${Sanitizer.normalizeName(rank.counselor.name)}</h3>
                                        <p class="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">${rank.unit?.name || '—'}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-2xl font-black ${index < 3 ? 'text-brand-gold' : 'text-white'}">
                                        ${rank.finalScore.toFixed(1)}
                                    </p>
                                    <p class="text-[10px] text-slate-500 uppercase">Score</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                                <div class="bg-slate-950 rounded-lg p-2 relative">
                                    <div class="flex justify-between items-center mb-0.5">
                                        <p class="text-[10px] text-slate-500 uppercase tracking-wide">Eficiência (70%)</p>
                                        <span class="text-[8px] font-bold ${rank.evaluatedCount === 0 ? 'text-red-400 bg-red-400/10' : 'text-slate-400 bg-slate-800'} px-1.5 py-0.5 rounded" title="Cobertura: Membros Avaliados / Total">Cob: ${rank.coverageText}</span>
                                    </div>
                                    <p class="text-sm font-bold text-blue-400">${rank.unitEfficiency.toFixed(1)}%</p>
                                </div>
                                <div class="bg-slate-950 rounded-lg p-2">
                                    <p class="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Pessoal (30%)</p>
                                    <p class="text-sm font-bold ${rank.personalScore >= 80 ? 'text-green-400' : 'text-amber-500'}">${rank.personalScore.toFixed(1)}%</p>
                                </div>
                            </div>
                            <button onclick="App.navigate('counselor-evaluation', { counselorId: '${rank.counselor.id}' })"
                                    class="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg transition-colors font-bold uppercase tracking-wider">
                                Ver/Editar Avaliação
                            </button>
                        </div>
                        `;
                    }).join('')}
                </div>

                <!-- Pendentes de Avaliação -->
                ${rankings.some(r => r.finalScore === null) ? `
                    <div class="mt-8 mb-4 flex items-center justify-center gap-3 opacity-60">
                        <div class="h-px bg-slate-700 flex-1"></div>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendentes de Avaliação</span>
                        <div class="h-px bg-slate-700 flex-1"></div>
                    </div>
                    
                    <div class="space-y-3">
                        ${rankings.filter(r => r.finalScore === null).map(rank => {
                            let missingReason = 'Sem avaliação no período';
                            if (rank.unitEfficiency === null && rank.personalScore !== null) {
                                missingReason = 'Falta avaliação da Unidade';
                            } else if (rank.unitEfficiency !== null && rank.personalScore === null) {
                                missingReason = 'Falta avaliação Pessoal';
                            }
                            
                            return `
                            <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-sm opacity-70">
                                <div class="flex items-start justify-between mb-2">
                                    <div class="flex items-center gap-3">
                                        <div>
                                            <h3 class="font-bold text-white text-sm">${Sanitizer.normalizeName(rank.counselor.name)}</h3>
                                            <p class="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">${rank.unit?.name || '—'}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-2xl font-black text-slate-600">—</p>
                                        <p class="text-[10px] text-slate-500 uppercase">Pendente</p>
                                    </div>
                                </div>
                                
                                <div class="mb-3 px-2 py-1 rounded bg-amber-900/20 border border-amber-500/20 text-center">
                                    <span class="text-[10px] font-bold text-amber-500 tracking-wide uppercase">${missingReason}</span>
                                </div>

                                <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                                    <div class="bg-slate-950 rounded-lg p-2 relative opacity-50">
                                        <div class="flex justify-between items-center mb-0.5">
                                            <p class="text-[10px] text-slate-500 uppercase tracking-wide">Eficiência (70%)</p>
                                            <span class="text-[8px] font-bold ${rank.evaluatedCount === 0 ? 'text-red-400 bg-red-400/10' : 'text-slate-400 bg-slate-800'} px-1.5 py-0.5 rounded" title="Cobertura: Membros Avaliados / Total">Cob: ${rank.coverageText}</span>
                                        </div>
                                        <p class="text-sm font-bold ${rank.unitEfficiency !== null ? 'text-blue-400' : 'text-slate-600'}">${rank.unitEfficiency !== null ? rank.unitEfficiency.toFixed(1) + '%' : '—'}</p>
                                    </div>
                                    <div class="bg-slate-950 rounded-lg p-2 opacity-50">
                                        <p class="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wide">Pessoal (30%)</p>
                                        <p class="text-sm font-bold ${rank.personalScore !== null ? (rank.personalScore >= 80 ? 'text-green-400' : 'text-amber-500') : 'text-slate-600'}">${rank.personalScore !== null ? rank.personalScore.toFixed(1) + '%' : '—'}</p>
                                    </div>
                                </div>
                                <button onclick="App.navigate('counselor-evaluation', { counselorId: '${rank.counselor.id}' })"
                                        class="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg transition-colors font-bold uppercase tracking-wider">
                                    Ver/Editar Avaliação
                                </button>
                            </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}

                ${rankings.length === 0 ? `
                    <div class="text-center py-12">
                        <i data-lucide="users-round" class="w-16 h-16 text-slate-600 mx-auto mb-4"></i>
                        <p class="text-slate-500">Nenhuma avaliação no período</p>
                        <p class="text-xs text-slate-600 mt-2">${rangeLabel} — tente outro filtro</p>
                    </div>
                ` : ''}
            </div>
        `;

            this.mountPoint.innerHTML = html;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.toggleNavigation(true);
        } catch (error) {
            console.error('Erro ao carregar ranking:', error);
            Toast.show('Erro ao carregar ranking', 'error');
            this.navigate('dashboard');
        } finally {
            Loading.hide();
        }
    },

    applyRankingCustomRange() {
        const start = document.getElementById('ranking-start')?.value;
        const end = document.getElementById('ranking-end')?.value;
        if (!start || !end) return;
        if (start > end) { Toast.show('Data inicial maior que a final', 'error'); return; }
        this.renderCounselorRanking('custom', start, end);
    }
};
