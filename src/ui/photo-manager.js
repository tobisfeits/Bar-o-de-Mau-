import { Loading } from './loading.js';
import { Toast } from './toast.js';
import { Cache } from '../data/cache.js';

export const PhotoManager = {
    BUCKET_NAME: 'member-photos',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB

    async uploadPhoto(memberId, file) {
        try {
            Loading.show('Enviando foto...');

            if (!file.type.startsWith('image/')) {
                throw new Error('Arquivo deve ser uma imagem');
            }

            if (file.size > this.MAX_FILE_SIZE) {
                throw new Error('Imagem muito grande (máximo 5MB)');
            }

            console.log('📸 Uploading photo for member:', memberId);
            const fileExt = file.name.split('.').pop();
            const fileName = `${memberId}_${Date.now()}.${fileExt}`;

            const { data, error } = await window.supabaseClient.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('❌ Storage upload error:', error);
                throw error;
            }

            const { data: urlData } = window.supabaseClient.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(fileName);

            const photoUrl = urlData.publicUrl;

            const { error: updateError } = await window.supabaseClient
                .from('members')
                .update({ photo_url: photoUrl })
                .eq('id', memberId);

            if (updateError) {
                console.error('❌ Database update error:', updateError);
                throw updateError;
            }

            Cache.clear();
            Loading.hide();
            Toast.show('Foto atualizada com sucesso!', 'success');

            return photoUrl;

        } catch (error) {
            Loading.hide();
            console.error('💥 Error uploading photo:', error);
            alert(`Erro ao enviar foto: ${error.message}`);
            throw error;
        }
    },

    async deletePhoto(memberId, photoUrl) {
        try {
            Loading.show('Removendo foto...');
            const urlParts = photoUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];

            const { error: deleteError } = await window.supabaseClient.storage
                .from(this.BUCKET_NAME)
                .remove([fileName]);

            if (deleteError) {
                console.error('⚠️ Storage delete error:', deleteError);
            }

            const { error: updateError } = await window.supabaseClient
                .from('members')
                .update({ photo_url: null })
                .eq('id', memberId);

            if (updateError) {
                console.error('❌ Database update error:', updateError);
                throw updateError;
            }

            Loading.hide();
            Toast.show('Foto removida com sucesso!', 'success');

        } catch (error) {
            Loading.hide();
            console.error('💥 Error deleting photo:', error);
            alert(`Erro ao remover foto: ${error.message}`);
            throw error;
        }
    },

    renderPhoto(member, size = 80) {
        const photoUrl = member.photo_url;
        const initials = this.getInitials(member.name);

        if (photoUrl) {
            return `
                <div class="relative" style="width: ${size}px; height: ${size}px;">
                    <img src="${photoUrl}" 
                         alt="${member.name}"
                         class="rounded-full object-cover"
                         style="width: ${size}px; height: ${size}px;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="rounded-full bg-gradient-to-br from-amber-400 to-amber-600 
                                flex items-center justify-center text-white font-bold absolute inset-0"
                         style="font-size: ${size / 3}px; display: none;">
                        ${initials}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="rounded-full bg-gradient-to-br from-amber-400 to-amber-600 
                            flex items-center justify-center text-white font-bold"
                     style="width: ${size}px; height: ${size}px; font-size: ${size / 3}px;">
                    ${initials}
                </div>
            `;
        }
    },

    getInitials(name) {
        if (!name) return '?';
        return name
            .split(' ')
            .filter(n => n.length > 0)
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    },

    renderUploadButton(memberId, currentPhotoUrl) {
        const hasPhoto = !!currentPhotoUrl;

        return `
            <div class="flex gap-2">
                <label for="photo-upload-${memberId}" 
                       class="btn-secondary flex items-center gap-2 cursor-pointer">
                    <i data-lucide="${hasPhoto ? 'image' : 'camera'}" class="w-4 h-4"></i>
                    ${hasPhoto ? 'Trocar Foto' : 'Adicionar Foto'}
                </label>
                <input type="file" 
                       id="photo-upload-${memberId}" 
                       accept="image/*" 
                       capture="environment"
                       class="hidden"
                       onchange="PhotoManager.handleFileSelect(event, '${memberId}')">
                
                ${hasPhoto ? `
                    <button onclick="PhotoManager.confirmDelete('${memberId}', '${currentPhotoUrl}')"
                            class="btn-danger flex items-center gap-2">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                        Remover
                    </button>
                ` : ''}
            </div>
        `;
    },

    async handleFileSelect(event, memberId) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await this.uploadPhoto(memberId, file);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            // Error already handled
        }
    },

    findBestMemberMatch(filename, members) {
        if (!filename || !members) return null;

        // Clean filename: remove extension, numbers, special chars
        const cleanName = filename
            .split('.')[0]
            .toLowerCase()
            .replace(/[0-9\-_]/g, ' ')
            .trim();

        if (!cleanName) return null;

        // Try exact match with first or last name
        const parts = cleanName.split(' ').filter(p => p.length > 1);

        for (const member of members) {
            const memberName = member.name.toLowerCase();

            // Check if full name contains the clean filename
            if (memberName.includes(cleanName) || cleanName.includes(memberName)) {
                return member.id;
            }

            // Check if parts match
            for (const part of parts) {
                if (memberName.includes(part)) {
                    return member.id;
                }
            }
        }

        return null;
    },

    confirmDelete(memberId, photoUrl) {
        if (confirm('Tem certeza que deseja remover esta foto?')) {
            this.deletePhoto(memberId, photoUrl).then(() => {
                window.location.reload();
            });
        }
    }
};
