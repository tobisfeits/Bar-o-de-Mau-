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

    async getScores() {
        return await DataAdapter.getScores();
    },

    async getMemberScore(memberId, dateKey) {
        const scores = await this.getScores();
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
