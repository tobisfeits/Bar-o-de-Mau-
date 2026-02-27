import { Store } from '../data/store.js';
import { RBAC } from '../core/auth.js';
import { DataAdapter } from '../data/repository.js';
import { Utils } from './ui-utils.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { Loading } from '../ui/loading.js';
import { Toast } from '../ui/toast.js';
import { PhotoManager } from '../ui/photo-manager.js';

export const UnitMethods = {
    async renderUnitDetails(unitId) {
        Loading.show('Carregando unidade...');

        try {
            const unit = (await Store.getUnits()).find(u => u.id === unitId);
            if (!unit) {
                Toast.show('Unidade não encontrada', 'error');
                this.navigate('dashboard');
                return;
            }

            // Check permissions
            if (!RBAC.canViewUnit(unitId)) {
                Toast.show('Sem permissão para visualizar esta unidade', 'error');
                this.navigate('dashboard');
                return;
            }

            const members = await Store.getMembersByUnit(unitId);
            const todayKey = App.currentDate || Utils.getTodayKey();
            const allScores = await Store.getScores();
            const todayScores = allScores[todayKey] || {};

            // Calculate stats
            const stats = {
                evaluated: 0,
                totalPoints: 0,
                presence: 0
            };

            members.forEach(m => {
                const score = todayScores[m.id];
                if (score) {
                    stats.evaluated++;
                    if (!score.isAbsent) {
                        stats.presence++;
                        stats.totalPoints += Utils.countTotal(score);
                    }
                }
            });

            const avgPoints = stats.presence > 0 ? Math.round(stats.totalPoints / stats.presence) : 0;
            const presencePercent = members.length > 0 ? Math.round((stats.presence / members.length) * 100) : 0;

            const html = `
                <div class="slide-in pb-24">
                    <!-- Unit Header -->
                    <div class="relative bg-slate-900 rounded-2xl p-6 mb-6 border border-slate-700 overflow-hidden">
                         <div class="absolute top-0 right-0 p-6 opacity-10">
                            <i data-lucide="shield" class="w-32 h-32 transform rotate-12"></i>
                        </div>
                        
                        <div class="relative z-10">
                            <button onclick="App.goBack()" 
                                    class="mb-4 flex items-center text-slate-400 hover:text-white transition-colors">
                                <i data-lucide="arrow-left" class="w-5 h-5 mr-1"></i> Voltar
                            </button>

                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-16 h-16 rounded-2xl bg-brand-navy border-2 border-brand-gold flex items-center justify-center shadow-lg shadow-brand-navy/50 overflow-hidden">
                                    ${unit.logo ?
                    `<img src="${unit.logo}" alt="${unit.name}" class="w-full h-full object-cover">` :
                    `<span class="text-2xl font-black text-brand-gold">${unit.name.substring(0, 2).toUpperCase()}</span>`
                }
                                </div>
                                <div>
                                    <h3 class="text-brand-gold font-black uppercase tracking-widest text-sm">
                                    Avaliação de ${todayKey === Utils.getTodayKey() ? 'Hoje' : Utils.formatDate(todayKey)}
                                </h3>
                                    <h2 class="text-3xl font-black text-white uppercase tracking-wider leading-none">
                                        ${unit.name}
                                    </h2>
                                    <p class="text-brand-gold font-bold text-sm tracking-widest mt-1 uppercase">
                                        ${members.length} Desbravadores
                                    </p>
                                </div>
                            </div>

                            <!-- Daily Stats -->
                            <div class="grid grid-cols-3 gap-3">
                                <div class="bg-slate-950/50 p-3 rounded-xl border border-slate-800 backdrop-blur">
                                    <p class="text-slate-400 text-[10px] uppercase font-bold">Avaliados</p>
                                    <p class="text-xl font-black text-white">${stats.evaluated}/${members.length}</p>
                                </div>
                                <div class="bg-slate-950/50 p-3 rounded-xl border border-slate-800 backdrop-blur">
                                    <p class="text-slate-400 text-[10px] uppercase font-bold">Média ${todayKey === Utils.getTodayKey() ? 'Hoje' : 'Data'}</p>
                                    <p class="text-xl font-black text-brand-gold">${avgPoints}</p>
                                </div>
                                <div class="bg-slate-950/50 p-3 rounded-xl border border-slate-800 backdrop-blur">
                                    <p class="text-slate-400 text-[10px] uppercase font-bold">Presença</p>
                                    <p class="text-xl font-black ${presencePercent >= 80 ? 'text-green-400' : 'text-yellow-400'}">
                                        ${presencePercent}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Members List -->
                    <div class="space-y-3">
                        <div class="flex items-center justify-between px-2 mb-2">
                            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider">Membros</h3>
                            
                            ${RBAC.canManageMembers() ? `
                                <button onclick="App.addMemberPrompt('${unitId}')" 
                                        class="text-xs bg-slate-800 hover:bg-slate-700 text-brand-gold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors font-bold uppercase tracking-wider flex items-center gap-1">
                                    <i data-lucide="user-plus" class="w-3 h-3"></i> Adicionar
                                </button>
                            ` : ''}
                        </div>

                        ${members.length === 0 ? `
                            <div class="text-center py-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                                <i data-lucide="users" class="w-12 h-12 text-slate-700 mx-auto mb-3"></i>
                                <p class="text-slate-500 font-medium">Nenhum membro nesta unidade</p>
                            </div>
                        ` : ''}

                        ${members.map(member => {
                    const score = todayScores[member.id];
                    const statusColor = !score ? 'bg-slate-700' :
                        score.isAbsent ? 'bg-red-500' : 'bg-green-500';
                    const statusText = !score ? 'Pendente' :
                        score.isAbsent ? 'Ausente' : `${Utils.countTotal(score)} pts`;

                    // Photo logic (using helper if needed, but simple img tag works for now)
                    // We can use PhotoManager.renderPhoto() for better visuals
                    const photoHtml = PhotoManager.renderPhoto(member, 48);

                    return `
                                <div onclick="App.renderScoring('${member.id}')" 
                                     class="group bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm active:scale-[0.98] transition-all hover:bg-slate-800 hover:border-slate-700 cursor-pointer relative overflow-hidden">
                                     
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-4">
                                            ${photoHtml}
                                            <div>
                                                <div class="flex items-center gap-2">
                                                    <h3 class="font-bold text-white text-base group-hover:text-brand-gold transition-colors">
                                                        ${Sanitizer.normalizeName(member.name)}
                                                    </h3>
                                                    ${member.isCounselor ? `
                                                        <span class="bg-brand-gold/20 text-brand-gold text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-brand-gold/30">
                                                            Líder
                                                        </span>
                                                    `: ''}
                                                </div>
                                                <div class="flex items-center gap-2 mt-1">
                                                    <span class="w-2 h-2 rounded-full ${statusColor}"></span>
                                                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide">
                                                        ${statusText}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center gap-2">
                                            ${score ? `
                                            <div class="w-6 h-6 rounded-full ${score.isAbsent ? 'bg-red-500/20' : 'bg-green-500/20'} flex items-center justify-center">
                                                <i data-lucide="${score.isAbsent ? 'user-x' : 'check'}" class="w-3.5 h-3.5 ${score.isAbsent ? 'text-red-400' : 'text-green-400'}"></i>
                                            </div>
                                            ` : ''}
                                            <i data-lucide="chevron-right" class="w-5 h-5 text-slate-700 group-hover:text-slate-400 transition-colors"></i>
                                        </div>
                                    </div>
                                    
                                    <!-- Context Menu Trigger (Only for admins) -->
                                    ${RBAC.canManageMembers() ? `
                                        <button onclick="event.stopPropagation(); App.inactivateMemberPrompt('${member.id}')"
                                                class="absolute top-2 right-2 p-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-20">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            `;
                }).join('')}
                    </div>
                </div>
            `;

            this.mountPoint.innerHTML = html;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.toggleNavigation(true);

        } catch (error) {
            console.error('Error rendering unit:', error);
            Toast.show('Erro ao carregar unidade', 'error');
            this.navigate('dashboard');
        } finally {
            Loading.hide();
        }
    },

    addUnitPrompt() {
        const name = prompt('Nome da Nova Unidade:');
        if (name && name.trim()) {
            Store.addUnit(name.trim());
            this.navigate('dashboard');
        }
    },

    addMemberPrompt(unitId) {
        const name = prompt('Nome do Desbravador:');
        if (name && name.trim()) {
            Store.addMember(name.trim(), unitId);
            this.renderUnitDetails(unitId); // Refresh current view instead of full nav
        }
    },
};
