// ============================================
// PHOTO MANAGER - Profile Photos
// ============================================
const PhotoManager = {
    BUCKET_NAME: 'member-photos',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB

    /**
     * Upload member profile photo
     */
    async uploadPhoto(memberId, file) {
        try {
            Loading.show('Enviando foto...');

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Arquivo deve ser uma imagem');
            }

            // Validate file size
            if (file.size > this.MAX_FILE_SIZE) {
                throw new Error('Imagem muito grande (máximo 5MB)');
            }

            console.log('📸 Uploading photo for member:', memberId);
            console.log('   File:', file.name, file.type, `${(file.size / 1024).toFixed(2)}KB`);

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${memberId}_${Date.now()}.${fileExt}`;

            console.log('   Generated filename:', fileName);

            // Upload to Supabase Storage
            const { data, error } = await supabaseClient.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('❌ Storage upload error:', error);
                throw error;
            }

            console.log('✅ File uploaded:', data);

            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(fileName);

            const photoUrl = urlData.publicUrl;
            console.log('📷 Public URL:', photoUrl);

            // Update member record
            const { error: updateError } = await supabaseClient
                .from('members')
                .update({ photo_url: photoUrl })
                .eq('id', memberId);

            if (updateError) {
                console.error('❌ Database update error:', updateError);
                throw updateError;
            }

            console.log('✅ Member photo_url updated');

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

    /**
     * Delete member profile photo
     */
    async deletePhoto(memberId, photoUrl) {
        try {
            Loading.show('Removendo foto...');

            console.log('🗑️ Deleting photo for member:', memberId);
            console.log('   URL:', photoUrl);

            // Extract filename from URL
            const urlParts = photoUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];

            console.log('   Filename:', fileName);

            // Delete from storage
            const { error: deleteError } = await supabaseClient.storage
                .from(this.BUCKET_NAME)
                .remove([fileName]);

            if (deleteError) {
                console.error('⚠️ Storage delete error:', deleteError);
                // Continue anyway - file might not exist
            } else {
                console.log('✅ File deleted from storage');
            }

            // Update member record
            const { error: updateError } = await supabaseClient
                .from('members')
                .update({ photo_url: null })
                .eq('id', memberId);

            if (updateError) {
                console.error('❌ Database update error:', updateError);
                throw updateError;
            }

            console.log('✅ Member photo_url cleared');

            Loading.hide();
            Toast.show('Foto removida com sucesso!', 'success');

        } catch (error) {
            Loading.hide();
            console.error('💥 Error deleting photo:', error);
            alert(`Erro ao remover foto: ${error.message}`);
            throw error;
        }
    },

    /**
     * Render member photo with fallback to initials
     */
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
            // Placeholder with initials
            return `
                <div class="rounded-full bg-gradient-to-br from-amber-400 to-amber-600 
                            flex items-center justify-center text-white font-bold"
                     style="width: ${size}px; height: ${size}px; font-size: ${size / 3}px;">
                    ${initials}
                </div>
            `;
        }
    },

    /**
     * Get initials from name
     */
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

    /**
     * Render photo upload button
     */
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

    /**
     * Handle file selection
     */
    async handleFileSelect(event, memberId) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await this.uploadPhoto(memberId, file);
            // Reload page to show new photo
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            // Error already handled in uploadPhoto
        }
    },

    /**
     * Confirm photo deletion
     */
    confirmDelete(memberId, photoUrl) {
        if (confirm('Tem certeza que deseja remover esta foto?')) {
            this.deletePhoto(memberId, photoUrl).then(() => {
                // Reload current view to show placeholder
                if (App.currentView === 'member-detail') {
                    App.navigate('member-detail', { id: memberId });
                }
            });
        }
    }
};
