import { Store } from '../data/store.js';
import { RBAC } from '../core/auth.js';
import { Utils } from './ui-utils.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { Toast } from '../ui/toast.js';
import { Loading } from '../ui/loading.js';
import { CONFIG } from '../config/constants.js';

// ── Prayer event status helpers ─────────────────────────────────────────────
const PRAYER_STATUS_MAP = {
    very_satisfactory: { label: 'Muito Satisfatório', emoji: '😊', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
    satisfactory: { label: 'Satisfatório', emoji: '🙂', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
    not_satisfactory: { label: 'Não Satisfatório', emoji: '😕', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
    absent: { label: 'Ausente', emoji: '😔', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
    pending: { label: 'Pendente', emoji: '⏳', color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' },
};

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const ReportMethods = {

    // ── Entry point ─────────────────────────────────────────────────────────
    async renderReport(startDate = null, endDate = null) {
        if (!RBAC.canViewReports()) {
            this.navigate('dashboard');
            return;
        }

        const todayKey = Utils.getTodayKey();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const defaultStart = startDate || thirtyDaysAgo.toISOString().split('T')[0];
        const defaultEnd = endDate || todayKey;

        this._reportRange = { start: defaultStart, end: defaultEnd };
        this._activeReportTab = this._activeReportTab || 'visao-geral';

        const html = `
            <div class="slide-in pb-32">
                <!-- Header -->
                <div class="flex items-center justify-between mb-5">
                    <div>
                        <h2 class="text-2xl font-black text-white uppercase tracking-wider">Relatórios</h2>
                        <p class="text-slate-400 text-sm">Análise e acompanhamento do clube</p>
                    </div>
                </div>

                <!-- Date Range (only for Visão Geral) -->
                <div id="rpt-daterange" class="bg-slate-900 rounded-xl border border-slate-700 p-3 mb-5 flex gap-2 items-end ${this._activeReportTab === 'visao-geral' ? '' : 'hidden'}">
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase">De</label>
                        <input type="date" id="rpt-start" value="${defaultStart}" max="${todayKey}"
                               class="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-gold">
                    </div>
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Até</label>
                        <input type="date" id="rpt-end" value="${defaultEnd}" max="${todayKey}"
                               class="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-gold">
                    </div>
                    <button onclick="App.applyReportDateFilter()"
                            class="px-4 py-1.5 bg-brand-gold text-slate-900 rounded-lg font-bold text-sm whitespace-nowrap">
                        Filtrar
                    </button>
                </div>

                <!-- 3 Main Tabs -->
                <div class="flex bg-slate-900 p-1 rounded-xl mb-5 gap-1">
                    ${[
                { id: 'visao-geral', icon: 'layout-dashboard', label: 'Visão Geral' },
                { id: 'consultas', icon: 'search', label: 'Consultas' },
                { id: 'auditoria', icon: 'shield-alert', label: 'Auditoria' },
                { id: 'analytics', icon: 'trending-up', label: 'Analytics' },
            ].map(t => `
                        <button onclick="App.setReportTab('${t.id}')" id="rpt-tab-${t.id}"
                                class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg font-bold text-xs transition-all
                                       ${this._activeReportTab === t.id ? 'bg-brand-gold text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}">
                            <i data-lucide="${t.icon}" class="w-3 h-3"></i>${t.label}
                        </button>
                    `).join('')}
                </div>

                <!-- Tab Content -->
                <div id="rpt-content"></div>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.toggleNavigation(true);
        await this.renderActiveReportTab();
    },

    setReportTab(tab) {
        this._activeReportTab = tab;
        // Update tab button styles
        ['visao-geral', 'consultas', 'auditoria', 'analytics'].forEach(t => {
            const btn = document.getElementById(`rpt-tab-${t}`);
            if (!btn) return;
            if (t === tab) {
                btn.className = btn.className.replace('text-slate-400 hover:text-white', 'bg-brand-gold text-slate-900 shadow-lg');
            } else {
                btn.className = btn.className.replace('bg-brand-gold text-slate-900 shadow-lg', 'text-slate-400 hover:text-white');
            }
        });
        // Show/hide date range (only useful for Visão Geral)
        const dr = document.getElementById('rpt-daterange');
        if (dr) dr.classList.toggle('hidden', tab !== 'visao-geral');
        this.renderActiveReportTab();
    },

    async renderActiveReportTab() {
        const container = document.getElementById('rpt-content');
        if (!container) return;
        container.innerHTML = `<div class="flex justify-center py-12 text-slate-500">
            <i data-lucide="loader" class="w-8 h-8 animate-spin"></i></div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const { start, end } = this._reportRange;

        switch (this._activeReportTab) {
            case 'visao-geral': await this._renderVisaoGeral(container, start, end); break;
            case 'consultas': await this._renderConsultas(container, start, end); break;
            case 'auditoria': await this._renderAuditoria(container); break;
            case 'analytics': await this._renderAnalytics(container); break;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    // ── Tab 1: Visão Geral (Club + Ranking + Alerts combined) ────────────────
    async _renderVisaoGeral(container, start, end) {
        Loading.show('Carregando visão geral...');
        await Store.fetchScoresRange(start, end);
        Loading.hide();

        container.innerHTML = `
            <div class="space-y-6">
                <!-- Pending Calls Audit (admin-only, top of page) -->
                <div id="vg-pending"></div>
                <!-- Club Stats Section -->
                <div>
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i data-lucide="bar-chart-2" class="w-3 h-3"></i>Estatísticas do Clube
                    </p>
                    <div id="vg-club"></div>
                </div>
                <!-- Ranking Section -->
                <div>
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i data-lucide="trophy" class="w-3 h-3"></i>Ranking de Unidades
                    </p>
                    <div id="vg-ranking"></div>
                </div>
                <!-- Alerts Section -->
                <div>
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <i data-lucide="alert-triangle" class="w-3 h-3"></i>Alertas de Presença
                    </p>
                    <div id="vg-alerts"></div>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Render each section independently into its container
        await this._renderPendingCallsWidget(document.getElementById('vg-pending'));
        await this._renderClubTab(document.getElementById('vg-club'), start, end);
        await this._renderRankingTab(document.getElementById('vg-ranking'), start, end);
        await this._renderAlertsTab(document.getElementById('vg-alerts'), start, end);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    // ── Admin-Only: Pending Roll Call Audit Widget ────────────────────────
    async _renderPendingCallsWidget(container) {
        if (!container) return;
        // Only visible to super admins
        if (!RBAC.isSuperAdmin()) { container.innerHTML = ''; return; }

        const THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
        const now = new Date();

        // Fetch session logs and all member/score data
        const [sessionLogs, allScores, members, units] = await Promise.all([
            Store.getSessionLogs(),
            Store.getScores(),
            Store.getMembers(),
            Store.getUnits()
        ]);

        // Determine the active members (exclude directors from pending check — they rarely score)
        const scorableMembers = members.filter(m => !['super_admin', 'diretor_de_clube'].includes(m.role?.toLowerCase()));

        // Find sessions older than 24h with pending members
        const pendingAlerts = [];

        for (const log of sessionLogs) {
            const firstLogAt = new Date(log.first_log_at);
            const elapsed = now - firstLogAt;
            if (elapsed < THRESHOLD_MS) continue; // still within 24h window

            const dayScores = allScores[log.session_date] || {};
            const pending = scorableMembers.filter(m => !dayScores[m.id]);

            if (pending.length > 0) {
                pendingAlerts.push({
                    date: log.session_date,
                    firstLog: firstLogAt,
                    triggeredBy: log.created_by,
                    pending
                });
            }
        }

        if (pendingAlerts.length === 0) { container.innerHTML = ''; return; }

        const totalPending = pendingAlerts.reduce((s, a) => s + a.pending.length, 0);

        container.innerHTML = `
            <div class="bg-red-900/20 border border-red-500/40 rounded-2xl overflow-hidden">
                <!-- Header -->
                <div class="flex items-center gap-3 p-4 border-b border-red-500/20 bg-red-900/30">
                    <div class="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                        <i data-lucide="clipboard-x" class="w-5 h-5 text-red-400"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-black text-red-300 text-sm uppercase tracking-wider">Chamadas Pendentes</h4>
                        <p class="text-[11px] text-red-400/80">
                            ${totalPending} desbravador${totalPending !== 1 ? 'es' : ''} ainda sem registro —
                            ${pendingAlerts.length} sessão${pendingAlerts.length !== 1 ? 'ões' : ''} afetada${pendingAlerts.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <span class="text-xs font-black text-red-400 bg-red-500/20 px-2 py-1 rounded-lg border border-red-500/30 shrink-0">
                        ⚠️ ${totalPending}
                    </span>
                </div>
                <!-- Per-session list (collapsible) -->
                <div class="divide-y divide-red-500/10">
                    ${pendingAlerts.map((alert, idx) => {
            const dateLabel = Utils.formatDate(alert.date);
            const elapsedH = Math.floor((now - alert.firstLog) / 3600000);
            const unit = (memberId) => { const m = members.find(x => x.id === memberId); const u = units.find(u => u.id === m?.unitId); return u?.name || '—'; };
            return `
                        <div class="p-3">
                            <button onclick="document.getElementById('pc-list-${idx}').classList.toggle('hidden')"
                                    class="w-full flex items-center justify-between gap-2 text-left">
                                <div>
                                    <p class="font-black text-white text-sm">${dateLabel}</p>
                                    <p class="text-[10px] text-red-400">
                                        Iniciada por ${alert.triggeredBy} — ${elapsedH}h atrás
                                    </p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-black text-red-300 bg-red-500/15 px-2 py-0.5 rounded-lg">
                                        ${alert.pending.length} pendente${alert.pending.length !== 1 ? 's' : ''}
                                    </span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-red-400"></i>
                                </div>
                            </button>
                            <!-- Expandable member list -->
                            <div id="pc-list-${idx}" class="hidden mt-3 space-y-1.5">
                                ${alert.pending.map(m => {
                const u = units.find(u => u.id === m.unitId);
                return `
                                    <div class="flex items-center gap-2.5 bg-red-950/40 rounded-xl px-3 py-2 border border-red-900/40">
                                        <div class="w-7 h-7 rounded-full bg-red-800/40 border border-red-700/30 flex items-center justify-center text-[10px] font-black text-red-300 shrink-0">
                                            ${m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-bold text-white truncate">${m.name}</p>
                                            <p class="text-[10px] text-red-400 font-bold uppercase">${u?.name || '—'}</p>
                                        </div>
                                        <span class="text-[10px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg shrink-0">⏳ Pendente</span>
                                    </div>`;
            }).join('')}
                            </div>
                        </div>`;
        }).join('')}
                </div>
                <p class="text-[10px] text-red-400/60 text-center pb-3">
                    Visível apenas para administradores — janela de 24h encerrada
                </p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    // ── Tab 2: Consultas (Eventos + Por Item with dropdown) ──────────────────
    async _renderConsultas(container, start, end) {
        const todayKey = Utils.getTodayKey();
        this._consultasType = this._consultasType || 'evento';

        container.innerHTML = `
            <div class="space-y-4">
                <!-- Query Type Selector -->
                <div class="bg-slate-900 rounded-2xl border border-slate-700 p-4">
                    <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tipo de Consulta</label>
                    <div class="flex bg-slate-950 p-1 rounded-xl gap-1">
                        <button onclick="App._setConsultasType('evento')" id="cq-tab-evento"
                                class="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
                                       ${this._consultasType === 'evento' ? 'bg-brand-gold text-slate-900 shadow' : 'text-slate-400 hover:text-white'}">
                            <i data-lucide="calendar-range" class="w-4 h-4"></i>Evento
                        </button>
                        <button onclick="App._setConsultasType('por-item')" id="cq-tab-por-item"
                                class="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
                                       ${this._consultasType === 'por-item' ? 'bg-brand-gold text-slate-900 shadow' : 'text-slate-400 hover:text-white'}">
                            <i data-lucide="filter" class="w-4 h-4"></i>Por Item
                        </button>
                    </div>
                </div>

                <!-- Dynamic content area -->
                <div id="cq-content"></div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Render the active query type
        const cqContent = document.getElementById('cq-content');
        if (this._consultasType === 'evento') {
            await this._renderEventTab(cqContent, start, end);
        } else {
            await this._renderItemTab(cqContent, start, end);
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _setConsultasType(type) {
        this._consultasType = type;
        ['evento', 'por-item'].forEach(t => {
            const btn = document.getElementById(`cq-tab-${t}`);
            if (!btn) return;
            if (t === type) {
                btn.className = btn.className.replace('text-slate-400 hover:text-white', 'bg-brand-gold text-slate-900 shadow');
            } else {
                btn.className = btn.className.replace('bg-brand-gold text-slate-900 shadow', 'text-slate-400 hover:text-white');
            }
        });
        const cqContent = document.getElementById('cq-content');
        if (!cqContent) return;
        const { start, end } = this._reportRange;
        if (type === 'evento') {
            this._renderEventTab(cqContent, start, end);
        } else {
            this._renderItemTab(cqContent, start, end);
        }
    },

    // ── Tab 1: Individual ────────────────────────────────────────────────────
    async _renderIndividualTab(container, start, end) {
        const members = await Store.getMembers();
        const units = await Store.getUnits();

        container.innerHTML = `
            <div class="space-y-4">
                <!-- Search -->
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                    <input type="text" id="rpt-member-search" placeholder="Buscar desbravador..."
                           oninput="App._filterMemberSearch(this.value)"
                           class="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-brand-gold">
                </div>
                <!-- Member list -->
                <div id="rpt-member-list" class="space-y-2 max-h-64 overflow-y-auto"></div>
                <!-- Individual report -->
                <div id="rpt-individual-report"></div>
            </div>
        `;
        this._allMembersForSearch = members.map(m => ({
            ...m, unitName: units.find(u => u.id === m.unitId)?.name || '—'
        }));
        this._filterMemberSearch('');
    },

    _filterMemberSearch(query) {
        const list = document.getElementById('rpt-member-list');
        if (!list) return;
        const filtered = query.length < 1
            ? this._allMembersForSearch
            : this._allMembersForSearch.filter(m =>
                Sanitizer.normalizeName(m.name).toLowerCase().includes(query.toLowerCase()));

        if (filtered.length === 0) {
            list.innerHTML = `<p class="text-center text-slate-500 text-sm py-4">Nenhum resultado</p>`;
            return;
        }
        list.innerHTML = filtered.slice(0, 20).map(m => `
            <div onclick="App._showMemberReport('${m.id}')"
                 class="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl p-3 cursor-pointer transition-colors">
                <div class="w-8 h-8 rounded-full bg-brand-navy/30 border border-brand-gold/30 flex items-center justify-center text-xs font-black text-brand-gold">
                    ${Sanitizer.normalizeName(m.name).split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-white text-sm truncate">${Sanitizer.normalizeName(m.name)}</p>
                    <p class="text-[10px] text-slate-500 uppercase font-bold">${m.unitName}</p>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-600"></i>
            </div>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async _showMemberReport(memberId) {
        const reportEl = document.getElementById('rpt-individual-report');
        if (!reportEl) return;

        const members = await Store.getMembers();
        const units = await Store.getUnits();
        const allScores = await Store.getScores();
        const member = members.find(m => m.id === memberId);
        if (!member) return;
        const unit = units.find(u => u.id === member.unitId);

        const { start, end } = this._reportRange;

        const meetings = await Store.getMeetings();
        const meetingDates = meetings.map(m => m.date);

        // Prayer days from data
        const prayerDaysData = [];
        let totalDays = 0, presentDays = 0, absentDays = 0, pendingDays = 0, totalPoints = 0;

        for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const isMeeting = meetingDates.includes(dateKey);
            const dayScores = allScores[dateKey] || {};
            const score = dayScores[memberId];

            if (score) {
                totalDays++;
                if (score.isAbsent) {
                    absentDays++;
                } else {
                    presentDays++;
                    totalPoints += Utils.countTotal(score);
                }
                // Prayer
                if (score.items && score.items[CONFIG.PRAYER_EVENT.id]) {
                    prayerDaysData.push({ dateKey, weekday: Utils.WEEK_DAYS[d.getDay()], status: score.items[CONFIG.PRAYER_EVENT.id] });
                }
            } else if (isMeeting) {
                totalDays++;
                pendingDays++;
                // Push as pending to timeline
                prayerDaysData.push({ dateKey, weekday: Utils.WEEK_DAYS[d.getDay()], status: 'pending' });
            }
        }

        const presencePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        const barColor = presencePct >= 80 ? 'bg-green-500' : presencePct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
        const pctColor = presencePct >= 80 ? 'text-green-400' : presencePct >= 50 ? 'text-yellow-400' : 'text-red-400';

        const prayerSection = prayerDaysData.length === 0 ? `
            <p class="text-slate-500 text-sm text-center py-4 italic">Nenhum registro de oração no período</p>
        ` : prayerDaysData.map(day => {
            const info = PRAYER_STATUS_MAP[day.status] || { label: day.status, emoji: '❓', color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' };
            return `
            <div class="flex items-center justify-between border ${info.bg} rounded-xl px-4 py-2.5">
                <div>
                    <p class="text-xs font-black text-slate-300">${Utils.formatDate(day.dateKey)}</p>
                    <p class="text-[10px] text-slate-500 uppercase font-bold">${day.weekday}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-lg">${info.emoji}</span>
                    <span class="text-xs font-bold ${info.color}">${info.label}</span>
                </div>
            </div>`;
        }).join('');

        // ── Per-item metric counters ──────────────────────────────────────────
        const itemCounts = {};
        CONFIG.SCORE_ITEMS.forEach(item => { itemCounts[item.id] = 0; });
        let evaluatedSessions = 0; // sessions where member was present (score exists + not absent)

        for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const score = (allScores[dateKey] || {})[memberId];
            if (score && !score.isAbsent && score.items) {
                evaluatedSessions++;
                CONFIG.SCORE_ITEMS.forEach(item => {
                    if (score.items[item.id] === true) itemCounts[item.id]++;
                });
            }
        }

        const itemMetricsHtml = CONFIG.SCORE_ITEMS.map(item => {
            const count = itemCounts[item.id];
            const pct = evaluatedSessions > 0 ? Math.round((count / evaluatedSessions) * 100) : 0;
            // 4-color scale: Green (80+), Yellow (50+), Orange (25+), Red (<25)
            const barCol = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : pct >= 25 ? 'bg-orange-500' : 'bg-red-500';
            const textCol = pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : pct >= 25 ? 'text-orange-400' : 'text-red-400';
            return `
            <div class="bg-slate-950 rounded-xl p-3 border border-slate-800">
                <div class="flex items-center justify-between mb-1.5">
                    <p class="text-[11px] font-bold text-slate-300 truncate">${item.name}</p>
                    <span class="text-[11px] font-black ${textCol} ml-2 shrink-0">${count}/${evaluatedSessions}</span>
                </div>
                <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div class="${barCol} h-1.5 rounded-full transition-all" style="width:${pct}%"></div>
                </div>
            </div>`;
        }).join('');

        reportEl.innerHTML = `
            <div class="mt-4 space-y-4 border-t border-slate-800 pt-4">
                <!-- Header -->
                <div class="bg-slate-900 rounded-2xl border border-slate-700 p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-12 h-12 rounded-full bg-brand-navy/30 border-2 border-brand-gold/40 flex items-center justify-center text-brand-gold font-black text-lg">
                            ${Sanitizer.normalizeName(member.name).split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                            <h3 class="font-black text-white text-base">${Sanitizer.normalizeName(member.name)}</h3>
                            <p class="text-xs text-slate-500 uppercase font-bold tracking-widest">${unit?.name || '—'} · ${member.role || 'Desbravador'}</p>
                        </div>
                    </div>
                    <!-- Stats -->
                    <div class="grid grid-cols-4 gap-2 mb-3">
                        <div class="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                            <p class="text-[10px] text-slate-500 uppercase font-bold">Presenças</p>
                            <p class="text-xl font-black text-green-400">${presentDays}</p>
                        </div>
                        <div class="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                            <p class="text-[10px] text-slate-500 uppercase font-bold">Faltas</p>
                            <p class="text-xl font-black text-red-400">${absentDays}</p>
                        </div>
                        <div class="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                            <p class="text-[10px] text-slate-500 uppercase font-bold">Pontos</p>
                            <p class="text-xl font-black text-brand-gold">${totalPoints}</p>
                        </div>
                        <div class="bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                            <p class="text-[10px] text-slate-400 uppercase font-bold">Pendente</p>
                            <p class="text-xl font-black text-slate-500">${pendingDays}</p>
                        </div>
                    </div>
                    <!-- Presence bar -->
                    <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div class="${barColor} h-2 rounded-full transition-all" style="width:${presencePct}%"></div>
                        </div>
                        <span class="text-xs font-black ${pctColor}">${presencePct}% presença</span>
                    </div>
                </div>

                <!-- Per-item metrics -->
                ${evaluatedSessions > 0 ? `
                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <i data-lucide="list-checks" class="w-4 h-4 text-brand-gold"></i>
                        <h4 class="font-black text-white text-sm uppercase tracking-wider">Itens por Sessão</h4>
                        <span class="text-xs text-slate-500 font-bold">(${evaluatedSessions} sessões avaliadas)</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2">${itemMetricsHtml}</div>
                </div>` : ''}

                <!-- 10 Dias de Oração -->
                ${prayerDaysData.length > 0 ? `
                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <i data-lucide="star" class="w-4 h-4 text-brand-gold"></i>
                        <h4 class="font-black text-white text-sm uppercase tracking-wider">10 Dias de Oração</h4>
                        <span class="text-xs text-slate-500 font-bold">(${prayerDaysData.length} registro${prayerDaysData.length !== 1 ? 's' : ''})</span>
                    </div>
                    <div class="space-y-2">${prayerSection}</div>
                </div>
                ` : `
                <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 text-center">
                    <i data-lucide="star" class="w-8 h-8 text-slate-700 mx-auto mb-2"></i>
                    <p class="text-slate-500 text-sm">Sem registros de oração no período</p>
                </div>
                `}
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        reportEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // ── Tab 2: Club Dashboard ────────────────────────────────────────────────
    async _renderClubTab(container, start, end) {
        const members = await Store.getMembers();
        const units = await Store.getUnits();
        const allScores = await Store.getScores();

        // Role counts
        const roleCounts = members.reduce((acc, m) => {
            const r = (m.role || 'DESBRAVADOR').toLowerCase();
            acc[r] = (acc[r] || 0) + 1;
            return acc;
        }, {});

        // Monthly points accumulation
        const monthlyPoints = {};
        for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const dayScores = allScores[dateKey] || {};
            if (Object.keys(dayScores).length === 0) continue;
            const month = dateKey.substring(0, 7); // YYYY-MM
            if (!monthlyPoints[month]) monthlyPoints[month] = 0;
            Object.values(dayScores).forEach(s => {
                if (!s.isAbsent) monthlyPoints[month] += Utils.countTotal(s);
            });
        }

        // Presence over period
        let totalEvaluated = 0, totalPresent = 0, totalEvaluationDays = 0;
        for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const dayScores = allScores[dateKey] || {};
            if (Object.keys(dayScores).length === 0) continue;
            totalEvaluationDays++;
            Object.values(dayScores).forEach(s => {
                totalEvaluated++;
                if (!s.isAbsent) totalPresent++;
            });
        }
        const avgPresencePct = totalEvaluated > 0 ? Math.round((totalPresent / totalEvaluated) * 100) : 0;
        const barColor2 = avgPresencePct >= 80 ? 'bg-green-500' : avgPresencePct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
        const pctColor2 = avgPresencePct >= 80 ? 'text-green-400' : avgPresencePct >= 50 ? 'text-yellow-400' : 'text-red-400';

        const roleLabels = {
            'desbravador': 'Desbravadores',
            'conselheiro': 'Conselheiros',
            'instrutor': 'Instrutores',
            'diretor_de_clube': 'Diretores',
            'super_admin': 'Administradores',
        };
        const roleIcons = {
            'desbravador': 'users', 'conselheiro': 'shield', 'instrutor': 'book-open',
            'diretor_de_clube': 'crown', 'super_admin': 'star'
        };

        const monthKeys = Object.keys(monthlyPoints).sort();
        const monthLabels = monthKeys.map(m => {
            const [y, mo] = m.split('-');
            return new Date(+y, +mo - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        });
        const maxPts = Math.max(...Object.values(monthlyPoints), 1);

        container.innerHTML = `
            <div class="space-y-4">
                <!-- Members by role -->
                <div class="bg-slate-900 rounded-2xl border border-slate-700 p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <i data-lucide="users" class="w-4 h-4 text-brand-gold"></i>
                        <h4 class="font-black text-white text-sm uppercase tracking-wider">Membros Ativos</h4>
                        <span class="ml-auto text-brand-gold font-black">${members.length} total</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        ${Object.entries(roleCounts).map(([role, count]) => `
                            <div class="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center gap-2">
                                <i data-lucide="${roleIcons[role] || 'user'}" class="w-4 h-4 text-brand-gold flex-shrink-0"></i>
                                <div>
                                    <p class="text-white font-black text-lg leading-none">${count}</p>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold">${roleLabels[role] || role}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Presence -->
                <div class="bg-slate-900 rounded-2xl border border-slate-700 p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <i data-lucide="calendar-check" class="w-4 h-4 text-brand-gold"></i>
                        <h4 class="font-black text-white text-sm uppercase tracking-wider">Presença Média</h4>
                    </div>
                    <p class="text-[10px] text-slate-500 mb-2">${totalEvaluationDays} dia(s) com avaliação no período</p>
                    <div class="flex items-center gap-3">
                        <div class="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                            <div class="${barColor2} h-3 rounded-full" style="width:${avgPresencePct}%"></div>
                        </div>
                        <span class="font-black text-lg ${pctColor2}">${avgPresencePct}%</span>
                    </div>
                    <div class="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>✅ ${totalPresent} presenças</span>
                        <span>❌ ${totalEvaluated - totalPresent} ausências</span>
                    </div>
                </div>

                <!-- Monthly points chart -->
                ${monthKeys.length === 0 ? '' : `
                <div class="bg-slate-900 rounded-2xl border border-slate-700 p-4">
                    <div class="flex items-center gap-2 mb-4">
                        <i data-lucide="bar-chart-2" class="w-4 h-4 text-brand-gold"></i>
                        <h4 class="font-black text-white text-sm uppercase tracking-wider">Pontos por Mês</h4>
                    </div>
                    <div class="flex items-end gap-2 h-32">
                        ${monthKeys.map((m, i) => {
            const pct = Math.round((monthlyPoints[m] / maxPts) * 100);
            return `
                            <div class="flex-1 flex flex-col items-center gap-1">
                                <span class="text-[9px] text-slate-400 font-bold">${monthlyPoints[m]}</span>
                                <div class="w-full bg-brand-gold/20 rounded-t-lg overflow-hidden" style="height:96px">
                                    <div class="bg-brand-gold rounded-t-lg w-full transition-all" style="height:${pct}%;margin-top:${100 - pct}%"></div>
                                </div>
                                <span class="text-[9px] text-slate-500 text-center">${monthLabels[i]}</span>
                            </div>`;
        }).join('')}
                    </div>
                </div>
                `}
            </div>
        `;
    },

    // ── Tab 3: Unit Ranking ──────────────────────────────────────────────────
    async _renderRankingTab(container, start, end) {
        const units = await Store.getUnits();
        const members = await Store.getMembers();
        const allScores = await Store.getScores();

        const unitStats = units.map(unit => {
            const unitMembers = members.filter(m => m.unitId === unit.id);
            let totalPoints = 0, totalPresent = 0, totalEvals = 0;

            unitMembers.forEach(member => {
                for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
                    const dateKey = d.toISOString().split('T')[0];
                    const score = (allScores[dateKey] || {})[member.id];
                    if (!score) continue;
                    totalEvals++;
                    if (!score.isAbsent) {
                        totalPresent++;
                        totalPoints += Utils.countTotal(score);
                    }
                }
            });

            const avgPts = unitMembers.length > 0 ? Math.round(totalPoints / (unitMembers.length || 1)) : 0;
            const presencePct = totalEvals > 0 ? Math.round((totalPresent / totalEvals) * 100) : 0;
            return { ...unit, avgPts, totalPoints, presencePct, memberCount: unitMembers.length };
        }).filter(u => u.memberCount > 0).sort((a, b) => b.avgPts - a.avgPts);

        const MEDALS = ['🥇', '🥈', '🥉'];

        container.innerHTML = `
            <div class="space-y-3">
                ${unitStats.length === 0 ? '<p class="text-center text-slate-500 py-8">Sem dados no período</p>' :
                unitStats.map((unit, i) => {
                    const medal = MEDALS[i] || `#${i + 1}`;
                    const barPct = unitStats[0].avgPts > 0 ? Math.round((unit.avgPts / unitStats[0].avgPts) * 100) : 0;
                    const presColor = unit.presencePct >= 80 ? 'text-green-400' : unit.presencePct >= 50 ? 'text-yellow-400' : 'text-red-400';
                    return `
                    <div class="bg-slate-900 rounded-2xl border ${i === 0 ? 'border-brand-gold/40' : 'border-slate-700'} p-4">
                        <div class="flex items-center gap-3 mb-3">
                            <span class="text-2xl">${medal}</span>
                            <div class="flex-1">
                                <h4 class="font-black text-white">${unit.name}</h4>
                                <p class="text-[10px] text-slate-500 uppercase font-bold">${unit.memberCount} membros</p>
                            </div>
                            <div class="text-right">
                                <p class="text-brand-gold font-black text-xl">${unit.avgPts}</p>
                                <p class="text-[10px] text-slate-500">pts/membro</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <div class="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div class="bg-brand-gold h-1.5 rounded-full" style="width:${barPct}%"></div>
                            </div>
                            <span class="text-[10px] text-slate-400">${unit.totalPoints} pts total</span>
                        </div>
                        <div class="text-xs ${presColor} font-bold">📅 ${unit.presencePct}% de presença</div>
                    </div>`;
                }).join('')}
            </div>
        `;
    },

    // ── Tab 4: Dropout Alerts ────────────────────────────────────────────────
    async _renderAlertsTab(container, start, end) {
        const members = await Store.getMembers();
        const units = await Store.getUnits();
        const allScores = await Store.getScores();

        const alerts = [];

        members.forEach(member => {
            let consecutiveAbsences = 0;
            let maxConsecutive = 0;
            let totalEvals = 0, totalAbsent = 0;
            const datesEvaluated = [];

            for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                const score = (allScores[dateKey] || {})[member.id];
                if (!score) continue;
                datesEvaluated.push(dateKey);
                totalEvals++;
                if (score.isAbsent) {
                    totalAbsent++;
                    consecutiveAbsences++;
                    maxConsecutive = Math.max(maxConsecutive, consecutiveAbsences);
                } else {
                    consecutiveAbsences = 0;
                }
            }

            if (totalEvals === 0) return;
            const absencePct = Math.round((totalAbsent / totalEvals) * 100);
            const isAlert = maxConsecutive >= 3 || absencePct >= 50;

            if (isAlert) {
                const unit = units.find(u => u.id === member.unitId);
                alerts.push({ member, unit, maxConsecutive, absencePct, totalEvals, totalAbsent });
            }
        });

        alerts.sort((a, b) => b.maxConsecutive - a.maxConsecutive || b.absencePct - a.absencePct);

        const whatsappText = alerts.length === 0 ? '' :
            `*⚠️ ALERTA DE DESISTÊNCIA*\n\n` +
            alerts.map(a =>
                `• ${Sanitizer.normalizeName(a.member.name)} (${a.unit?.name || '—'}): ${a.absencePct}% de ausências`
            ).join('\n');

        container.innerHTML = `
            <div class="space-y-4">
                ${alerts.length === 0 ? `
                    <div class="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
                        <span class="text-4xl">🎉</span>
                        <h4 class="font-black text-green-400 mt-2">Nenhum alerta!</h4>
                        <p class="text-slate-500 text-sm">Todos os desbravadores estão com presença saudável no período.</p>
                    </div>
                ` : `
                    <div class="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex gap-2 items-start">
                        <i data-lucide="alert-triangle" class="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5"></i>
                        <p class="text-xs text-orange-200"><strong>${alerts.length} alerta(s)</strong> — membros com 3+ ausências consecutivas OU mais de 50% de ausências no período.</p>
                    </div>

                    <div class="space-y-3">
                        ${alerts.map(a => {
            const danger = a.maxConsecutive >= 5 || a.absencePct >= 70;
            const borderColor = danger ? 'border-red-500/40' : 'border-orange-500/30';
            const tagColor = danger ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400';
            return `
                            <div class="bg-slate-900 rounded-2xl border ${borderColor} p-4">
                                <div class="flex items-center gap-3 mb-2">
                                    <div class="w-9 h-9 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center text-xs font-black text-red-400">
                                        ${Sanitizer.normalizeName(a.member.name).split(' ').map(n => n[0]).slice(0, 2).join('')}
                                    </div>
                                    <div class="flex-1">
                                        <h5 class="font-bold text-white text-sm">${Sanitizer.normalizeName(a.member.name)}</h5>
                                        <p class="text-[10px] text-slate-500 uppercase font-bold">${a.unit?.name || '—'}</p>
                                    </div>
                                    <span class="text-xs font-black px-2 py-1 rounded-lg ${tagColor}">
                                        ${a.absencePct}% ausente
                                    </span>
                                </div>
                                <div class="flex gap-3 text-xs text-slate-400">
                                    ${a.maxConsecutive >= 3 ? `<span>🔴 ${a.maxConsecutive} ausências seguidas</span>` : ''}
                                    <span>📊 ${a.totalAbsent}/${a.totalEvals} dias ausente</span>
                                </div>
                            </div>`;
        }).join('')}
                    </div>

                    ${whatsappText ? `
                    <a href="${Utils.generateWhatsAppLink(whatsappText)}" target="_blank"
                       class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-900/20 border border-green-900/30 text-green-400 font-bold text-sm hover:bg-green-900/30 transition-colors no-underline">
                        <i data-lucide="message-circle" class="w-4 h-4"></i>
                        Compartilhar via WhatsApp
                    </a>
                    ` : ''}
                `}
            </div>
        `;
    },

    // ── Date filter ─────────────────────────────────────────────────────────
    applyReportDateFilter() {
        const start = document.getElementById('rpt-start')?.value;
        const end = document.getElementById('rpt-end')?.value;
        if (!start || !end) { Toast.show('Selecione ambas as datas', 'error'); return; }
        if (new Date(start) > new Date(end)) { Toast.show('Data inicial maior que final', 'error'); return; }
        this._reportRange = { start, end };
        this.renderActiveReportTab();
    },

    setAnalyticsMonth(month) {
        this._analyticsMonth = month;
        this.renderActiveReportTab();
    },

    async exportAnalyticsCSV() {
        try {
            const [allMembers, allUnits, allScores, meetings] = await Promise.all([
                Store.getMembers(),
                Store.getUnits(),
                Store.getScores(),
                Store.getMeetings()
            ]);

            const visibleUnits = RBAC.filterUnits(allUnits);
            const unitMap = {};
            visibleUnits.forEach(u => unitMap[u.id] = u.name);

            const selectedMonth = this._analyticsMonth || new Date().toISOString().substring(0, 7);
            const monthMeetings = meetings.filter(m => m.date.startsWith(selectedMonth));

            const ITEM_POINTS = {};
            [...CONFIG.SCORE_ITEMS, ...CONFIG.IMPACTO_EVENT.items, ...CONFIG.HOLY_WEEK_EVENT.items]
                .forEach(i => { ITEM_POINTS[i.id] = i.points; });

            const rows = [['Mês', 'Unidade', 'Membro', 'Reuniões Elegíveis', 'Pontos', 'Média/Reunião']];

            const activeMembers = allMembers.filter(m => !m.isCounselor && visibleUnits.some(u => u.id === m.unitId));
            activeMembers.forEach(member => {
                const joinedAt = member.joinedAt || '2000-01-01';
                const eligible = monthMeetings.filter(m => m.date >= joinedAt);
                let total = 0;
                eligible.forEach(m => {
                    const s = (allScores[m.date] || {})[member.id];
                    if (s && !s.is_absent) {
                        Object.entries(s.items || {}).forEach(([id, val]) => {
                            if (val === true && ITEM_POINTS[id]) total += ITEM_POINTS[id];
                        });
                    }
                });
                rows.push([
                    selectedMonth,
                    unitMap[member.unitId] || 'Sem Unidade',
                    Sanitizer.normalizeName(member.name),
                    eligible.length,
                    total,
                    eligible.length > 0 ? (total / eligible.length).toFixed(1) : '0.0'
                ]);
            });

            const csv = '\uFEFF' + rows.map(r => r.join(';')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const a = Object.assign(document.createElement('a'), {
                href: URL.createObjectURL(blob),
                download: `analytics_${selectedMonth}.csv`
            });
            a.click();
            Toast.show('CSV Exportado!', 'success');
        } catch (e) {
            console.error('Export error:', e);
            Toast.show('Erro ao exportar CSV', 'error');
        }
    },

    // ── Tab: Por Item ────────────────────────────────────────────────────────
    async _renderItemTab(container, start, end) {
        const todayKey = Utils.getTodayKey();

        // Build metric options from SCORE_ITEMS + attendance pseudo-item
        const metrics = [
            { id: '__present__', name: '✅ Presença (Compareceu)' },
            { id: '__absent__', name: '❌ Falta (Ausente)' },
            ...CONFIG.SCORE_ITEMS.map(item => ({ id: item.id, name: item.name }))
        ];

        container.innerHTML = `
            <div class="space-y-4">
                <!-- Filters -->
                <div class="bg-slate-900 rounded-2xl border border-slate-700 p-4 space-y-3">
                    <div class="flex items-center gap-2 mb-1">
                        <i data-lucide="filter" class="w-4 h-4 text-brand-gold"></i>
                        <h4 class="font-black text-white text-sm uppercase tracking-wider">Filtrar por Item</h4>
                    </div>
                    <!-- Metric selector -->
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Item / Métrica</label>
                        <select id="item-metric-select"
                                class="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-brand-gold">
                            ${metrics.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                    </div>
                    <!-- Date range preset -->
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Período</label>
                        <div class="flex gap-2 mb-2">
                            <button onclick="App._setItemPreset('quinzena')" class="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-brand-gold/20 hover:text-brand-gold transition-all">Quinzena</button>
                            <button onclick="App._setItemPreset('mes')" class="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-brand-gold/20 hover:text-brand-gold transition-all">Mês Atual</button>
                            <button onclick="App._setItemPreset('custom')" class="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-brand-gold/20 hover:text-brand-gold transition-all">Personalizado</button>
                        </div>
                        <div class="flex gap-2">
                            <input type="date" id="item-start" value="${start}" max="${todayKey}"
                                   class="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-gold">
                            <input type="date" id="item-end" value="${end}" max="${todayKey}"
                                   class="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-gold">
                        </div>
                    </div>
                    <button onclick="App._runItemReport()"
                            class="w-full py-3 bg-brand-gold text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <i data-lucide="search" class="w-4 h-4"></i> Gerar Relatório
                    </button>
                </div>
                <!-- Results -->
                <div id="item-report-results"></div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _setItemPreset(preset) {
        const today = new Date();
        let start, end;
        end = today.toISOString().split('T')[0];

        if (preset === 'quinzena') {
            const d = new Date(today);
            d.setDate(d.getDate() - 14);
            start = d.toISOString().split('T')[0];
        } else if (preset === 'mes') {
            start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        } else {
            // focus the start date input for custom
            document.getElementById('item-start')?.focus();
            return;
        }

        const s = document.getElementById('item-start');
        const e = document.getElementById('item-end');
        if (s) s.value = start;
        if (e) e.value = end;
    },

    async _runItemReport() {
        const metricId = document.getElementById('item-metric-select')?.value;
        const start = document.getElementById('item-start')?.value;
        const end = document.getElementById('item-end')?.value;
        const resultsEl = document.getElementById('item-report-results');
        if (!metricId || !start || !end || !resultsEl) return;

        resultsEl.innerHTML = `<div class="flex justify-center py-8 text-slate-500"><i data-lucide="loader" class="w-6 h-6 animate-spin"></i></div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        Loading.show('Buscando dados...');
        await Store.fetchScoresRange(start, end);
        Loading.hide();

        const allScores = await Store.getScores();
        const members = await Store.getMembers();
        const units = await Store.getUnits();

        // Collect results: { dateKey, memberId, passed }
        const hits = []; // { dateKey, member, unit }

        for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const dayScores = allScores[dateKey] || {};

            members.forEach(member => {
                const score = dayScores[member.id];
                if (!score) return;

                let passed = false;
                if (metricId === '__present__') {
                    passed = !score.isAbsent;
                } else if (metricId === '__absent__') {
                    passed = score.isAbsent === true;
                } else {
                    passed = !score.isAbsent && score.items && score.items[metricId] === true;
                }

                if (passed) {
                    const unit = units.find(u => u.id === member.unitId);
                    hits.push({ dateKey, member, unit });
                }
            });
        }

        // Group by date
        const byDate = {};
        hits.forEach(h => {
            if (!byDate[h.dateKey]) byDate[h.dateKey] = [];
            byDate[h.dateKey].push(h);
        });

        const metricLabel = document.getElementById('item-metric-select')?.options[
            document.getElementById('item-metric-select').selectedIndex
        ]?.text || metricId;

        if (hits.length === 0) {
            resultsEl.innerHTML = `
                <div class="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
                    <i data-lucide="inbox" class="w-10 h-10 text-slate-700 mx-auto mb-3"></i>
                    <p class="text-slate-400 font-bold">Nenhum resultado encontrado</p>
                    <p class="text-slate-600 text-sm mt-1">Nenhum desbravador atingiu esse critério no período.</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        const dateKeys = Object.keys(byDate).sort().reverse(); // most recent first
        resultsEl.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">${metricLabel}</p>
                    <span class="text-xs font-black text-brand-gold bg-brand-gold/10 px-2 py-1 rounded-lg border border-brand-gold/20">${hits.length} resultado${hits.length !== 1 ? 's' : ''}</span>
                </div>
                ${dateKeys.map(dateKey => {
            const group = byDate[dateKey];
            return `
                    <div class="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
                        <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-800/50">
                            <p class="text-xs font-black text-white">${Utils.formatDate(dateKey)}</p>
                            <span class="text-[10px] font-bold text-slate-400">${group.length} desbravador${group.length !== 1 ? 'es' : ''}</span>
                        </div>
                        <div class="divide-y divide-slate-800/50">
                            ${group.map(h => `
                            <div class="flex items-center gap-3 px-4 py-2.5">
                                <div class="w-7 h-7 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-[10px] font-black text-brand-gold shrink-0">
                                    ${Sanitizer.normalizeName(h.member.name).split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-bold text-white truncate">${Sanitizer.normalizeName(h.member.name)}</p>
                                    <p class="text-[10px] text-slate-500 font-bold uppercase">${h.unit?.name || '—'}</p>
                                </div>
                            </div>`).join('')}
                        </div>
                    </div>`;
        }).join('')}
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    // ── Tab: Por Evento ──────────────────────────────────────────────────────

    async _renderEventTab(container, start, end) {

        const todayKey = Utils.getTodayKey();

        container.innerHTML = `

            <div class="space-y-4">

                <div class="bg-slate-900 rounded-2xl border border-slate-700 p-4 space-y-3">

                    <div class="flex items-center gap-2 mb-1">

                        <i data-lucide="calendar-range" class="w-4 h-4 text-brand-gold"></i>

                        <h4 class="font-black text-white text-sm uppercase tracking-wider">Relatório por Evento</h4>

                    </div>

                    <div>

                        <label class="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Preset de Evento</label>

                        <div class="grid grid-cols-2 gap-2 mb-3">

                            <button onclick="App._setEventPreset('10dias')" class="py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-brand-gold/20 hover:text-brand-gold transition-all flex items-center justify-center gap-1.5">

                                <i data-lucide="star" class="w-3 h-3"></i>10 Dias de Oração

                            </button>

                            <button onclick="App._setEventPreset('mes')" class="py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-brand-gold/20 hover:text-brand-gold transition-all flex items-center justify-center gap-1.5">

                                <i data-lucide="calendar" class="w-3 h-3"></i>Mês Atual

                            </button>

                            <button onclick="App._setEventPreset('quinzena')" class="py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-brand-gold/20 hover:text-brand-gold transition-all flex items-center justify-center gap-1.5">

                                <i data-lucide="calendar-days" class="w-3 h-3"></i>Quinzena

                            </button>

                            <button onclick="App._setEventPreset('custom')" class="py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-brand-gold/20 hover:text-brand-gold transition-all flex items-center justify-center gap-1.5">

                                <i data-lucide="sliders" class="w-3 h-3"></i>Personalizado

                            </button>

                        </div>

                        <label class="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Nome do Evento (opcional)</label>

                        <input type="text" id="evento-name" placeholder="Ex: Acampamento de Verão 2026"

                               class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-brand-gold mb-2">

                        <div class="flex gap-2">

                            <input type="date" id="evento-start" value="${start}" max="${todayKey}"

                                   class="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-gold">

                            <input type="date" id="evento-end" value="${end}" max="${todayKey}"

                                   class="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-brand-gold">

                        </div>

                    </div>

                    <button onclick="App._runEventReport()"

                            class="w-full py-3 bg-brand-gold text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">

                        <i data-lucide="bar-chart-2" class="w-4 h-4"></i> Gerar Relatório do Evento

                    </button>

                </div>

                <div id="evento-results"></div>

            </div>

        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

    },

    _setEventPreset(preset) {

        const today = new Date();

        const end = today.toISOString().split('T')[0];

        let start, name;

        if (preset === '10dias') {

            const d = new Date(today); d.setDate(d.getDate() - 9);

            start = d.toISOString().split('T')[0]; name = '10 Dias de Oração';

        } else if (preset === 'mes') {

            start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

            name = `Mês ${today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;

        } else if (preset === 'quinzena') {

            const d = new Date(today); d.setDate(d.getDate() - 14);

            start = d.toISOString().split('T')[0]; name = 'Quinzena';

        } else { document.getElementById('evento-start')?.focus(); return; }

        const s = document.getElementById('evento-start');

        const e = document.getElementById('evento-end');

        const n = document.getElementById('evento-name');

        if (s) s.value = start;

        if (e) e.value = end;

        if (n && name) n.value = name;

    },

    async _runEventReport() {

        const start = document.getElementById('evento-start')?.value;

        const end = document.getElementById('evento-end')?.value;

        const evName = document.getElementById('evento-name')?.value?.trim() || 'Evento';

        const resultsEl = document.getElementById('evento-results');

        if (!start || !end || !resultsEl) return;

        if (new Date(start) > new Date(end)) { Toast.show('Data inicial maior que a final', 'error'); return; }

        resultsEl.innerHTML = `<div class="flex justify-center py-8 text-slate-500"><i data-lucide="loader" class="w-6 h-6 animate-spin"></i></div>`;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        Loading.show('Agregando dados do evento...');

        await Store.fetchScoresRange(start, end);

        Loading.hide();

        const allScores = await Store.getScores();

        const members = await Store.getMembers();

        const units = await Store.getUnits();

        const dates = [];

        for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {

            dates.push(d.toISOString().split('T')[0]);

        }

        const rows = members.map(member => {

            const unit = units.find(u => u.id === member.unitId);

            let presences = 0, absences = 0, totalPts = 0;

            const itemCounts = {};

            CONFIG.SCORE_ITEMS.forEach(item => { itemCounts[item.id] = 0; });

            dates.forEach(dateKey => {

                const score = (allScores[dateKey] || {})[member.id];

                if (!score) return;

                if (score.isAbsent) { absences++; }

                else {

                    presences++; totalPts += Utils.countTotal(score);

                    if (score.items) CONFIG.SCORE_ITEMS.forEach(item => { if (score.items[item.id] === true) itemCounts[item.id]++; });

                }

            });

            return { member, unit, presences, absences, totalPts, itemCounts, total: presences + absences };

        }).filter(r => r.total > 0).sort((a, b) => b.totalPts - a.totalPts);

        if (rows.length === 0) {

            resultsEl.innerHTML = `<div class="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center"><i data-lucide="inbox" class="w-10 h-10 text-slate-700 mx-auto mb-3"></i><p class="text-slate-400 font-bold">Nenhum dado encontrado</p><p class="text-slate-600 text-sm mt-1">Nenhum lançamento neste período.</p></div>`;

            if (typeof lucide !== 'undefined') lucide.createIcons();

            return;

        }

        resultsEl.innerHTML = `

            <div class="space-y-3">

                <div class="bg-slate-900 rounded-2xl border border-brand-gold/30 p-4">

                    <div class="flex items-center gap-2 mb-3">

                        <i data-lucide="calendar-range" class="w-4 h-4 text-brand-gold"></i>

                        <h3 class="font-black text-white text-sm uppercase tracking-wider truncate">${evName}</h3>

                    </div>

                    <div class="grid grid-cols-3 gap-2 text-center">

                        <div class="bg-slate-950 rounded-xl p-2 border border-slate-800">

                            <p class="text-[10px] text-slate-500 uppercase font-bold">De</p>

                            <p class="text-xs font-black text-white">${Utils.formatDate(start)}</p>

                        </div>

                        <div class="bg-slate-950 rounded-xl p-2 border border-slate-800">

                            <p class="text-[10px] text-slate-500 uppercase font-bold">Até</p>

                            <p class="text-xs font-black text-white">${Utils.formatDate(end)}</p>

                        </div>

                        <div class="bg-slate-950 rounded-xl p-2 border border-slate-800">

                            <p class="text-[10px] text-slate-500 uppercase font-bold">Membros</p>

                            <p class="text-xl font-black text-brand-gold">${rows.length}</p>

                        </div>

                    </div>

                </div>

                ${rows.map((r, idx) => {

            const pct = r.total > 0 ? Math.round((r.presences / r.total) * 100) : 0;

            const barCol = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : pct >= 25 ? 'bg-orange-500' : 'bg-red-500';

            const pctCol = pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : pct >= 25 ? 'text-orange-400' : 'text-red-400';

            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1) + 'º';

            return `

                    <div class="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">

                        <div class="flex items-center gap-3 p-3 border-b border-slate-800">

                            <div class="w-9 h-9 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-xs font-black text-brand-gold shrink-0">

                                ${Sanitizer.normalizeName(r.member.name).split(' ').map(n => n[0]).slice(0, 2).join('')}

                            </div>

                            <div class="flex-1 min-w-0">

                                <p class="font-black text-white text-sm truncate">${medal} ${Sanitizer.normalizeName(r.member.name)}</p>

                                <p class="text-[10px] text-slate-500 font-bold uppercase">${r.unit?.name || '—'}</p>

                            </div>

                            <span class="text-base font-black text-brand-gold shrink-0">${r.totalPts} pts</span>

                        </div>

                        <div class="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800">

                            <div class="text-center py-2"><p class="text-[10px] font-bold text-slate-500 uppercase">Presenças</p><p class="font-black text-green-400">${r.presences}</p></div>

                            <div class="text-center py-2"><p class="text-[10px] font-bold text-slate-500 uppercase">Faltas</p><p class="font-black text-red-400">${r.absences}</p></div>

                            <div class="text-center py-2"><p class="text-[10px] font-bold text-slate-500 uppercase">Frequência</p><p class="font-black ${pctCol}">${pct}%</p></div>

                        </div>

                        <div class="px-3 py-1.5">

                            <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div class="${barCol} h-1.5 rounded-full" style="width:${pct}%"></div></div>

                        </div>

                    </div>`;

        }).join('')}

            </div>

        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

    },

    // ── Legacy exports (kept for compatibility) ──────────────────────────────
    async exportToCSV() {
        const { start, end } = this._reportRange || { start: Utils.getTodayKey(), end: Utils.getTodayKey() };
        await Store.fetchScoresRange(start, end);

        const units = await Store.getUnits();
        const members = await Store.getMembers();
        const allScores = await Store.getScores();

        const headers = ['Desbravador', 'Unidade', 'Função', 'Data', 'Pontos', 'Status'];
        const rows = [headers.join(';')];

        for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const dayScores = allScores[dateKey] || {};
            for (const member of members) {
                const score = dayScores[member.id];
                if (!score) continue;
                const unit = units.find(u => u.id === member.unitId);
                const points = score.isAbsent ? 0 : Utils.countTotal(score);
                rows.push([
                    `"${Sanitizer.normalizeName(member.name)}"`,
                    `"${unit?.name || 'N/A'}"`,
                    `"${member.role || 'DESBRAVADOR'}"`,
                    Utils.formatDate(dateKey),
                    points,
                    score.isAbsent ? 'Ausente' : 'Presente'
                ].join(';'));
            }
        }

        if (rows.length <= 1) { Toast.show('Nenhum dado no período', 'error'); return; }
        const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `relatorio_${start}_${end}.csv` });
        a.click();
        Toast.show('CSV exportado!', 'success');
    },

    // ── Tab 3: Auditoria (Board Reporting) ──────────────────────────────────
    async _renderAuditoria(container) {
        Loading.show('Gerando Auditoria...');
        
        try {
            const allMembers = await Store.getMembers();
            const allUnits = await Store.getUnits();
            const allScores = await Store.getScores();
            const meetings = await Store.getMeetings();

            // Filter Active Members & Map Units (excluding TESTE globally)
            const visibleUnits = RBAC.filterUnits(allUnits);
            const visibleUnitIds = new Set(visibleUnits.map(u => u.id));
            const unitMap = {};
            visibleUnits.forEach(u => unitMap[u.id] = u.name);

            const activeMembers = allMembers.filter(m => 
                m.active !== false && 
                !m.isCounselor && 
                visibleUnitIds.has(m.unitId)
            );

            // Generate Cross-Join Data
            const auditData = [];
            const sortedMeetings = [...meetings].sort((a, b) => b.date.localeCompare(a.date));

            for (const meeting of sortedMeetings) {
                const dateKey = meeting.date;
                const meetingScores = allScores[dateKey] || {};

                for (const member of activeMembers) {
                    const score = meetingScores[member.id];
                    let statusLabel = '';
                    let statusClass = '';
                    let author = 'N/A';

                    if (!score) {
                        statusLabel = '🟡 PENDENTE';
                        statusClass = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
                    } else if (score.is_absent === true) {
                        statusLabel = '❌ AUSENTE';
                        statusClass = 'bg-slate-800 text-orange-400 border-orange-500/30';
                        author = score.created_by || 'Sistema';
                    } else {
                        statusLabel = '✅ PRESENTE';
                        statusClass = 'bg-green-500/10 text-green-400 border-green-500/30';
                        author = score.created_by || 'Sistema';
                    }

                    auditData.push({
                        date: dateKey,
                        unit: unitMap[member.unitId] || 'Sem Unidade',
                        name: member.name,
                        statusLabel,
                        statusClass,
                        author
                    });
                }
            }

            // Render Table HTML
            let rowsHtml = '';
            if (auditData.length === 0) {
                rowsHtml = `<tr><td colspan="5" class="py-4 text-center text-slate-500 text-sm">Nenhum dado auditável encontrado nas reuniões oficiais.</td></tr>`;
            } else {
                rowsHtml = auditData.map(row => `
                    <tr class="border-b border-slate-800/80 hover:bg-slate-800 transition-colors">
                        <td class="px-3 py-3 whitespace-nowrap text-[11px] text-slate-400 font-medium">${Utils.formatDate(row.date)}</td>
                        <td class="px-3 py-3 whitespace-nowrap text-[11px] font-bold text-brand-gold/80">${row.unit}</td>
                        <td class="px-3 py-3 whitespace-nowrap text-xs text-slate-200 max-w-[140px] truncate" title="${Sanitizer.normalizeName(row.name)}">${Sanitizer.normalizeName(row.name)}</td>
                        <td class="px-3 py-3 whitespace-nowrap text-xs font-black">
                            <span class="px-2 py-1 rounded-md border ${row.statusClass} text-[9px] tracking-wider uppercase flex items-center w-fit">${row.statusLabel}</span>
                        </td>
                        <td class="px-3 py-3 whitespace-nowrap text-[10px] text-slate-500 truncate max-w-[90px]" title="${row.author}">${row.author.replace('Sistema ','')}</td>
                    </tr>
                `).join('');
            }

            container.innerHTML = `
                <div class="space-y-4 animate-fade-in pb-8">
                    <div class="flex items-center justify-between mb-4">
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <i data-lucide="shield-alert" class="w-3 h-3 text-red-500/70"></i>Auditoria Board
                        </p>
                        <span class="text-[10px] bg-slate-800 text-brand-gold font-bold px-2 py-0.5 rounded-full border border-slate-700">Records: ${auditData.length}</span>
                    </div>

                    <div class="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-slate-950 border-b border-slate-700">
                                    <tr>
                                        <th class="px-3 py-2.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">Data</th>
                                        <th class="px-3 py-2.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">Unidade</th>
                                        <th class="px-3 py-2.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">Membro</th>
                                        <th class="px-3 py-2.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">Status Real</th>
                                        <th class="px-3 py-2.5 text-[10px] font-black uppercase text-slate-500 tracking-wider">Assinatura</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p class="text-[10px] text-blue-300 leading-relaxed font-medium">🛡️ <strong>Integridade Garantida:</strong> Esta tabela engloba 100% dos relatórios oficiais baseados no cruzamento das reuniões agendadas vs base de Desbravadores. Oculta automaticamente Unidades de Teste e Conselheiros.</p>
                    </div>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();

        } catch (error) {
            console.error('Erro ao renderizar auditoria:', error);
            container.innerHTML = `<div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center text-sm font-bold">Falha de Memória ao montar Data Table.</div>`;
        } finally {
            Loading.hide();
        }
    },

    // ── Tab 4: Analytics (Pro-rated Monthly Management Dashboard) ────────────
    async _renderAnalytics(container) {
        Loading.show('Carregando Analytics...');
        try {
            const [allMembers, allUnits, meetings] = await Promise.all([
                Store.getMembers(),
                Store.getUnits(),
                Store.getMeetings()
            ]);

            // Build visible unit map (exclude TESTE)
            const visibleUnits = RBAC.filterUnits(allUnits);
            const unitMap = {};
            visibleUnits.forEach(u => unitMap[u.id] = u.name);

            // Derive available months from meetings calendar
            const monthsSet = new Set();
            meetings.forEach(m => monthsSet.add(m.date.substring(0, 7)));
            const sortedMonths = [...monthsSet].sort((a, b) => b.localeCompare(a));

            // Default: current month or latest available
            const currentYM = new Date().toISOString().substring(0, 7);
            const selectedMonth = this._analyticsMonth || (sortedMonths.includes(currentYM) ? currentYM : (sortedMonths[0] || currentYM));
            this._analyticsMonth = selectedMonth;

            // v58.1: Ensure scores for the SELECTED MONTH are in cache (not just current month).
            // Counselor completion is unit-based: any score record present = counted, regardless of created_by.
            const firstDay = `${selectedMonth}-01`;
            const lastDay = new Date(+selectedMonth.split('-')[0], +selectedMonth.split('-')[1], 0)
                .toISOString().split('T')[0];
            await Store.fetchScoresRange(firstDay, lastDay);
            const allScores = await Store.getScores();

            // ── Pro-rate helpers ────────────────────────────────────────────
            const ITEM_POINTS = {};
            [...CONFIG.SCORE_ITEMS, ...CONFIG.IMPACTO_EVENT.items, ...CONFIG.HOLY_WEEK_EVENT.items]
                .forEach(i => { ITEM_POINTS[i.id] = i.points; });

            function calcScore(memberScore) {
                if (!memberScore || memberScore.is_absent) return 0;
                let pts = 0;
                Object.entries(memberScore.items || {}).forEach(([id, val]) => {
                    if (val === true && ITEM_POINTS[id]) pts += ITEM_POINTS[id];
                });
                return pts;
            }

            function eligibleMeetings(member, monthFilter) {
                const joinedAt = member.joinedAt || '2000-01-01';
                return meetings.filter(m => m.date.startsWith(monthFilter) && m.date >= joinedAt);
            }

            // ── Growth Widget: new members this month ──────────────────────
            const newThisMonth = allMembers.filter(m =>
                m.joinedAt && m.joinedAt.startsWith(selectedMonth)
            ).length;

            // ── Unit Ranking (pro-rated average per eligible member) ────────
            const activeNonCounselors = allMembers.filter(m =>
                !m.isCounselor && visibleUnits.some(u => u.id === m.unitId)
            );

            const unitStats = {};
            visibleUnits.forEach(u => {
                unitStats[u.id] = { name: u.name, totalPts: 0, memberCount: 0, meetingCount: 0 };
            });

            activeNonCounselors.forEach(member => {
                if (!unitStats[member.unitId]) return;
                const eligible = eligibleMeetings(member, selectedMonth);
                if (eligible.length === 0) return;
                let memberPts = 0;
                eligible.forEach(m => {
                    memberPts += calcScore((allScores[m.date] || {})[member.id]);
                });
                unitStats[member.unitId].totalPts += memberPts;
                unitStats[member.unitId].memberCount++;
                unitStats[member.unitId].meetingCount = Math.max(unitStats[member.unitId].meetingCount, eligible.length);
            });

            const unitRanking = Object.values(unitStats)
                .filter(u => u.memberCount > 0)
                .map(u => ({ ...u, avg: u.memberCount > 0 ? u.totalPts / u.memberCount : 0 }))
                .sort((a, b) => b.avg - a.avg);

            const maxUnitAvg = unitRanking[0]?.avg || 1;

            // ── Counselor Ranking (completion rate = scored members / eligible members) ─
            const counselorStats = {};
            visibleUnits.forEach(u => {
                const unitMeetings = meetings.filter(m => m.date.startsWith(selectedMonth));
                const unitMembers = activeNonCounselors.filter(m => m.unitId === u.id);
                let filled = 0, total = 0;
                unitMeetings.forEach(meeting => {
                    const dayScores = allScores[meeting.date] || {};
                    unitMembers.forEach(member => {
                        if (!member.joinedAt || member.joinedAt <= meeting.date) {
                            total++;
                            if (dayScores[member.id]) filled++;
                        }
                    });
                });
                if (total > 0) {
                    counselorStats[u.id] = {
                        unit: u.name,
                        filled,
                        total,
                        rate: Math.round((filled / total) * 100)
                    };
                }
            });

            const counselorRanking = Object.values(counselorStats).sort((a, b) => b.rate - a.rate);

            // ── Render ─────────────────────────────────────────────────────
            const monthOptions = sortedMonths.map(m => {
                const [y, mo] = m.split('-');
                const label = new Date(+y, +mo - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                return `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${label}</option>`;
            }).join('');

            container.innerHTML = `
                <div class="space-y-5 animate-fade-in pb-8">

                    <!-- Month Filter -->
                    <div class="flex items-center gap-3 bg-slate-900 rounded-xl border border-slate-700 p-3">
                        <i data-lucide="calendar-range" class="w-5 h-5 text-brand-gold flex-shrink-0"></i>
                        <select onchange="App.setAnalyticsMonth(this.value)"
                                class="flex-1 bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer">
                            ${monthOptions}
                        </select>
                    </div>

                    <!-- Growth Widget -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 rounded-xl p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <i data-lucide="user-plus" class="w-4 h-4 text-emerald-400"></i>
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Novos Membros</span>
                            </div>
                            <div class="text-3xl font-black ${newThisMonth > 0 ? 'text-emerald-400' : 'text-slate-500'}">
                                ${newThisMonth > 0 ? '+' : ''}${newThisMonth}
                            </div>
                            <div class="text-[10px] text-slate-500 mt-1">neste mês</div>
                        </div>
                        <div class="bg-gradient-to-br from-blue-900/40 to-indigo-900/20 border border-blue-500/30 rounded-xl p-4">
                            <div class="flex items-center gap-2 mb-2">
                                <i data-lucide="calendar-check" class="w-4 h-4 text-blue-400"></i>
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reuniões</span>
                            </div>
                            <div class="text-3xl font-black text-blue-400">
                                ${meetings.filter(m => m.date.startsWith(selectedMonth)).length}
                            </div>
                            <div class="text-[10px] text-slate-500 mt-1">no mês selecionado</div>
                        </div>
                    </div>

                    <!-- Unit Ranking -->
                    <div>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <i data-lucide="trophy" class="w-3 h-3 text-brand-gold"></i>Ranking de Unidades (Méd. Pro-Rated)
                        </p>
                        <div class="space-y-2">
                            ${unitRanking.length === 0 ? `<p class="text-slate-500 text-sm text-center py-4">Sem dados para este mês.</p>` :
                              unitRanking.map((u, i) => {
                                const pct = Math.round((u.avg / maxUnitAvg) * 100);
                                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
                                return `
                                <div class="bg-slate-900 rounded-xl p-3 border border-slate-800">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center gap-2">
                                            <span class="text-base">${medal}</span>
                                            <span class="font-bold text-white text-sm">${u.name}</span>
                                        </div>
                                        <div class="text-right">
                                            <span class="text-brand-gold font-black text-sm">${u.avg.toFixed(1)} pts</span>
                                            <div class="text-[10px] text-slate-500">${u.memberCount} membros · ${u.meetingCount} reuniões</div>
                                        </div>
                                    </div>
                                    <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-brand-gold rounded-full transition-all" style="width: ${pct}%"></div>
                                    </div>
                                </div>`;
                              }).join('')}
                        </div>
                    </div>

                    <!-- Counselor Ranking -->
                    <div>
                        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <i data-lucide="clipboard-check" class="w-3 h-3 text-indigo-400"></i>Preenchimento por Unidade
                        </p>
                        <div class="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
                            <table class="w-full text-left">
                                <thead class="bg-slate-950 border-b border-slate-700">
                                    <tr>
                                        <th class="px-3 py-2.5 text-[10px] font-black uppercase text-slate-500">Unidade</th>
                                        <th class="px-3 py-2.5 text-[10px] font-black uppercase text-slate-500">Preenchidos</th>
                                        <th class="px-3 py-2.5 text-[10px] font-black uppercase text-slate-500">Taxa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${counselorRanking.length === 0 ? `<tr><td colspan="3" class="py-4 text-center text-slate-500 text-sm">Sem dados.</td></tr>` :
                                      counselorRanking.map(c => `
                                        <tr class="border-b border-slate-800/80 hover:bg-slate-800 transition-colors">
                                            <td class="px-3 py-3 text-xs font-bold text-white">${c.unit}</td>
                                            <td class="px-3 py-3 text-xs text-slate-400">${c.filled}/${c.total}</td>
                                            <td class="px-3 py-3">
                                                <span class="px-2 py-1 rounded-md text-[10px] font-black border ${
                                                    c.rate >= 90 ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                                    : c.rate >= 70 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                                                }">${c.rate}%</span>
                                            </td>
                                        </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Export Button -->
                    <button onclick="App.exportAnalyticsCSV()"
                            class="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-brand-gold border border-brand-gold/30 flex items-center justify-center gap-2 transition-colors">
                        <i data-lucide="download" class="w-4 h-4"></i>Exportar Relatório Mensal (CSV)
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();

        } catch (error) {
            console.error('Analytics error:', error);
            container.innerHTML = `<div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold text-center">Erro ao gerar Analytics.</div>`;
        } finally {
            Loading.hide();
        }
    }
};
