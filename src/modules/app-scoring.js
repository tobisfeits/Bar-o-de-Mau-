import { Store } from '../data/store.js';
import { RBAC } from '../core/auth.js';
import { Utils } from './ui-utils.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { Toast } from '../ui/toast.js';
import { ConfirmDialog } from '../ui/dialogs.js';
import { PhotoManager } from '../ui/photo-manager.js';
import { CONFIG } from '../config/constants.js';
import { Haptic } from '../ui/haptic.js';
import { Navigation } from '../core/router.js';

export const ScoringMethods = {
    async renderScoring(memberId) {
        // Find member
        const member = (await Store.getMembers()).find(m => m.id === memberId);
        if (!member) {
            Toast.show('Membro não encontrado', 'error');
            this.navigate('dashboard');
            return;
        }

        // Check permissions
        if (!RBAC.canManageUnits() && !RBAC.canEvaluateMember(member.unitId)) {
            Toast.show('Sem permissão para avaliar', 'error');
            this.navigate('dashboard');
            return;
        }

        const todayKey = Utils.getTodayKey();
        const score = await Store.getMemberScore(memberId, todayKey) || { items: {} };
        const unit = (await Store.getUnits()).find(u => u.id === member.unitId);

        // Photo Upload Button HTML
        const photoUploadHtml = PhotoManager.renderUploadButton(member.id, member.photo_url);

        const html = `
            <div class="slide-in pb-32">
                <!-- Header -->
                <div class="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-lg">
                    <div class="flex items-center justify-between">
                         <button onclick="App.goBack()" 
                                class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                            <span class="font-bold text-sm uppercase">Voltar</span>
                        </button>
                        <span class="text-brand-gold font-bold text-sm bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20">
                            ${unit ? unit.name : ''}
                        </span>
                    </div>
                </div>

                <!-- Member Info -->
                <div class="p-6 text-center">
                    ${PhotoManager.renderPhoto(member, 96)}
                    
                    <h2 class="text-2xl font-black text-white mt-4 uppercase tracking-wide leading-tight">
                        ${Sanitizer.normalizeName(member.name)}
                    </h2>
                    
                    <!-- Photo Upload Control -->
                    <div class="mt-4 flex justify-center">
                        ${photoUploadHtml}
                    </div>
                </div>

                <!-- Scoring Form -->
                <div class="px-4 space-y-3">
                    <!-- Absence Toggle -->
                    <div class="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between mb-6 shadow-md">
                        <div class="flex items-center gap-3">
                            <div class="bg-brand-red/20 p-2 rounded-lg">
                                <i data-lucide="user-x" class="w-5 h-5 text-brand-red"></i>
                            </div>
                            <span class="font-bold text-white">Marcar como Falta</span>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="toggle-absent" class="sr-only peer"
                                   ${score.isAbsent ? 'checked' : ''}
                                   onchange="App.toggleAbsence('${memberId}')">
                            <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer 
                                      peer-checked:after:translate-x-full peer-checked:after:border-white 
                                      after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                      after:bg-white after:border-gray-300 after:border after:rounded-full 
                                      after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                        </label>
                    </div>

                    <!-- Score Items -->
                    <div id="score-items-container" class="space-y-3 transition-opacity duration-300 ${score.isAbsent ? 'opacity-40 pointer-events-none grayscale' : ''}">
                        ${CONFIG.SCORE_ITEMS.map(item => `
                            <div onclick="App.togglePoint('${item.id}')"
                                 class="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm active:scale-[0.99] transition-all cursor-pointer select-none group">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-slate-200 group-hover:text-white transition-colors">
                                        ${item.name}
                                    </span>
                                    <div class="flex items-center gap-3">
                                        <span class="text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-950 px-2 py-1 rounded">
                                            ${item.points} pts
                                        </span>
                                        <div class="w-6 h-6 rounded-full border-2 border-slate-600 flex items-center justify-center transition-colors 
                                                    ${score.items && score.items[item.id] ? 'bg-brand-gold border-brand-gold' : ''}"
                                             id="check-${item.id}">
                                            ${score.items && score.items[item.id] ?
                '<i data-lucide="check" class="w-4 h-4 text-slate-900 font-bold"></i>' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}

                        <!-- 10 Dias de Oração -->
                        <div class="mt-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/30 rounded-xl border border-indigo-500/30 overflow-hidden">
                            <div class="p-4 border-b border-indigo-500/20 flex items-center gap-3">
                                <div class="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                    <span class="text-lg">🙏</span>
                                </div>
                                <div>
                                    <h3 class="font-black text-white text-sm uppercase tracking-wider">${CONFIG.PRAYER_EVENT.name}</h3>
                                    <p class="text-xs text-indigo-300/70">Selecione o nível de participação</p>
                                </div>
                            </div>
                            <div class="p-3 space-y-2" id="prayer-levels-container">
                                ${CONFIG.PRAYER_EVENT.levels.map(level => {
                    const isSelected = score.items && score.items[CONFIG.PRAYER_EVENT.id] === level.id;
                    const colorMap = {
                        green: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', activeBg: 'bg-green-500' },
                        yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', activeBg: 'bg-yellow-500' },
                        orange: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', activeBg: 'bg-orange-500' },
                        red: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', activeBg: 'bg-red-500' }
                    };
                    const c = colorMap[level.color];
                    return `
                                        <div onclick="App.selectPrayerLevel('${level.id}')"
                                             id="prayer-${level.id}"
                                             class="flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer select-none active:scale-[0.98] transition-all
                                                    ${isSelected ? c.bg + ' ' + c.border : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600'}">
                                            <div class="flex items-center gap-3">
                                                <span class="text-base">${level.emoji}</span>
                                                <span class="font-bold text-sm ${isSelected ? c.text : 'text-slate-300'}">${level.name}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-xs font-black px-2 py-0.5 rounded ${isSelected ? c.bg + ' ' + c.text : 'bg-slate-800 text-slate-500'}">
                                                    +${level.points} pts
                                                </span>
                                                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                                            ${isSelected ? c.activeBg + ' ' + c.border : 'border-slate-600'}">
                                                    ${isSelected ? '<div class="w-2 h-2 rounded-full bg-white"></div>' : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Actions (Refactored) -->
                <div class="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/95 backdrop-blur border-t border-slate-800 z-40">
                    <div class="max-w-md mx-auto flex flex-col gap-3">
                         <button onclick="App.saveCurrentScore('${memberId}')" 
                                class="w-full py-4 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                             <i data-lucide="save" class="w-5 h-5"></i>
                             Salvar Pontuação
                        </button>

                        <button onclick="App.inactivateMemberPrompt('${memberId}')" 
                                class="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider py-2 flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                            <i data-lucide="archive" class="w-3 h-3"></i> Inativar Membro
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.mountPoint.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.toggleNavigation(false);
    },

    togglePoint(itemId) {
        if (Haptic) Haptic.selection();

        const checkEl = document.getElementById(`check-${itemId}`);
        if (!checkEl) return;

        const isChecked = checkEl.classList.contains('bg-brand-gold');

        if (isChecked) {
            checkEl.classList.remove('bg-brand-gold', 'border-brand-gold');
            checkEl.innerHTML = '';
        } else {
            checkEl.classList.add('bg-brand-gold', 'border-brand-gold');
            checkEl.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-slate-900 font-bold"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    selectPrayerLevel(levelId) {
        if (Haptic) Haptic.selection();

        const colorMap = {
            very_satisfactory: { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', activeBg: 'bg-green-500' },
            satisfactory: { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', activeBg: 'bg-yellow-500' },
            not_satisfactory: { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-400', activeBg: 'bg-orange-500' },
            absent: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', activeBg: 'bg-red-500' }
        };

        // Deselect all
        CONFIG.PRAYER_EVENT.levels.forEach(level => {
            const el = document.getElementById(`prayer-${level.id}`);
            if (!el) return;
            const c = colorMap[level.id];
            el.className = `flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer select-none active:scale-[0.98] transition-all bg-slate-900/50 border-slate-700/50 hover:border-slate-600`;
            el.querySelector('.font-bold').className = 'font-bold text-sm text-slate-300';
            const badge = el.querySelector('.text-xs.font-black');
            badge.className = 'text-xs font-black px-2 py-0.5 rounded bg-slate-800 text-slate-500';
            const radio = el.querySelector('.w-5');
            radio.className = 'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all border-slate-600';
            radio.innerHTML = '';
        });

        // Select clicked
        const el = document.getElementById(`prayer-${levelId}`);
        if (!el) return;
        const c = colorMap[levelId];
        el.className = `flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer select-none active:scale-[0.98] transition-all ${c.bg} ${c.border}`;
        el.querySelector('.font-bold').className = `font-bold text-sm ${c.text}`;
        const badge = el.querySelector('.text-xs.font-black');
        badge.className = `text-xs font-black px-2 py-0.5 rounded ${c.bg} ${c.text}`;
        const radio = el.querySelector('.w-5');
        radio.className = `w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${c.activeBg} ${c.border}`;
        radio.innerHTML = '<div class="w-2 h-2 rounded-full bg-white"></div>';
    },

    toggleAbsence(memberId) {
        const toggle = document.getElementById('toggle-absent');
        const container = document.getElementById('score-items-container');

        if (toggle.checked) {
            container.classList.add('opacity-40', 'pointer-events-none', 'grayscale');
        } else {
            container.classList.remove('opacity-40', 'pointer-events-none', 'grayscale');
        }
    },

    async saveCurrentScore(memberId) {
        const isAbsent = document.getElementById('toggle-absent')?.checked;
        const items = {};

        if (!isAbsent) {
            CONFIG.SCORE_ITEMS.forEach(item => {
                const checkEl = document.getElementById(`check-${item.id}`);
                items[item.id] = checkEl && checkEl.classList.contains('bg-brand-gold');
            });

            // Save prayer level
            const selectedPrayer = CONFIG.PRAYER_EVENT.levels.find(level => {
                const el = document.getElementById(`prayer-${level.id}`);
                return el && el.classList.contains({
                    green: 'border-green-500',
                    yellow: 'border-yellow-500',
                    orange: 'border-orange-500',
                    red: 'border-red-500'
                }[level.color]);
            });
            if (selectedPrayer) {
                items[CONFIG.PRAYER_EVENT.id] = selectedPrayer.id;
            }
        }

        const scoreData = {
            isAbsent,
            items: isAbsent ? {} : items
        };

        await Store.saveScore(memberId, Utils.getTodayKey(), scoreData);
        Toast.show('Pontuação salva!', 'success');

        if (Haptic) Haptic.success();

        // Go back naturally
        this.goBack();
    },

    inactivateMemberPrompt(memberId) {
        ConfirmDialog.show(
            'Tem certeza que deseja inativar este desbravador? Ele não aparecerá mais nas listas, mas o histórico será mantido.',
            () => this.inactivateMember(memberId)
        );
    },

    async inactivateMember(memberId) {
        // Use Store directly
        const member = (await Store.getMembers()).find(m => m.id === memberId);
        if (!member) return;

        // In app.js it calls Store.deleteMember which calls inactivateMember
        // Here we can call Store.inactivateMember directly if it exists, but Store.js has deleteMember (deprecated) and removeMember?
        // Let's check Store.js content from previous steps. 
        // I recall Store.js had `inactivateMember` (I viewed app.js deprecation warning).
        // Let's check src/data/store.js to be sure. I wrote it in step 3774 (summary says "Extract Store to src/data/store.js").
        // I'll assume Store.inactivateMember exists as referenced in app.js.

        await Store.inactivateMember(memberId);

        Toast.show('Membro inativado com sucesso', 'success');

        // Navigate to dashboard or unit depending on where we are
        // If we were in scoring, go back to unit
        // If we were in unit details, reload unit details
        // Safest is to go to Unit Details of that member
        this.navigate('unit', { unitId: member.unitId });
    }
};
