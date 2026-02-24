import { Store } from '../data/store.js';
import { RBAC } from '../core/auth.js';
import { Utils } from './ui-utils.js';
import { Sanitizer } from '../utils/sanitizer.js';
import { Toast } from '../ui/toast.js';
import { Loading } from '../ui/loading.js';
import { PhotoManager } from '../ui/photo-manager.js';

export const PhotoMethods = {
    async renderPhotoManagement() {
        if (!RBAC.isSuperAdmin()) {
            this.navigate('dashboard');
            return;
        }

        Loading.show('Carregando gerenciador de fotos...');

        try {
            const members = await Store.getMembers();
            const units = await Store.getUnits();

            const html = `
                <div class="slide-in pb-24">
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-black text-white uppercase tracking-wider">Fotos</h2>
                            <p class="text-slate-400 text-sm font-medium">Gerenciamento centralizado</p>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div class="flex bg-slate-900 p-1 rounded-xl mb-6">
                        <button onclick="App.setPhotoTab('bulk')" 
                                id="tab-bulk"
                                class="flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all bg-brand-gold text-slate-900 shadow-lg">
                            Upload em Massa
                        </button>
                        <button onclick="App.setPhotoTab('quick')" 
                                id="tab-quick"
                                class="flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all text-slate-400 hover:text-white">
                            Captura Rápida
                        </button>
                    </div>

                    <!-- Bulk Upload Tab -->
                    <div id="photo-content-bulk" class="block animate-fade-in">
                        <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                            <div class="flex items-center gap-3">
                                <i data-lucide="info" class="w-5 h-5 text-blue-400"></i>
                                <p class="text-xs text-blue-200">
                                    <strong>Dica:</strong> Nomeie os arquivos com o nome do desbravador (ex: joao.jpg) para o sistema identificar automaticamente.
                                </p>
                            </div>
                        </div>

                        <div class="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center hover:border-brand-gold/50 transition-colors cursor-pointer mb-6"
                             onclick="document.getElementById('bulk-photo-input').click()">
                            <i data-lucide="upload-cloud" class="w-12 h-12 text-slate-500 mx-auto mb-3"></i>
                            <h3 class="text-white font-bold mb-1">Selecionar Fotos</h3>
                            <p class="text-xs text-slate-500 lowercase">Arraste ou clique para selecionar múltiplos arquivos</p>
                            <input type="file" id="bulk-photo-input" multiple accept="image/*" class="hidden" 
                                   onchange="App.handleBulkPhotoSelection(event)">
                        </div>

                        <div id="bulk-preview-grid" class="grid gap-4">
                            <p class="text-center text-slate-600 text-sm py-8 italic">Nenhuma foto selecionada</p>
                        </div>

                        <div id="bulk-actions" class="hidden fixed bottom-24 left-4 right-4 z-40">
                            <button id="bulk-upload-submit" 
                                    onclick="App.submitBulkPhotos()"
                                    class="w-full bg-brand-gold text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-gold/20 flex items-center justify-center gap-2">
                                <i data-lucide="send" class="w-5 h-5"></i>
                                Enviar Tudo
                            </button>
                        </div>
                    </div>

                    <!-- Quick Capture Tab -->
                    <div id="photo-content-quick" class="hidden animate-fade-in">
                        <!-- Unit Filter -->
                        <div class="mb-6">
                            <select id="quick-unit-filter" 
                                    onchange="App.renderQuickCaptureList(this.value)"
                                    class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-brand-gold outline-none appearance-none">
                                <option value="">Todas as Unidades</option>
                                ${units.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                            </select>
                        </div>

                        <div id="quick-capture-list" class="space-y-3">
                            <!-- Members list will be rendered here -->
                        </div>
                    </div>
                </div>
            `;

            this.mountPoint.innerHTML = html;

            // State for bulk upload
            this.pendingPhotos = [];

            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.toggleNavigation(true);

            // If starting with quick capture, render it
            if (this.currentPhotoTab === 'quick') {
                this.setPhotoTab('quick');
            }

        } catch (error) {
            console.error('Error rendering photo management:', error);
            Toast.show('Erro ao carregar gerenciador de fotos', 'error');
        } finally {
            Loading.hide();
        }
    },

    setPhotoTab(tab) {
        this.currentPhotoTab = tab;
        const bulkBtn = document.getElementById('tab-bulk');
        const quickBtn = document.getElementById('tab-quick');
        const bulkContent = document.getElementById('photo-content-bulk');
        const quickContent = document.getElementById('photo-content-quick');

        if (tab === 'bulk') {
            bulkBtn.className = 'flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all bg-brand-gold text-slate-900 shadow-lg';
            quickBtn.className = 'flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all text-slate-400 hover:text-white';
            bulkContent.classList.remove('hidden');
            quickContent.classList.add('hidden');
            document.getElementById('bulk-actions').classList.toggle('hidden', this.pendingPhotos?.length === 0);
        } else {
            quickBtn.className = 'flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all bg-brand-gold text-slate-900 shadow-lg';
            bulkBtn.className = 'flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all text-slate-400 hover:text-white';
            quickContent.classList.remove('hidden');
            bulkContent.classList.add('hidden');
            document.getElementById('bulk-actions').classList.add('hidden');
            this.renderQuickCaptureList();
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async handleBulkPhotoSelection(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        Loading.show('Processando arquivos...');

        try {
            const members = await Store.getMembers();

            for (const file of files) {
                // Suggest member based on filename
                const suggestedMemberId = PhotoManager.findBestMemberMatch(file.name, members);

                this.pendingPhotos.push({
                    file,
                    preview: URL.createObjectURL(file),
                    memberId: suggestedMemberId || ''
                });
            }

            this.renderBulkGrid();
            document.getElementById('bulk-actions').classList.remove('hidden');

        } catch (error) {
            console.error('Error processing photos:', error);
        } finally {
            Loading.hide();
        }
    },

    async renderBulkGrid() {
        const grid = document.getElementById('bulk-preview-grid');
        const members = await Store.getMembers();

        if (this.pendingPhotos.length === 0) {
            grid.innerHTML = '<p class="text-center text-slate-600 text-sm py-8 italic">Nenhuma foto selecionada</p>';
            document.getElementById('bulk-actions').classList.add('hidden');
            return;
        }

        grid.innerHTML = this.pendingPhotos.map((item, index) => `
            <div class="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex items-center gap-4 animate-fade-in relative group" id="photo-card-${index}">
                 <button onclick="App.removePendingPhoto(${index})" 
                        class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>

                <div class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-800">
                    <img src="${item.preview}" class="w-full h-full object-cover">
                </div>
                
                <div class="flex-1 min-w-0">
                    <p class="text-[10px] text-slate-500 truncate mb-1">${item.file.name}</p>
                    <select onchange="App.setPendingMember(${index}, this.value)"
                            class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:border-brand-gold outline-none">
                        <option value="">Vincular membro...</option>
                        ${members.map(m => `
                            <option value="${m.id}" ${item.memberId === m.id ? 'selected' : ''}>
                                ${Sanitizer.normalizeName(m.name)}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div id="status-icon-${index}" class="flex-shrink-0">
                    ${item.memberId ?
                '<i data-lucide="check-circle" class="w-5 h-5 text-green-500"></i>' :
                '<i data-lucide="alert-circle" class="w-5 h-5 text-yellow-500"></i>'}
                </div>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    removePendingPhoto(index) {
        this.pendingPhotos.splice(index, 1);
        this.renderBulkGrid();
    },

    setPendingMember(index, memberId) {
        this.pendingPhotos[index].memberId = memberId;
        const iconContainer = document.getElementById(`status-icon-${index}`);
        if (iconContainer) {
            iconContainer.innerHTML = memberId ?
                '<i data-lucide="check-circle" class="w-5 h-5 text-green-500"></i>' :
                '<i data-lucide="alert-circle" class="w-5 h-5 text-yellow-500"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    async submitBulkPhotos() {
        // Validate
        const missing = this.pendingPhotos.filter(p => !p.memberId);
        if (missing.length > 0) {
            Toast.show(`Vincule todos os ${missing.length} desbravadores primeiro`, 'error');
            return;
        }

        const btn = document.getElementById('bulk-upload-submit');
        const originalContent = btn.innerHTML;
        btn.disabled = true;

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < this.pendingPhotos.length; i++) {
            const item = this.pendingPhotos[i];
            const card = document.getElementById(`photo-card-${i}`);

            try {
                card.classList.add('opacity-50', 'pointer-events-none');
                btn.innerHTML = `<i class="w-5 h-5 animate-spin border-2 border-slate-900 border-t-transparent rounded-full"></i> Enviando ${i + 1}/${this.pendingPhotos.length}...`;

                await PhotoManager.uploadPhoto(item.memberId, item.file, false); // false to avoid reload

                card.classList.remove('opacity-50');
                card.classList.add('border-green-500/50', 'bg-green-500/5');
                successCount++;
            } catch (error) {
                console.error(`Error uploading photo ${i}:`, error);
                card.classList.remove('opacity-50');
                card.classList.add('border-red-500/50', 'bg-red-500/5');
                errorCount++;
            }
        }

        Toast.show(`${successCount} fotos enviadas com sucesso!`, successCount > 0 ? 'success' : 'error');

        if (errorCount === 0) {
            this.pendingPhotos = [];
            setTimeout(() => this.renderPhotoManagement(), 1500);
        } else {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    },

    async renderQuickCaptureList(unitIdFilter = '') {
        const container = document.getElementById('quick-capture-list');
        if (!container) return;

        let members = await Store.getMembers();
        const units = await Store.getUnits();

        if (unitIdFilter) {
            members = members.filter(m => m.unitId === unitIdFilter);
        }

        // Sort by name
        members.sort((a, b) => a.name.localeCompare(b.name));

        container.innerHTML = members.map(m => {
            const unit = units.find(u => u.id === m.unitId);
            return `
                <div class="bg-slate-900 p-3 rounded-2xl border border-slate-700 flex items-center justify-between group">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full overflow-hidden border-2 ${m.photo_url ? 'border-brand-gold' : 'border-slate-800'} bg-slate-800 flex items-center justify-center">
                            ${m.photo_url ?
                    `<img src="${m.photo_url}" class="w-full h-full object-cover">` :
                    `<span class="text-xs text-slate-500 font-bold">${m.name.substring(0, 2).toUpperCase()}</span>`}
                        </div>
                        <div>
                            <p class="text-white font-bold text-sm truncate max-w-[150px]">${Sanitizer.normalizeName(m.name)}</p>
                            <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest">${unit?.name || '---'}</p>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <label for="capture-${m.id}" 
                               class="w-12 h-12 rounded-xl bg-slate-800 text-brand-gold border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer active:scale-90">
                            <i data-lucide="camera" class="w-6 h-6"></i>
                            <input type="file" id="capture-${m.id}" accept="image/*" capture="environment" class="hidden" 
                                   onchange="App.handleQuickCapture(event, '${m.id}')">
                        </label>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async handleQuickCapture(event, memberId) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await PhotoManager.uploadPhoto(memberId, file, false);
            this.renderQuickCaptureList(document.getElementById('quick-unit-filter')?.value);
        } catch (error) {
            // Already handled
        }
    }
};
