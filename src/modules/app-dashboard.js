import { Store } from '../data/store.js';
import { RBAC } from '../core/auth.js';
import { DataAdapter } from '../data/repository.js';
import { Utils } from './ui-utils.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { Loading } from '../ui/loading.js';

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
        Loading.show('Carregando dados...');

        try {
            const todayKey = Utils.getTodayKey();
            const allUnits = await Store.getUnits();
            const allScores = await Store.getScores();

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
                            <p class="text-slate-400 text-sm font-medium">
                                ${Utils.formatDate(todayKey)}
                            </p>
                        </div>
                        
                        ${RBAC.canManageUnits() ? `
                            <button onclick="App.addUnitPrompt()" 
                                    class="bg-brand-gold text-slate-900 p-2 rounded-xl hover:bg-yellow-500 transition-colors shadow-lg shadow-brand-gold/20">
                                <i data-lucide="plus" class="w-6 h-6"></i>
                            </button>
                        ` : ''}
                    </div>

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
                            <div class="text-xs text-slate-400 uppercase font-bold">Avaliações Hoje</div>
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
                                        <div class="w-12 h-12 rounded-xl bg-brand-navy border border-slate-700 flex items-center justify-center group-hover:border-brand-gold/50 transition-colors">
                                            <span class="text-lg font-black text-brand-gold">
                                                ${unit.name.substring(0, 2).toUpperCase()}
                                            </span>
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

                    <!-- Unit Classification Button (Admin Only) -->
                    ${RBAC.isSuperAdmin() ? `
                        <div class="mt-8 border-t border-slate-800 pt-6">
                            <button onclick="App.runUnitClassification()" 
                                    class="w-full py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center gap-2">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                                Executar Classificação Automática
                            </button>
                            <p class="text-center text-[10px] text-slate-500 mt-2">
                                Atualiza unidades baseado em idade/sexo
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;

            this.mountPoint.innerHTML = html;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.toggleNavigation(true);

            // Focus search if it was active
            if (this.activeFilters?.query) {
                const searchInput = document.getElementById('dashboard-search');
                if (searchInput) {
                    searchInput.focus();
                    // Cursor to end
                    const val = searchInput.value;
                    searchInput.value = '';
                    searchInput.value = val;
                }
            }
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
};
