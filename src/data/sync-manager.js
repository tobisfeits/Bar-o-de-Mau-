import { DevStorage } from './dev-storage.js';
import { DataAdapter } from './repository.js';
import { Toast } from '../ui/toast.js';

export const SyncManager = {
    STORAGE_KEY: 'cd_sync_queue',
    queue: [],
    isSyncing: false,
    onStatusChange: null, // Callback for UI updates

    init() {
        this.loadQueue();

        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('🌐 Online detected! Attempting sync...');
            this.processQueue();
        });

        // Periodic check (every 1 minute)
        setInterval(() => {
            if (navigator.onLine && this.getPendingCount() > 0) {
                this.processQueue();
            }
        }, 60000);

        console.log(`🔄 SyncManager initialized with ${this.getPendingCount()} items pending.`);
    },

    loadQueue() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        try {
            this.queue = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading sync queue:', e);
            this.queue = [];
        }
        this.notifyStatus();
    },

    saveQueue() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
        this.notifyStatus();
    },

    /**
     * Add an item to the sync queue
     * @param {string} type - Action type (e.g., 'SAVE_SCORE', 'SAVE_MEMBER')
     * @param {Object} payload - Data needed to perform the action
     */
    enqueue(type, payload) {
        const item = {
            id: crypto.randomUUID(),
            type,
            payload,
            timestamp: new Date().toISOString(),
            retryCount: 0
        };

        this.queue.push(item);
        this.saveQueue();
        Toast.show('Sem internet. Salvo na fila para envio automático.', 'info');
    },

    getPendingCount() {
        return this.queue.length;
    },

    setStatusListener(callback) {
        this.onStatusChange = callback;
        // Immediate callback with current status
        this.notifyStatus();
    },

    notifyStatus() {
        if (this.onStatusChange) {
            this.onStatusChange({
                pending: this.getPendingCount(),
                isSyncing: this.isSyncing,
                isOnline: navigator.onLine
            });
        }
    },

    async processQueue() {
        if (this.isSyncing || this.queue.length === 0 || !navigator.onLine) return;

        this.isSyncing = true;
        this.notifyStatus();

        console.log(`🚀 Processing sync queue: ${this.queue.length} items`);

        const remainingItems = [];
        let successCount = 0;

        for (const item of this.queue) {
            try {
                await this.processItem(item);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to process sync item ${item.type}:`, error);
                item.retryCount++;
                // Keep in queue if it hasn't failed too many times (e.g. 50)
                // Or maybe keep forever until manual intervention? 
                // Let's keep forever for now, as data loss is critical.
                remainingItems.push(item);
            }
        }

        this.queue = remainingItems;
        this.saveQueue();
        this.isSyncing = false;
        this.notifyStatus();

        if (successCount > 0) {
            Toast.show(`${successCount} itens sincronizados com sucesso!`, 'success');
        }
    },

    async processItem(item) {
        // We use window.supabaseClient directly here or DataAdapter if we separate internal logic
        // But DataAdapter methods might try to re-queue if they fail!
        // So we need to call the "raw" supabase logic or have a flag in DataAdapter methods.
        // Better approach: Call Supabase directly or use DataAdapter with a flag.

        // Let's implement the logic for each type here to ensure we don't recursive loop
        const { type, payload } = item;

        if (!window.supabaseClient) throw new Error('Supabase client not initialized');

        switch (type) {
            case 'SAVE_SCORE':
                await this.syncScore(payload);
                break;
            case 'SAVE_MEMBER':
                await this.syncMember(payload);
                break;
            case 'DELETE_MEMBER':
                await this.syncDeleteMember(payload);
                break;
            // Add other types as needed
            default:
                console.warn('Unknown sync item type:', type);
        }
    },

    // --- Sync Implementations ---

    async syncScore(payload) {
        const { memberId, date, data } = payload;
        const { error } = await window.supabaseClient
            .from('scores')
            .upsert({
                member_id: memberId,
                date: date,
                is_absent: data.isAbsent,
                items: data.items,
                created_by: data.createdBy,
                created_by_id: data.createdById,
                created_at: data.createdAt
            }, {
                onConflict: 'member_id,date'
            });

        if (error) throw error;
    },

    async syncMember(payload) {
        const { error } = await window.supabaseClient
            .from('members')
            .upsert(payload); // Payload should be the dbMember object ready for insertion

        if (error) throw error;
    },

    async syncDeleteMember(payload) {
        const { memberId } = payload;
        const { error } = await window.supabaseClient
            .from('members')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', memberId);

        if (error) throw error;
    }
};
