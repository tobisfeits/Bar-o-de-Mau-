import { Store } from '../data/store.js';
import { Utils } from './ui-utils.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { Toast } from '../ui/toast.js';
import { Theme } from '../ui/theme.js';

export const ReportMethods = {
    // Criar gráfico de comparação de unidades
    createUnitComparisonChart(unitStats) {
        const canvas = document.getElementById('unitComparisonChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: unitStats.map(u => u.name),
                datasets: [{
                    label: 'Média de Pontos',
                    data: unitStats.map(u => u.average),
                    backgroundColor: Theme.isDark() ? '#fbbf24' : '#d4af37',
                    borderColor: Theme.isDark() ? '#f59e0b' : '#b8941f',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Comparação entre Unidades',
                        color: Theme.isDark() ? '#f1f5f9' : '#1f2937',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 140,
                        ticks: { color: Theme.isDark() ? '#cbd5e1' : '#6b7280' },
                        grid: { color: Theme.isDark() ? '#334155' : '#e5e7eb' }
                    },
                    x: {
                        ticks: { color: Theme.isDark() ? '#cbd5e1' : '#6b7280' },
                        grid: { display: false }
                    }
                }
            }
        });
    },

    // Exportar para Excel
    async exportToExcel() {
        // Lazy load SheetJS only when needed (~500KB saved on startup)
        if (typeof XLSX === 'undefined') {
            Loading.show('Carregando biblioteca Excel...');
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            } catch {
                Loading.hide();
                Toast.show('Erro ao carregar biblioteca de exportação', 'error');
                return;
            }
            Loading.hide();
        }

        const todayKey = Utils.getTodayKey();
        const units = await Store.getUnits();
        const members = await Store.getMembers();
        const allScores = await Store.getScores();
        const scores = allScores[todayKey] || {};

        const data = members.map(member => {
            const score = scores[member.id];
            const unit = units.find(u => u.id === member.unitId);
            const points = score?.isAbsent ? 0 : Utils.countTotal(score);

            return {
                'Desbravador': Sanitizer.normalizeName(member.name),
                'Unidade': unit?.name || 'N/A',
                'Pontos': points,
                'Percentual': Utils.getPercentage(points) + '%',
                'Status': !score ? 'Não avaliado' : score.isAbsent ? 'Ausente' : 'Presente'
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

        const filename = `relatorio_${todayKey}.xlsx`;
        XLSX.writeFile(wb, filename);

        Toast.show('Relatório exportado com sucesso!', 'success');
    },

    // Exportar para CSV (sem dependências externas)
    async exportToCSV() {
        const startDate = document.getElementById('report-start-date')?.value || Utils.getTodayKey();
        const endDate = document.getElementById('report-end-date')?.value || Utils.getTodayKey();

        await Store.fetchScoresRange(startDate, endDate);

        const units = await Store.getUnits();
        const members = await Store.getMembers();
        const allScores = await Store.getScores();

        // CSV header
        const headers = ['Desbravador', 'Unidade', 'Função', 'Data', 'Pontos', 'Status'];
        const rows = [headers.join(';')];

        const start = new Date(startDate + 'T12:00:00');
        const end = new Date(endDate + 'T12:00:00');

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const dayScores = allScores[dateKey] || {};

            for (const member of members) {
                const score = dayScores[member.id];
                const unit = units.find(u => u.id === member.unitId);
                const points = score ? (score.isAbsent ? 0 : Utils.countTotal(score)) : '';
                const status = !score ? 'Não avaliado' : score.isAbsent ? 'Ausente' : 'Presente';

                // Only include rows where there is actual data
                if (score) {
                    rows.push([
                        `"${Sanitizer.normalizeName(member.name)}"`,
                        `"${unit?.name || 'N/A'}"`,
                        `"${member.role || 'DESBRAVADOR'}"`,
                        Utils.formatDate(dateKey),
                        points,
                        status
                    ].join(';'));
                }
            }
        }

        if (rows.length <= 1) {
            Toast.show('Nenhum dado encontrado no período selecionado', 'error');
            return;
        }

        // BOM for Excel UTF-8 compatibility
        const bom = '\uFEFF';
        const csvContent = bom + rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_${startDate}_a_${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        Toast.show('CSV exportado com sucesso!', 'success');
    },

    async renderReport(startDate = null, endDate = null) {
        // Se não houver datas, usar últimos 30 dias como padrão
        const todayKey = Utils.getTodayKey();

        // Calcular data de 30 dias atrás
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const thirtyDaysAgoKey = thirtyDaysAgo.toISOString().split('T')[0];

        const defaultStart = startDate || thirtyDaysAgoKey;
        const defaultEnd = endDate || todayKey;

        // Ensure data for the period is loaded
        Loading.show('Carregando dados do período...');
        await Store.fetchScoresRange(defaultStart, defaultEnd);
        Loading.hide();

        const units = await Store.getUnits();
        const members = await Store.getMembers();
        const allScores = await Store.getScores();

        // Calcular pontuação acumulada no período
        const calculatePeriodScores = (memberId) => {
            let totalPoints = 0;
            let daysEvaluated = 0;
            let daysAbsent = 0;

            // Iterar por todas as datas no período
            const start = new Date(defaultStart);
            const end = new Date(defaultEnd);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                const dayScores = allScores[dateKey] || {};
                const memberScore = dayScores[memberId];

                if (memberScore) {
                    daysEvaluated++;
                    if (memberScore.isAbsent) {
                        daysAbsent++;
                    } else {
                        totalPoints += Utils.countTotal(memberScore);
                    }
                }
            }

            return { totalPoints, daysEvaluated, daysAbsent };
        };

        const memberStats = members.map(member => {
            const { totalPoints, daysEvaluated, daysAbsent } = calculatePeriodScores(member.id);
            const evaluated = daysEvaluated > 0;
            // Updated total points from 190 to 180 (removed Social Media)
            // Ideally should use CONFIG.TOTAL_POINTS but keeping style consistent for now
            const percent = evaluated ? Math.round((totalPoints / (184 * daysEvaluated)) * 100) : 0;

            return {
                ...member,
                points: totalPoints,
                percent,
                daysEvaluated,
                daysAbsent,
                evaluated,
                unit: units.find(u => u.id === member.unitId)
            };
        });

        const unitStats = units.map(unit => {
            const unitMembers = memberStats.filter(m => m.unitId === unit.id);
            const totalPoints = unitMembers.reduce((sum, m) => sum + m.points, 0);
            const average = unitMembers.length > 0 ? Math.round(totalPoints / unitMembers.length) : 0;

            return {
                ...unit,
                average,
                memberCount: unitMembers.length,
                members: unitMembers
            };
        }).sort((a, b) => b.average - a.average);

        const bestUnit = unitStats[0];

        // Formatar período para exibição
        const periodText = defaultStart === defaultEnd
            ? Utils.formatDate(defaultStart)
            : `${Utils.formatDate(defaultStart)} até ${Utils.formatDate(defaultEnd)}`;

        const generateWhatsAppText = () => {
            let text = `*RELATÓRIO - ${periodText}*\n\n`;
            text += `🏆 *Unidade Destaque:* ${bestUnit ? bestUnit.name : 'N/A'}\n`;
            text += `📊 *Média Geral:* ${Math.round(unitStats.reduce((sum, u) => sum + u.average, 0) / (unitStats.length || 1))} pts\n\n`;

            unitStats.forEach(unit => {
                text += `*${unit.name}* (Média: ${unit.average} pts)\n`;
                unit.members.forEach(member => {
                    const status = !member.evaluated
                        ? 'Não avaliado'
                        : `${member.points} pts (${member.daysEvaluated} dias)`;
                    text += `- ${Sanitizer.normalizeName(member.name)}: ${status}\n`;
                });
                text += '\n';
            });

            return text;
        };

        const html = `
            <div class="slide-in pb-24 space-y-6">
                <div class="text-center border-b-2 border-slate-800 pb-4 mt-4">
                    <h2 class="text-2xl font-black text-white uppercase tracking-widest">
                        RELATÓRIO DE PONTUAÇÃO
                    </h2>
                    <p class="text-sm font-bold text-slate-400 mt-1">
                        Período: ${periodText}
                    </p>
                </div>
                
                <!-- Date Range Filter -->
                <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
                    <div class="flex items-center gap-2 text-brand-gold mb-2">
                        <i data-lucide="calendar" class="w-5 h-5"></i>
                        <span class="font-bold text-sm uppercase">Filtrar por Período</span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1">Data Inicial</label>
                            <input type="date" 
                                   id="report-start-date" 
                                   value="${defaultStart}"
                                   max="${todayKey}"
                                   class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg 
                                          text-slate-200 text-sm focus:outline-none focus:ring-2 
                                          focus:ring-brand-gold/50 focus:border-brand-gold">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 mb-1">Data Final</label>
                            <input type="date" 
                                   id="report-end-date" 
                                   value="${defaultEnd}"
                                   max="${todayKey}"
                                   class="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg 
                                          text-slate-200 text-sm focus:outline-none focus:ring-2 
                                          focus:ring-brand-gold/50 focus:border-brand-gold">
                        </div>
                    </div>
                    
                    <button onclick="App.applyReportDateFilter()" 
                            class="w-full py-2 bg-brand-gold text-slate-900 rounded-lg font-bold text-sm
                                   hover:bg-brand-gold/90 transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="filter" class="w-4 h-4"></i>
                        Aplicar Filtro
                    </button>
                </div>
                
                <div class="bg-brand-navy/10 p-4 rounded-xl border border-brand-navy/20 text-center">
                    <span class="text-xs font-bold text-brand-gold uppercase">
                        Unidade Destaque do Período
                    </span>
                    <div class="text-xl font-black text-white mt-1">
                        ${bestUnit ? bestUnit.name : '-'}
                    </div>
                    <div class="text-sm text-slate-400 mt-1">
                        Média: ${bestUnit ? bestUnit.average : '0'} pontos
                    </div>
                </div>
                
                <div class="space-y-8">
                    ${unitStats.map(unit => `
                        <div class="space-y-4">
                            <h3 class="text-lg font-bold text-white border-b border-slate-700 pb-2">
                                ${unit.name} 
                                <span class="text-sm font-normal text-slate-400">
                                    (Média: ${unit.average} pts)
                                </span>
                            </h3>
                            
                            ${unit.members.map(member => `
                                <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-sm">
                                    <div class="flex justify-between items-start mb-3">
                                        <div>
                                            <div class="font-bold text-white">${Sanitizer.normalizeName(member.name)}</div>
                                            <div class="text-sm text-slate-400">
                                                ${member.evaluated
                ? `${member.points} pontos • ${member.daysEvaluated} dia(s) avaliado(s)`
                : '<span class="text-yellow-400">Não avaliado</span>'
            }
                                            </div>
                                        </div>
                                        ${member.photo_url || member.image
                ? `<img src="${member.photo_url || member.image}" 
                                                   class="w-12 h-12 rounded-full object-cover border border-slate-700" 
                                                   alt="${member.name}">`
                : ''
            }
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
                
                <div class="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/95 backdrop-blur 
                            border-t border-slate-800 flex flex-col gap-2 z-50">
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="window.print()" 
                                class="py-3 rounded-xl font-bold text-white 
                                       bg-brand-navy hover:bg-brand-navy/90 
                                       flex items-center justify-center gap-2 shadow-lg text-sm">
                            <i data-lucide="file-text" class="w-4 h-4"></i> 
                            PDF
                        </button>
                        
                        <button onclick="App.exportToCSV()" 
                                class="py-3 rounded-xl font-bold text-emerald-400 
                                       bg-emerald-900/20 border border-emerald-900/30 hover:bg-emerald-900/30 
                                       flex items-center justify-center gap-2 text-sm">
                            <i data-lucide="table" class="w-4 h-4"></i> 
                            CSV / Excel
                        </button>
                    </div>
                    
                    <a href="${Utils.generateWhatsAppLink(generateWhatsAppText())}" 
                       target="_blank" 
                       class="w-full py-3 rounded-xl font-bold text-green-400 
                              bg-green-900/20 border border-green-900/30 hover:bg-green-900/30 
                              flex items-center justify-center gap-2 no-underline text-sm">
                        <i data-lucide="message-circle" class="w-4 h-4"></i> 
                        WhatsApp
                    </a>
                    
                    <button onclick="App.navigate('dashboard')" 
                            class="w-full py-2 rounded-xl font-bold text-slate-400 
                                   bg-slate-800 hover:bg-slate-700 
                                   flex items-center justify-center gap-2 text-sm">
                        Voltar
                    </button>
                </div>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.toggleNavigation(false);
    },

    applyReportDateFilter() {
        const startDate = document.getElementById('report-start-date')?.value;
        const endDate = document.getElementById('report-end-date')?.value;

        if (!startDate || !endDate) {
            Toast.show('Por favor, selecione ambas as datas', 'error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            Toast.show('Data inicial não pode ser maior que data final', 'error');
            return;
        }

        // Recarregar relatório com novo período
        this.renderReport(startDate, endDate);
    }
};
