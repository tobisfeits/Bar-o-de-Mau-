import { SUPABASE_CONFIG } from '../config/env.js';
import { CONFIG } from '../config/constants.js';
import { Cache } from '../data/cache.js';
import { Toast } from '../ui/toast.js';
import { DevStorage } from './dev-storage.js';
import { SyncManager } from './sync-manager.js';

export const DataAdapter = {
    useSupabase() {
        // window.supabaseClient must be set by env.js initializer
        return SUPABASE_CONFIG.enabled && window.supabaseClient;
    },

    // UNITS
    async getUnits() {
        const cached = Cache.get('units');
        if (cached) return cached;

        if (this.useSupabase()) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('units')
                    .select('*')
                    .order('name');

                if (error) throw error;
                Cache.set('units', data || []);
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar unidades do Supabase:', error);
                Toast.show('Modo offline ativado', 'warning');
                SUPABASE_CONFIG.enabled = false;
                return this.getUnits();
            }
        } else {
            const units = DevStorage.get(CONFIG.STORAGE_KEYS.UNITS) || [];
            Cache.set('units', units);
            return units;
        }
    },

    async saveUnit(unit) {
        if (this.useSupabase()) {
            const { error } = await window.supabaseClient
                .from('units')
                .upsert(unit);
            if (error) console.error('Erro ao salvar unidade:', error);
        } else {
            const units = DevStorage.get(CONFIG.STORAGE_KEYS.UNITS) || [];
            const index = units.findIndex(u => u.id === unit.id);
            if (index >= 0) {
                units[index] = unit;
            } else {
                units.push(unit);
            }
            DevStorage.set(CONFIG.STORAGE_KEYS.UNITS, units);
        }
    },

    // MEMBERS
    async getMembers() {
        const cached = Cache.get('members');
        if (cached) return cached;

        if (this.useSupabase()) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('members')
                    .select('*')
                    .eq('active', true)
                    .is('deleted_at', null)
                    .order('name');

                if (error) throw error;

                const members = (data || []).map(member => ({
                    id: member.id,
                    name: member.name,
                    unitId: member.unit_id,
                    photo_url: member.photo_url,
                    isCounselor: member.is_counselor,
                    isManualUnit: member.is_manual_unit,
                    role: member.role,
                    gender: member.gender,
                    birthDate: member.birth_date
                }));

                Cache.set('members', members);
                return members;
            } catch (error) {
                console.error('Erro ao buscar membros do Supabase:', error);
                Toast.show('Modo offline ativado', 'warning');
                SUPABASE_CONFIG.enabled = false;
                return this.getMembers();
            }
        } else {
            const members = DevStorage.get(CONFIG.STORAGE_KEYS.MEMBERS) || [];
            Cache.set('members', members);
            return members;
        }
    },

    async saveMember(member) {
        if (this.useSupabase()) {
            const dbMember = {
                id: member.id,
                name: member.name,
                unit_id: member.unitId,
                image: member.image,
                is_counselor: member.isCounselor || false,
                is_manual_unit: member.isManualUnit || false
            };

            try {
                const { error } = await window.supabaseClient.from('members').upsert(dbMember);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao salvar membro (Supabase), salvando na fila offline:', error);

                // Enqueue for offline sync
                SyncManager.enqueue('SAVE_MEMBER', dbMember);
            }
        }

        // Always save to DevStorage/Cache
        const members = DevStorage.get(CONFIG.STORAGE_KEYS.MEMBERS) || [];
        const index = members.findIndex(m => m.id === member.id);
        if (index >= 0) {
            members[index] = member;
        } else {
            members.push(member);
        }
        DevStorage.set(CONFIG.STORAGE_KEYS.MEMBERS, members);

        Cache.clear();
        return Promise.resolve();
    },

    async inactivateMember(memberId) {
        if (this.useSupabase()) {
            const { error } = await window.supabaseClient
                .from('members')
                .update({ active: false })
                .eq('id', memberId);
            if (error) throw error;
        } else {
            let members = DevStorage.get(CONFIG.STORAGE_KEYS.MEMBERS) || [];
            members = members.filter(m => m.id !== memberId);
            DevStorage.set(CONFIG.STORAGE_KEYS.MEMBERS, members);
        }
    },

    // Soft delete member (permanent removal with data preservation)
    async deleteMember(memberId) {
        if (this.useSupabase()) {
            try {
                const { error } = await window.supabaseClient
                    .from('members')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', memberId);
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao deletar membro (Supabase), salvando na fila offline:', error);
                SyncManager.enqueue('DELETE_MEMBER', { memberId });
            }
        }

        // Always update DevStorage/Cache (soft delete logic for local)
        // For offline/dev, we remove it to keep consistency with "deleted" status or mark as deleted if structure supports
        // Original logic removed it, keeping that.
        let members = DevStorage.get(CONFIG.STORAGE_KEYS.MEMBERS) || [];
        members = members.filter(m => m.id !== memberId);
        DevStorage.set(CONFIG.STORAGE_KEYS.MEMBERS, members);

        Cache.clear();
    },

    // Restore soft deleted member
    async restoreMember(memberId) {
        if (this.useSupabase()) {
            const { error } = await window.supabaseClient
                .from('members')
                .update({ deleted_at: null })
                .eq('id', memberId);
            if (error) throw error;
        }
        Cache.clear();
    },

    // Get deleted members (for admin recovery)
    async getDeletedMembers() {
        if (this.useSupabase()) {
            const { data, error } = await window.supabaseClient
                .from('members')
                .select('*')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

            if (error) throw error;
            return data || [];
        }
        return [];
    },

    async updateMemberUnit(memberId, unitId, isManual = false) {
        if (this.useSupabase()) {
            const updateData = { unit_id: unitId };
            if (isManual) {
                updateData.is_manual_unit = true;
            }
            const { error } = await window.supabaseClient
                .from('members')
                .update(updateData)
                .eq('id', memberId);
            if (error) throw error;
        } else {
            const members = DevStorage.get(CONFIG.STORAGE_KEYS.MEMBERS) || [];
            const member = members.find(m => m.id === memberId);
            if (member) {
                member.unitId = unitId;
                if (isManual) member.isManualUnit = true;
                DevStorage.set(CONFIG.STORAGE_KEYS.MEMBERS, members);
            }
        }
    },

    // USERS (for login dropdown)
    async getUsers() {
        const cached = Cache.get('app_users');
        if (cached) return cached;

        if (this.useSupabase()) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('app_users')
                    .select('*')
                    .order('name');

                if (error) throw error;
                Cache.set('app_users', data || []);
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar usuários do Supabase:', error);
                Toast.show('Modo offline ativado', 'warning');
                SUPABASE_CONFIG.enabled = false;
                return this.getUsers();
            }
        } else {
            const users = DevStorage.get(CONFIG.STORAGE_KEYS.USERS) || [];
            Cache.set('app_users', users);
            return users;
        }
    },

    // SCORES
    async getScores(filters = {}) {
        if (this.useSupabase()) {
            let query = window.supabaseClient
                .from('scores')
                .select('*')
                .is('deleted_at', null);

            // Apply filters if provided
            if (filters.startDate) {
                query = query.gte('date', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('date', filters.endDate);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Erro ao buscar pontuações:', error);
                return {};
            }

            const scoresByDate = {};
            data.forEach(score => {
                if (!scoresByDate[score.date]) {
                    scoresByDate[score.date] = {};
                }
                scoresByDate[score.date][score.member_id] = {
                    isAbsent: score.is_absent,
                    items: score.items,
                    createdBy: score.created_by,
                    createdById: score.created_by_id,
                    createdAt: score.created_at
                };
            });
            return scoresByDate;
        } else {
            // For DevStorage, we return everything (it's local and fast)
            // Or implementing manual filtering if needed, but not critical for offline
            return DevStorage.get(CONFIG.STORAGE_KEYS.SCORES) || {};
        }
    },

    async saveScore(memberId, dateKey, scoreData) {
        if (this.useSupabase()) {
            try {
                const { error } = await window.supabaseClient
                    .from('scores')
                    .upsert({
                        member_id: memberId,
                        date: dateKey,
                        is_absent: scoreData.isAbsent || false,
                        items: scoreData.items,
                        created_by: scoreData.createdBy,
                        created_by_id: scoreData.createdById,
                        created_at: scoreData.createdAt
                    }, {
                        onConflict: 'member_id,date'
                    });
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao salvar pontuação (Supabase), salvando na fila offline:', error);

                // Enqueue for offline sync
                const payload = {
                    memberId,
                    date: dateKey,
                    data: scoreData
                };

                // Dynamically import SyncManager to avoid circular dependency issues if any
                // But we are in module system, so static import at top is better.
                // Assuming SyncManager is imported at top.
                SyncManager.enqueue('SAVE_SCORE', payload);
            }
        }

        // Always save to DevStorage/Cache as fallback/optimistic UI
        const scores = DevStorage.get(CONFIG.STORAGE_KEYS.SCORES) || {};
        if (!scores[dateKey]) scores[dateKey] = {};
        scores[dateKey][memberId] = scoreData;
        DevStorage.set(CONFIG.STORAGE_KEYS.SCORES, scores);

        Cache.clear();
    },

    // COUNSELOR SCORES
    async getCounselorScores() {
        if (this.useSupabase()) {
            const { data, error } = await window.supabaseClient
                .from('counselor_scores')
                .select('*')
                .is('deleted_at', null);
            if (error) {
                console.error('Erro ao buscar avaliações:', error);
                return {};
            }

            const scoresByDate = {};
            data.forEach(score => {
                if (!scoresByDate[score.date]) {
                    scoresByDate[score.date] = {};
                }
                scoresByDate[score.date][score.counselor_id] = {
                    items: score.items,
                    createdBy: score.created_by,
                    createdById: score.created_by_id,
                    createdAt: score.created_at
                };
            });
            return scoresByDate;
        } else {
            return DevStorage.get(CONFIG.STORAGE_KEYS.COUNSELOR_SCORES) || {};
        }
    },

    async saveCounselorScore(counselorId, dateKey, scoreData) {
        if (this.useSupabase()) {
            try {
                const { error } = await window.supabaseClient
                    .from('counselor_scores')
                    .upsert({
                        counselor_id: counselorId,
                        date: dateKey,
                        items: scoreData.items,
                        created_by: scoreData.createdBy,
                        created_by_id: scoreData.createdById,
                        created_at: scoreData.createdAt
                    }, {
                        onConflict: 'counselor_id,date'
                    });
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao salvar avaliação de conselheiro (Supabase), salvando na fila offline:', error);

                // Enqueue for offline sync
                const payload = {
                    counselorId,
                    date: dateKey,
                    data: scoreData
                };
                SyncManager.enqueue('SAVE_COUNSELOR_SCORE', payload);
            }
        }

        // Always save to DevStorage
        const scores = DevStorage.get(CONFIG.STORAGE_KEYS.COUNSELOR_SCORES) || {};
        if (!scores[dateKey]) scores[dateKey] = {};
        scores[dateKey][counselorId] = scoreData;
        DevStorage.set(CONFIG.STORAGE_KEYS.COUNSELOR_SCORES, scores);
    },

    // MEETINGS
    async getMeetings() {
        const cached = Cache.get('meetings');
        if (cached) return cached;

        if (this.useSupabase()) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('meetings')
                    .select('*')
                    .is('deleted_at', null)
                    .order('date', { ascending: false });

                if (error) throw error;
                Cache.set('meetings', data || []);
                return data || [];
            } catch (error) {
                console.error('Erro ao buscar reuniões do Supabase:', error);
                return [];
            }
        } else {
            const meetings = DevStorage.get(CONFIG.STORAGE_KEYS.MEETINGS) || [];
            Cache.set('meetings', meetings);
            return meetings;
        }
    },

    async saveMeeting(meetingData) {
        if (this.useSupabase()) {
            try {
                const { error } = await window.supabaseClient
                    .from('meetings')
                    .upsert(meetingData, { onConflict: 'date' });
                if (error) throw error;
            } catch (error) {
                console.error('Erro ao salvar reunião (Supabase):', error);
                SyncManager.enqueue('SAVE_MEETING', meetingData);
            }
        }

        // Always save to DevStorage
        const meetings = DevStorage.get(CONFIG.STORAGE_KEYS.MEETINGS) || [];
        const index = meetings.findIndex(m => m.date === meetingData.date);
        if (index >= 0) {
            meetings[index] = meetingData;
        } else {
            meetings.push(meetingData);
        }
        DevStorage.set(CONFIG.STORAGE_KEYS.MEETINGS, meetings);
        Cache.remove('meetings');
    }
};
