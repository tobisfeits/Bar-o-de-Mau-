import { Store } from '../data/store.js';
import { RBAC } from '../core/auth.js';
import { DataAdapter } from '../data/repository.js';
import { Utils } from './ui-utils.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { Loading } from '../ui/loading.js';
import { SyncManager } from '../data/sync-manager.js';

export const DashboardMethods = {
    async checkBirthdays() {
        if (!DataAdapter.useSupabase()) {
            return [];
        }

        try {
            const { data, error } = await window.supabaseClient
                .rpc('get_birthday_alerts');

            if (error) {
                console.error('Error fetching birthdays:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error in checkBirthdays:', error);
            return [];
        }
    },

    renderBirthdayBanner(birthdays) {
        return `
            <div class="bg-gradient-to-r from-pink-500/20 to-purple-500/20 
                        border border-pink-500/30 rounded-xl p-4 animate-fade-in mb-6">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                        <i data-lucide="cake" class="w-6 h-6 text-pink-400"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-white text-lg">🎉 Aniversariantes de Hoje!</h3>
                        <p class="text-xs text-pink-300">Parabéns aos nossos desbravadores!</p>
                    </div>
                </div>
                <div class="space-y-2">
                    ${birthdays.map(b => `
                        <div class="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center">
                                    <i data-lucide="user" class="w-4 h-4 text-brand-gold"></i>
                                </div>
                                <div>
                                    <p class="text-white font-bold text-sm">${Sanitizer.normalizeName(b.member_name)}</p>
                                    <p class="text-xs text-slate-400">${b.unit_name || 'Sem unidade'}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-brand-gold font-bold text-lg">${b.new_age}</p>
                                <p class="text-xs text-slate-500">anos</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async renderDashboard() {
        // Show skeleton placeholders instead of generic spinner (A10)
        this.mountPoint.innerHTML = `
            <div class="p-4 space-y-4 animate-pulse">
                <div class="h-20 bg-slate-800 rounded-2xl"></div>
                <div class="grid grid-cols-3 gap-3">
                    <div class="h-16 bg-slate-800 rounded-xl"></div>
                    <div class="h-16 bg-slate-800 rounded-xl"></div>
                    <div class="h-16 bg-slate-800 rounded-xl"></div>
                </div>
                ${[1, 2, 3].map(() => `
                <div class="bg-slate-900 rounded-xl p-4 border border-slate-800">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-slate-800 rounded-2xl"></div>
                        <div class="flex-1 space-y-2">
                            <div class="h-4 bg-slate-800 rounded w-2/3"></div>
                            <div class="h-3 bg-slate-800 rounded w-1/3"></div>
                        </div>
                        <div class="h-8 w-16 bg-slate-800 rounded-lg"></div>
                    </div>
                </div>`).join('')}
            </div>`;

        try {
            const todayKey = App.currentDate;
            const allUnits = await Store.getUnits();
            const allScores = await Store.getScores();
            const allMembers = await Store.getMembers(); // Load members for stats

            // Check birthdays
            const birthdays = await this.checkBirthdays();

            // Filter units based on RBAC and active filters
            let visibleUnits = RBAC.filterUnits(allUnits);

            // Apply manual search filter if any
            if (this.activeFilters?.query) {
                const query = this.activeFilters.query.toLowerCase();
                visibleUnits = visibleUnits.filter(u => u.name.toLowerCase().includes(query));
            }

            const html = `
                <div class="slide-in pb-20">
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-black text-white uppercase tracking-wider">Unidades</h2>
                            
                            ${RBAC.canManageUnits() ? `
                                <div class="flex items-center gap-2 mt-1">
                                    <input type="date" 
                                           id="session-date-picker" 
                                           value="${todayKey}"
                                           onchange="App.changeSessionDate(this.value)"
                                           class="bg-slate-800 border-none text-brand-gold font-bold text-sm rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-brand-gold cursor-pointer">
                                    
                                    <button onclick="App.registerMeeting('${todayKey}')" id="btn-register-meeting"
                                            class="bg-slate-800 text-[10px] text-slate-400 font-bold uppercase px-2 py-1 rounded hover:bg-slate-700 transition-colors flex items-center gap-1">
                                        <i data-lucide="calendar" class="w-3 h-3 text-brand-gold"></i>
                                        Marcar Reunião
                                    </button>
                                </div>
                            ` : `
                                <p class="text-slate-400 text-sm font-medium">
                                    ${Utils.formatDate(todayKey)}
                                </p>
                            `}

                            <!-- Meeting Status Label -->
                            <div id="meeting-label" class="mt-2 hidden">
                                <span class="bg-brand-gold/10 text-brand-gold text-[10px] font-black uppercase px-2 py-0.5 rounded border border-brand-gold/30 flex items-center gap-1 w-fit">
                                    <i data-lucide="check-circle" class="w-3 h-3"></i>
                                    Dia de Reunião Oficial
                                </span>
                            </div>

                            <!-- Sync Status Indicator -->
                            <div id="sync-status" class="mt-2 text-xs font-bold px-2 py-1 rounded w-fit hidden">
                                <span class="indicator mr-1">●</span> <span class="text">Online</span>
                            </div>
                        </div>
                        
                        ${RBAC.isSuperAdmin() ? `
                            <div class="flex gap-2">
                                <button onclick="App.exportAttendanceGaps()" 
                                        class="bg-slate-800 text-blue-400 p-2 rounded-xl hover:bg-slate-700 transition-colors shadow-lg border border-slate-700 flex items-center justify-center"
                                        title="Exportar Relatório de Faltas (CSV)">
                                    <i data-lucide="download" class="w-6 h-6"></i>
                                </button>
                                <a href="admin-deleted-members.html" 
                                   class="bg-slate-800 text-red-400 p-2 rounded-xl hover:bg-slate-700 transition-colors shadow-lg border border-slate-700 flex items-center justify-center"
                                   title="Lixeira de Membros">
                                    <i data-lucide="trash-2" class="w-6 h-6"></i>
                                </a>
                                <button onclick="App.addUnitPrompt()" 
                                        class="bg-brand-gold text-slate-900 p-2 rounded-xl hover:bg-yellow-500 transition-colors shadow-lg shadow-brand-gold/20"
                                        title="Nova Unidade">
                                    <i data-lucide="plus" class="w-6 h-6"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Pending Alerts Area -->
                    <div id="dashboard-alerts" class="mb-4 space-y-2"></div>

                    <!-- Missed Attendance Widget -->
                    <div id="missed-attendance-widget" class="mb-4"></div>

                    <!-- Search / Filter -->
                    <div class="mb-6 relative">
                        <input type="text" 
                               id="dashboard-search"
                               placeholder="Buscar unidade..." 
                               value="${this.activeFilters?.query || ''}"
                               class="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-brand-gold focus:outline-none transition-all"
                               oninput="App.handleSearch(this.value)">
                        <i data-lucide="search" class="absolute left-3 top-3.5 w-5 h-5 text-slate-500"></i>
                    </div>

                    <!-- Birthday Banner -->
                    ${birthdays.length > 0 ? this.renderBirthdayBanner(birthdays) : ''}

                    <!-- Stats Cards -->
                    <div class="grid grid-cols-2 gap-3 mb-6">
                         <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <i data-lucide="users" class="w-6 h-6 text-blue-400 mb-2"></i>
                            <div class="text-2xl font-black text-white">
                                ${allUnits.length}
                            </div>
                            <div class="text-xs text-slate-400 uppercase font-bold">Unidades</div>
                         </div>
                          <div class="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <i data-lucide="check-circle" class="w-6 h-6 text-green-400 mb-2"></i>
                            <div class="text-2xl font-black text-white">
                                ${Object.keys(allScores[todayKey] || {}).length}
                            </div>
                            <div class="text-xs text-slate-400 uppercase font-bold">Avaliações ${todayKey === Utils.getTodayKey() ? 'Hoje' : 'na Data'}</div>
                          </div>
                    </div>

                    <!-- Units Grid -->
                    <div class="grid gap-4">
                        ${visibleUnits.map(unit => {
                // Calculate unit stats
                // This is a bit inefficient doing it inside map without async
                // But for now keeping it simple as we don't have async map easily in template literal
                // We will fetch members count later or assume it's small enough.
                // Actually Store.getMembersByUnit is async.
                // So we render a shell efficiently? 
                // The original code calculated unit average in renderDashboard?
                // Let's look at original code.
                // Original code didn't calculate average in dashboard list, just listed units.

                return `
                            <div onclick="App.navigate('unit', { unitId: '${unit.id}' })" 
                                 class="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-sm active:scale-[0.98] transition-all hover:border-brand-gold/50 cursor-pointer group relative overflow-hidden">
                                
                                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <i data-lucide="shield" class="w-16 h-16 transform rotate-12"></i>
                                </div>

                                <div class="flex items-center justify-between relative z-10">
                                    <div class="flex items-center gap-4">
                                        <div class="w-12 h-12 rounded-xl bg-brand-navy border border-slate-700 flex items-center justify-center group-hover:border-brand-gold/50 transition-colors overflow-hidden">
                                            ${unit.logo ?
                        `<img src="${unit.logo}" alt="${unit.name}" class="w-full h-full object-cover">` :
                        `<span class="text-lg font-black text-brand-gold">${unit.name.substring(0, 2).toUpperCase()}</span>`
                    }
                                        </div>
                                        <div>
                                            <h3 class="font-bold text-lg text-white group-hover:text-brand-gold transition-colors">
                                                ${unit.name}
                                            </h3>
                                            <p class="text-xs text-slate-400 flex items-center gap-1">
                                                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                                                Ativo
                                            </p>
                                        </div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-600 group-hover:text-brand-gold transition-colors"></i>
                                </div>
                            </div>
                            `;
            }).join('')}
                    </div>
                    
                    ${visibleUnits.length === 0 ? `
                        <div class="text-center py-12 opacity-50">
                            <i data-lucide="search-x" class="w-16 h-16 mx-auto mb-4 text-slate-600"></i>
                            <p class="text-slate-400">Nenhuma unidade encontrada</p>
                        </div>
                    ` : ''}

                </div>
            `;

            this.mountPoint.innerHTML = html;

            // Initialize Sync UI Listener
            this.initSyncStatus();

            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.toggleNavigation(true);

            // Calculate missed attendance
            const activeMembers = allMembers.filter(m => m.active !== false && !m.is_counselor);
            const todayScores = allScores[todayKey] || {};
            const missedList = activeMembers.filter(m => !todayScores[m.id]);
            const totalPresent = activeMembers.length - missedList.length;
            
            this.updateMissedAttendanceWidget(missedList, totalPresent);

            // Check for pending roll calls on meetings
            this.checkPendingRollCalls(todayKey, visibleUnits, allScores);

        } catch (error) {
            console.error('Error rendering dashboard:', error);
            Toast.show('Erro ao carregar dashboard', 'error');
            Loading.hide();
        } finally {
            Loading.hide();
        }
    },

    handleSearch(query) {
        this.activeFilters.query = query;
        // Debounce render? For now just simple re-render
        // Ideally should be debounced.
        // We can just re-render list, but full render is easier for now.
        // Using timeout to debounce
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.renderDashboard();
        }, 300);
    },

    initSyncStatus() {
        const statusEl = document.getElementById('sync-status');
        if (!statusEl) return;

        const updateUI = (status) => {
            const { pending, isSyncing, isOnline } = status;
            const textEl = statusEl.querySelector('.text');
            const indicatorEl = statusEl.querySelector('.indicator');

            statusEl.classList.remove('hidden');

            if (isSyncing) {
                statusEl.className = 'mt-2 text-xs font-bold px-2 py-1 rounded w-fit bg-blue-900/50 text-blue-400 border border-blue-800 animate-pulse';
                textEl.textContent = `Sincronizando (${pending})...`;
                indicatorEl.textContent = '↻';
            } else if (pending > 0) {
                statusEl.className = 'mt-2 text-xs font-bold px-2 py-1 rounded w-fit bg-yellow-900/50 text-yellow-400 border border-yellow-800';
                textEl.textContent = `Pendentes: ${pending}`;
                indicatorEl.textContent = '●';
            } else if (!isOnline) {
                statusEl.className = 'mt-2 text-xs font-bold px-2 py-1 rounded w-fit bg-red-900/50 text-red-400 border border-red-800';
                textEl.textContent = 'Offline';
                indicatorEl.textContent = '●';
            } else {
                statusEl.className = 'mt-2 text-xs font-bold px-2 py-1 rounded w-fit bg-green-900/50 text-green-400 border border-green-800';
                textEl.textContent = 'Online & Sincronizado';
                indicatorEl.textContent = '●';
                setTimeout(() => {
                    if (document.getElementById('sync-status') === statusEl && SyncManager.getPendingCount() === 0 && !SyncManager.isSyncing) {
                        statusEl.classList.add('hidden');
                    }
                }, 3000);
            }
        };

        SyncManager.setStatusListener(updateUI);
    },

    updateMissedAttendanceWidget(missedList, totalPresent) {
        const missedCount = missedList.length;
        const widgetContainer = document.getElementById('missed-attendance-widget');
        if (!widgetContainer) return;

        if (missedCount > 0) {
            // Change text from '100% Atualizado' to alert
            widgetContainer.innerHTML = `
                <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                    <div class="flex items-start gap-4">
                        <i data-lucide="alert-triangle" class="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0"></i>
                        <div class="flex-1">
                            <p class="text-sm text-yellow-200 font-medium"><strong>Atenção:</strong> Falta preencher a chamada de <strong>${missedCount}</strong> desbravador(es).</p>
                            ${missedCount > 0 ? `<p class="text-xs text-yellow-500/70 mt-1">Ex: ${missedList[0].name}</p>` : ''}
                            <button onclick="App.navigate('attendance')" class="mt-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/50 text-xs font-bold px-3 py-1.5 rounded transition-colors uppercase">
                                Preencher Agora
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else if (totalPresent === 0) {
            // Handle case where no attendance has started yet
            widgetContainer.innerHTML = `
                <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <div class="flex items-start gap-4">
                        <i data-lucide="info" class="w-6 h-6 text-blue-400 mt-1 flex-shrink-0"></i>
                        <div class="flex-1">
                            <p class="text-sm text-blue-200 font-medium">Nenhuma chamada realizada hoje.</p>
                            <button onclick="App.navigate('attendance')" class="mt-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 text-xs font-bold px-3 py-1.5 rounded transition-colors uppercase">
                                Iniciar Chamada
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Show success state
            widgetContainer.innerHTML = `
                <div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                    <div class="flex items-center gap-4">
                        <i data-lucide="check-circle" class="w-8 h-8 text-green-400 shadow-sm rounded-full bg-green-900/40"></i>
                        <div>
                            <p class="text-sm text-green-200 font-bold">Chamada 100% Concluída!</p>
                            <p class="text-xs text-green-500/70 mt-1">Todos os ${totalPresent} desbravadores foram avaliados.</p>
                        </div>
                    </div>
                </div>
            `;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async registerMeeting(date) {
        try {
            Loading.show('Registrando reunião...');
            await Store.saveMeeting(date);
            Toast.show('Dia de reunião registrado!', 'success');
            await this.renderDashboard();
        } catch (error) {
            console.error('Erro ao registrar reunião:', error);
            Toast.show('Erro ao registrar reunião', 'error');
        } finally {
            Loading.hide();
        }
    },

    async checkPendingRollCalls(dateKey, allUnits, allScores) {
        const meetings = await Store.getMeetings();
        const isMeeting = meetings.some(m => m.date === dateKey);

        const labelEl = document.getElementById('meeting-label');
        const btnRegister = document.getElementById('btn-register-meeting');
        const alertArea = document.getElementById('dashboard-alerts');

        if (isMeeting) {
            if (labelEl) labelEl.classList.remove('hidden');
            if (btnRegister) btnRegister.classList.add('hidden');

            // Check which units are pending
            const pendingUnits = [];
            for (const unit of allUnits) {
                const members = await Store.getMembersByUnit(unit.id);
                // A unit is pending if ANY of its members has NO score record for this date
                const unitScores = allScores[dateKey] || {};
                const hasPending = members.some(m => !unitScores[m.id]);

                if (hasPending) {
                    pendingUnits.push(unit);
                }
            }

            if (pendingUnits.length > 0 && alertArea) {
                alertArea.innerHTML = `
                    <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-bounce-subtle">
                        <div class="flex items-center gap-3">
                            <i data-lucide="alert-triangle" class="w-6 h-6 text-red-500"></i>
                            <div>
                                <h4 class="text-sm font-black text-white uppercase tracking-wider">Chamadas Pendentes</h4>
                                <p class="text-xs text-red-400 font-medium">As seguintes unidades ainda não finalizaram a chamada de hoje:</p>
                            </div>
                        </div>
                        <div class="mt-3 flex flex-wrap gap-2">
                            ${pendingUnits.map(u => `
                                <span class="bg-red-500/20 text-red-400 text-[10px] font-black uppercase px-2 py-1 rounded border border-red-500/20">
                                    ${u.name}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        } else {
            if (labelEl) labelEl.classList.add('hidden');
            if (btnRegister) btnRegister.classList.remove('hidden');
            if (alertArea) alertArea.innerHTML = '';
        }
    },

    async exportAttendanceGaps() {
        try {
            Loading.show('Gerando CSV de Faltas...');
            
            // 1. Fetch data
            const allMembers = await Store.getMembers();
            const allUnits = await Store.getUnits();
            const allScores = await Store.getScores();
            const meetings = await Store.getMeetings();
            
            // 2. Filter Active Members and Map their Units
            // Global Filtering: Only get units allowed by RBAC
            const visibleUnits = RBAC.filterUnits(allUnits);
            const visibleUnitIds = new Set(visibleUnits.map(u => u.id));
            
            const activeMembers = allMembers.filter(m => 
                m.active !== false && 
                !m.isCounselor && 
                visibleUnitIds.has(m.unitId)
            );
            
            const unitMap = {};
            visibleUnits.forEach(u => unitMap[u.id] = u.name);
            
            // 3. Find Missing Attendance (Gaps)
            const gapData = [];
            
            // Sort meetings by date DESC
            const sortedMeetings = [...meetings].sort((a, b) => b.date.localeCompare(a.date));
            
            for (const meeting of sortedMeetings) {
                const dateKey = meeting.date;
                const meetingScores = allScores[dateKey] || {};
                
                for (const member of activeMembers) {
                    if (!meetingScores[member.id]) {
                        gapData.push({
                            member_name: member.name,
                            unit_name: unitMap[member.unitId] || 'Sem Unidade',
                            missing_date: dateKey
                        });
                    }
                }
            }
            
            if (gapData.length === 0) {
                Toast.show('Nenhuma falta encontrada nas reuniões oficiais!', 'success');
                return;
            }
            
            // 4. Generate CSV
            const headers = ['Nome', 'Unidade', 'Data da Falta'];
            const csvRows = [headers.join(',')];
            
            gapData.forEach(row => {
                csvRows.push(`"${row.member_name}","${row.unit_name}","${row.missing_date}"`);
            });
            
            // Add BOM for Excel UTF-8 support
            const csvContent = '\\uFEFF' + csvRows.join('\\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `faltas_detalhadas.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Toast.show('Relatório CSV exportado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro na exportação:', error);
            Toast.show('Falha ao exportar CSV', 'error');
        } finally {
            Loading.hide();
        }
    }
};
