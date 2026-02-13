import { CONFIG } from '../config/constants.js';
import { DataAdapter } from './repository.js';
import { Cache } from './cache.js';
import { DevStorage } from './dev-storage.js';

export const Store = {
    get(key) {
        try {
            return DevStorage.get(key) || [];
        } catch (e) {
            return [];
        }
    },

    set(key, value) {
        DevStorage.set(key, value);
    },

    async init() {
        // Inicializar com dados padrão se vazio
        const units = await this.getUnits();
        if (units.length === 0) {
            this.seedDefaultData();
        }
    },

    seedDefaultData() {
        // Criar unidades (apenas referência, idealmente isso viria do banco)
        // ... (Dados default omitidos para brevidade, mantendo lógica original se necessário, 
        // mas em produção com Supabase isso raramente é usado)
        // Manteremos vazio por enquanto ou migraremos se necessário.
        // O original tinha uma lista hardcoded enorme.
    },

    async getUnits() {
        return await DataAdapter.getUnits();
    },

    async getMembers() {
        return await DataAdapter.getMembers();
    },

    async getUsers() {
        return await DataAdapter.getUsers();
    },

    async getMembersByUnit(unitId) {
        const members = await this.getMembers();
        return members.filter(m => m.unitId === unitId);
    },

    // Local Cache for Scores to allow partial updates
    scoresCache: {},

    async getScores() {
        // Return local cache if populated, otherwise fetch default range (current month)
        if (Object.keys(this.scoresCache).length === 0) {
            await this.fetchCurrentMonthScores();
        }
        return this.scoresCache;
    },

    async fetchCurrentMonthScores() {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        await this.fetchScoresRange(firstDay, lastDay);
    },

    async fetchScoresRange(startDate, endDate) {
        const newScores = await DataAdapter.getScores({ startDate, endDate });

        // Merge with cache
        Object.keys(newScores).forEach(date => {
            this.scoresCache[date] = newScores[date];
        });

        return this.scoresCache;
    },

    async getMemberScore(memberId, dateKey) {
        // Ensure we have data for this date
        if (!this.scoresCache[dateKey]) {
            await this.fetchScoresRange(dateKey, dateKey);
        }

        const scores = this.scoresCache;
        if (!scores[dateKey]) return this.getDefaultScore();
        return scores[dateKey][memberId] || this.getDefaultScore();
    },

    getDefaultScore() {
        return {
            isAbsent: false,
            items: CONFIG.SCORE_ITEMS.reduce((acc, item) => {
                acc[item.id] = false;
                return acc;
            }, {})
        };
    },

    async saveScore(memberId, dateKey, scoreData) {
        // Adicionar informações de auditoria
        const currentUser = this.getCurrentUser();
        const timestamp = new Date().toISOString();

        const fullScoreData = {
            ...scoreData,
            createdBy: currentUser ? currentUser.name : 'Desconhecido',
            createdById: currentUser ? currentUser.id : null,
            createdAt: timestamp
        };

        await DataAdapter.saveScore(memberId, dateKey, fullScoreData);

        // Update local cache immediately
        if (!this.scoresCache[dateKey]) {
            this.scoresCache[dateKey] = {};
        }
        this.scoresCache[dateKey][memberId] = {
            isAbsent: scoreData.isAbsent,
            items: scoreData.items,
            createdBy: fullScoreData.createdBy,
            createdById: fullScoreData.createdById,
            createdAt: fullScoreData.createdAt
        };
    },

    getCurrentUser() {
        return DevStorage.get(CONFIG.STORAGE_KEYS.CURRENT_USER);
    },

    setCurrentUser(user) {
        DevStorage.set(CONFIG.STORAGE_KEYS.CURRENT_USER, user);
    },

    clearCurrentUser() {
        DevStorage.remove(CONFIG.STORAGE_KEYS.CURRENT_USER);
    },

    clearSession() {
        this.clearCurrentUser();
        Cache.clear();
    },

    // --- Counselor Scores ---
    async getCounselorScores() {
        return await DataAdapter.getCounselorScores();
    },

    async getCounselorScore(counselorId, dateKey) {
        const scores = await this.getCounselorScores();
        if (!scores[dateKey]) return this.getDefaultCounselorScore();
        return scores[dateKey][counselorId] || this.getDefaultCounselorScore();
    },

    getDefaultCounselorScore() {
        return {
            items: CONFIG.COUNSELOR_ITEMS.reduce((acc, item) => {
                acc[item.id] = false;
                return acc;
            }, {})
        };
    },

    async saveCounselorScore(counselorId, dateKey, scoreData) {
        const currentUser = this.getCurrentUser();
        const timestamp = new Date().toISOString();

        const fullScoreData = {
            ...scoreData,
            createdBy: currentUser ? currentUser.name : 'Desconhecido',
            createdById: currentUser ? currentUser.id : null,
            createdAt: timestamp
        };

        await DataAdapter.saveCounselorScore(counselorId, dateKey, fullScoreData);
    },

    async addUnit(name) {
        const units = await this.getUnits();
        const newUnit = {
            id: 'u' + Date.now(),
            name,
            logo: null
        };
        units.push(newUnit);
        await DataAdapter.saveUnit(newUnit);
        return newUnit;
    },

    async addMember(name, unitId) {
        const members = await this.getMembers();
        const newMember = {
            id: 'm' + Date.now(),
            name,
            unitId,
            image: null
        };
        members.push(newMember);
        await DataAdapter.saveMember(newMember);
        return newMember;
    },

    async inactivateMember(memberId) {
        try {
            await DataAdapter.inactivateMember(memberId);
            Cache.clear();
            return true;
        } catch (error) {
            console.error('Error inactivating member:', error);
            throw error;
        }
    },

    async updateMemberUnit(memberId, unitId, isManual = false) {
        try {
            await DataAdapter.updateMemberUnit(memberId, unitId, isManual);
            Cache.clear();
            return true;
        } catch (error) {
            console.error('Error updating member unit:', error);
            throw error;
        }
    }
};
