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

let debounceTimer = null;

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

        // Date chain: explicit scoringDate → admin session date → today
        // Guard: if currentDate is a prayer-locked date, skip it silently (no redirect loop)
        let dateKey = this.scoringDate;
        if (!dateKey && this.currentDate) {
            dateKey = RBAC.canEditDate(this.currentDate) ? this.currentDate : null;
        }
        if (!dateKey) dateKey = Utils.getTodayKey();
        this.scoringDate = dateKey;

        // Final lock check for the resolved date
        if (!RBAC.canEditDate(dateKey)) {
            Toast.show('Esta data é restrita para lançamentos oficiais.', 'warning');
            this.navigate('dashboard');
            return;
        }

        // --- NEW: Calendar-Driven Event Check (v44.1) ---
        const meetings = await Store.getMeetings();
        const isOfficialMeeting = meetings.some(m => m.date === dateKey);

        if (!isOfficialMeeting) {
            Toast.show('⛔ Acesso Negado: Nenhuma Reunião Oficial no Calendário.', 'error');
            this.navigate('dashboard');
            return;
        }


        const score = await Store.getMemberScore(memberId, dateKey) || { items: {} };
        const unit = (await Store.getUnits()).find(u => u.id === member.unitId);
        const formattedDate = Utils.formatDate(dateKey);

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
                    <!-- Date Picker -->
                    <div class="mt-3 flex items-center justify-center gap-2">
                        <i data-lucide="calendar" class="w-4 h-4 text-slate-400"></i>
                        <label class="relative cursor-pointer">
                            <input type="date" id="scoring-date-picker" value="${dateKey}"
                                   onchange="App.changeScoringDate('${memberId}', this.value)"
                                   class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-bold text-center focus:border-brand-gold outline-none cursor-pointer">
                        </label>
                        <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            ${dateKey === Utils.getTodayKey() ? 'Hoje' : 'Retroativo'}
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
                    ${RBAC.canUploadPhotos() ? `
                    <div class="mt-4 flex justify-center">
                        ${photoUploadHtml}
                    </div>
                    ` : ''}
                </div>

                <!-- Attendance Status Selection -->
                <div class="px-4 mb-6">
                    <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Status da Chamada</label>
                    <div class="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
                        <!-- Selector Background -->
                        <div id="status-bg" class="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(33.33%-3px)] bg-brand-gold rounded-xl transition-all duration-300 z-0
                             ${!score ? 'translate-x-0 bg-slate-700' : (score.isAbsent ? 'translate-x-[200%] bg-red-600' : 'translate-x-full bg-green-600')}"></div>
                        
                        <button onclick="App.setAttendanceStatus('${memberId}', 'pending')" 
                                class="flex-1 py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all relative z-10
                                       ${!score ? 'text-white' : 'text-slate-500'}">
                            Pendente
                        </button>
                        <button onclick="App.setAttendanceStatus('${memberId}', 'present')" 
                                class="flex-1 py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all relative z-10
                                       ${score && !score.isAbsent ? 'text-white' : 'text-slate-500'}">
                            Presente
                        </button>
                        <button onclick="App.setAttendanceStatus('${memberId}', 'absent')" 
                                class="flex-1 py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all relative z-10
                                       ${score && score.isAbsent ? 'text-white' : 'text-slate-500'}">
                            Ausente
                        </button>
                    </div>
                </div>

                <!-- Score Items -->
                <div id="score-items-container" class="px-4 space-y-3 transition-all duration-300 
                     ${!score ? 'opacity-40 pointer-events-none' : (score.isAbsent ? 'opacity-30 pointer-events-none grayscale' : '')}">
                    
                    <div class="flex items-center justify-between mb-2 px-1">
                        <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Itens de Pontuação</label>
                        ${score && !score.isAbsent ? `
                            <span class="text-[10px] font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20">
                                Preenchimento Obrigatório
                            </span>
                        ` : ''}
                    </div>

                    ${CONFIG.SCORE_ITEMS.map(item => {
            // Binary logic: default is false when null to avoid white states
            const rawValue = score && score.items && score.items[item.id] !== undefined ? score.items[item.id] : null;
            const itemValue = rawValue === true; // Forces false if null/undefined or false
            
            const bgOn = '#16a34a';      // bg-green-600
            const bgOff = '#dc2626';     // bg-red-600
            
            let currentBg = itemValue ? bgOn : bgOff;
            let knobTransform = itemValue ? 'translateX(1.75rem)' : 'translateX(0)';
            
            let displayIcon = itemValue 
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

            return `
                            <div class="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-sm transition-all group overflow-hidden relative">
                                <div class="flex items-center justify-between relative z-10">
                                    <div class="flex flex-col">
                                        <span class="font-bold text-slate-200 group-hover:text-white transition-colors">
                                            ${item.name}
                                        </span>
                                        <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                            ${item.points} pts
                                        </span>
                                    </div>
                                    
                                    <!-- Binary Toggle switch -->
                                    <button onclick="App.cycleItemPoint('${item.id}', '${memberId}')"
                                            id="toggle-${item.id}"
                                            data-state="${itemValue}"
                                            style="background-color: ${currentBg};"
                                            class="relative w-16 h-8 rounded-full transition-colors duration-200 flex-shrink-0 flex items-center shadow-inner overflow-hidden ${item.id === 'presence' ? 'opacity-80 pointer-events-none cursor-not-allowed' : ''}"
                                            aria-pressed="${itemValue}">
                                        
                                        <!-- Knob -->
                                        <span class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-200 z-10 flex items-center justify-center border-b-2 border-slate-200"
                                              style="transform: ${knobTransform}; will-change: transform;">
                                            <div class="icon-indicator" style="color: ${currentBg}; transition: color 0.2s;">
                                                ${displayIcon}
                                            </div>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        `;
        }).join('')}

                        <!-- 10 Dias de Oração (Archiving Logic) -->
                        ${(this.scoringDate >= CONFIG.PRAYER_EVENT.startDate && this.scoringDate <= CONFIG.PRAYER_EVENT.endDate) ? `
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
                        ` : ''}
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/95 backdrop-blur border-t border-slate-800 z-40">
                    <div class="max-w-md mx-auto flex flex-col gap-3">
                         <button onclick="App.saveCurrentScore('${memberId}', false)" 
                                id="btn-save-score"
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

    cycleItemPoint(itemId, memberId) {
        const toggle = document.getElementById(`toggle-${itemId}`);
        if (!toggle) return;

        const currentState = toggle.getAttribute('data-state');
        
        // Binary Cycle: true -> false -> true
        const nextValue = currentState !== 'true';

        this.setItemPoint(itemId, nextValue);
        
        // Trigger auto-save debounce
        if (memberId) this.triggerAutoSave(memberId);
    },

    setItemPoint(itemId, value) {
        console.log(`🔘 setItemPoint: ${itemId} = ${value}`);
        if (Haptic) Haptic.selection();

        const toggle = document.getElementById(`toggle-${itemId}`);
        if (!toggle) return;

        const knob = toggle.querySelector('span');
        const iconContainer = knob?.querySelector('.icon-indicator');

        // Styles and Icons
        const bgOn = '#16a34a';
        const bgOff = '#dc2626';
        const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        const xIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

        // Update data-state for deterministic validation
        toggle.setAttribute('data-state', value);

        if (value === true) {
            toggle.style.backgroundColor = bgOn;
            toggle.setAttribute('aria-pressed', 'true');
            if (knob) knob.style.transform = 'translateX(1.75rem)';
            if (iconContainer) { iconContainer.innerHTML = checkIcon; iconContainer.style.color = bgOn; }
        } else {
            toggle.style.backgroundColor = bgOff;
            toggle.setAttribute('aria-pressed', 'false');
            if (knob) knob.style.transform = 'translateX(0)';
            if (iconContainer) { iconContainer.innerHTML = xIcon; iconContainer.style.color = bgOff; }
        }
    },

    setAttendanceStatus(memberId, status) {
        if (Haptic) Haptic.selection();

        const statusBg = document.getElementById('status-bg');
        const btns = {
            pending: document.querySelector(`button[onclick*="setAttendanceStatus('${memberId}', 'pending')"]`),
            present: document.querySelector(`button[onclick*="setAttendanceStatus('${memberId}', 'present')"]`),
            absent: document.querySelector(`button[onclick*="setAttendanceStatus('${memberId}', 'absent')"]`)
        };

        if (status === 'pending') {
            statusBg.style.transform = 'translateX(0)';
            statusBg.style.backgroundColor = '#334155'; // bg-slate-700
        } else if (status === 'present') {
            statusBg.style.transform = 'translateX(100%)';
            statusBg.style.backgroundColor = '#16a34a'; // bg-green-600
        } else {
            statusBg.style.transform = 'translateX(200%)';
            statusBg.style.backgroundColor = '#dc2626'; // bg-red-600
        }

        Object.keys(btns).forEach(key => {
            if (btns[key]) {
                btns[key].className = btns[key].className.replace(/text-white|text-slate-500/g, key === status ? 'text-white' : 'text-slate-500');
            }
        });

        const container = document.getElementById('score-items-container');
        if (status === 'pending') {
            container.classList.add('opacity-40', 'pointer-events-none');
            container.classList.remove('grayscale', 'opacity-30');
            this.setItemPoint('presence', false);
        } else if (status === 'absent') {
            // Master trigger: marking as absent sets all items to false and disables UI
            CONFIG.SCORE_ITEMS.forEach(item => this.setItemPoint(item.id, false));
            this.selectPrayerLevel('absent');
            container.classList.add('opacity-30', 'pointer-events-none', 'grayscale');
            container.classList.remove('opacity-40');
            // Trigger a consolidated auto-save for the entire record
            this.triggerAutoSave(memberId);
        } else {
            container.classList.remove('opacity-40', 'pointer-events-none', 'grayscale', 'opacity-30');
            this.setItemPoint('presence', true);
            // Trigger auto-save if changing to present as well
            this.triggerAutoSave(memberId);
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

    triggerAutoSave(memberId) {
        if (debounceTimer) clearTimeout(debounceTimer);

        // Update UI to show saving state gracefully
        const saveBtn = document.getElementById('btn-save-score');
        if (saveBtn) {
            saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Salvando...';
            saveBtn.classList.add('opacity-70');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        debounceTimer = setTimeout(() => {
            this.saveCurrentScore(memberId, true);
        }, 500);
    },

    async saveCurrentScore(memberId, isAutoSave = false) {
        const statusBg = document.getElementById('status-bg');
        if (!statusBg) return;

        // Determine status based on inline transform
        let status = 'pending';
        const transform = statusBg.style.transform;
        if (transform === 'translateX(100%)') status = 'present';
        else if (transform === 'translateX(200%)') status = 'absent';

        // Fallback for initial render where style might be in className
        if (status === 'pending') {
            if (statusBg.classList.contains('translate-x-full')) status = 'present';
            else if (statusBg.classList.contains('translate-x-[200%]')) status = 'absent';
        }

        if (status === 'pending') {
            Toast.show('Defina o status de presença (Presente ou Ausente) antes de salvar.', 'warning');
            if (Haptic) Haptic.error();
            return;
        }

        const isAbsent = (status === 'absent');
        const items = {};
        const missingItems = [];

        if (!isAbsent) {
            // Read toggle state for each item using data-state attribute
            CONFIG.SCORE_ITEMS.forEach(item => {
                const toggle = document.getElementById(`toggle-${item.id}`);
                if (!toggle) { missingItems.push(item.name); return; }

                const state = toggle.getAttribute('data-state');
                items[item.id] = state === 'true'; // Strict binary conversion
            });

            // Save prayer level based on inline styles (Conditional by Date)
            const isPrayerActive = (this.scoringDate >= CONFIG.PRAYER_EVENT.startDate && this.scoringDate <= CONFIG.PRAYER_EVENT.endDate);
            let selectedPrayer = null;

            if (isPrayerActive) {
                CONFIG.PRAYER_EVENT.levels.forEach(level => {
                    const el = document.getElementById(`prayer-${level.id}`);
                    // Check if it has an active border color from selectPrayerLevel
                    if (el && el.style.borderColor && el.style.borderColor !== 'rgba(51, 65, 85, 0.5)') {
                        selectedPrayer = level.id;
                    }
                });

                if (!selectedPrayer) {
                    // Fallback: check classes for initial render
                    CONFIG.PRAYER_EVENT.levels.forEach(level => {
                        const el = document.getElementById(`prayer-${level.id}`);
                        if (!selectedPrayer && (el?.classList.contains('border-green-500') ||
                            el?.classList.contains('border-yellow-500') ||
                            el?.classList.contains('border-orange-500') ||
                            el?.classList.contains('border-red-500'))) {
                            selectedPrayer = level.id;
                        }
                    });
                }

                if (!selectedPrayer) {
                    missingItems.push('10 Dias de Oração');
                } else {
                    items[CONFIG.PRAYER_EVENT.id] = selectedPrayer;
                }
            }

            if (missingItems.length > 0) {
                Toast.show(`Preencha todos os itens obrigatórios: ${missingItems[0]}${missingItems.length > 1 ? '...' : ''}`, 'error');
                if (Haptic) Haptic.error();
                return;
            }
        } else {
            CONFIG.SCORE_ITEMS.forEach(item => items[item.id] = false);
            items[CONFIG.PRAYER_EVENT.id] = 'absent';
        }

        const scoreData = { isAbsent, items };

        try {
            if (!isAutoSave) {
                // Only block UI with Loading if it's a manual save click
                Loading.show('Salvando...');
            }

            const saveDate = this.scoringDate || Utils.getTodayKey();
            
            // Call saveScore which now has the 5s timeout built-in
            await Store.saveScore(memberId, saveDate, scoreData);

            if (!isAutoSave) {
                const isRetroactive = saveDate !== Utils.getTodayKey();
                Toast.show(isRetroactive ? `Salvo para ${Utils.formatDate(saveDate)}!` : 'Salvo com sucesso!', 'success');
                if (Haptic) Haptic.success();
                await this.renderScoring(memberId);
            } else {
                // Revert saving button state gracefully
                const saveBtn = document.getElementById('btn-save-score');
                if (saveBtn) {
                    saveBtn.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i> Salvo';
                    saveBtn.classList.remove('opacity-70');
                    saveBtn.classList.add('bg-green-600');
                    if (typeof lucide !== 'undefined') lucide.createIcons();

                    setTimeout(() => {
                        if (saveBtn) {
                            saveBtn.innerHTML = '<i data-lucide="save" class="w-5 h-5"></i> Salvar Pontuação';
                            saveBtn.classList.remove('bg-green-600');
                        }
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error saving score:', error);
            Toast.show('Falha na conexão. Os dados foram salvos na fila offline e serão enviados depois.', 'warning');
            
            if (isAutoSave) {
                const saveBtn = document.getElementById('btn-save-score');
                if (saveBtn) {
                    saveBtn.innerHTML = '<i data-lucide="cloud-off" class="w-5 h-5"></i> Na Fila Inativa';
                    saveBtn.classList.remove('opacity-70');
                    saveBtn.classList.replace('bg-blue-600', 'bg-yellow-600');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }
        } finally {
            if (!isAutoSave) Loading.hide();
        }
    },

    changeScoringDate(memberId, newDate) {
        if (!newDate) return;
        // Skip re-render if date hasn't changed (some mobile date pickers fire onchange on dismiss)
        if (newDate === this.scoringDate) return;

        // Lock check
        if (!RBAC.canEditDate(newDate)) {
            Toast.show('Esta data é restrita para lançamentos oficiais.', 'warning');
            return;
        }

        this.scoringDate = newDate;
        this.renderScoring(memberId);
    },

    inactivateMemberPrompt(memberId) {
        ConfirmDialog.show(
            'Tem certeza que deseja inativar este desbravador? Ele não aparecerá mais nas listas, mas o histórico será mantido.',
            () => this.inactivateMember(memberId)
        );
    },

    async inactivateMember(memberId) {
        const member = (await Store.getMembers()).find(m => m.id === memberId);
        if (!member) return;
        await Store.inactivateMember(memberId);
        Toast.show('Membro inativado com sucesso', 'success');
        this.navigate('unit', { unitId: member.unitId });
    }
};
