import { CONFIG } from '../config/constants.js';
import { Store } from '../data/store.js';

export const Utils = {
    countTotal(scoreRecord) {
        if (!scoreRecord || scoreRecord.isAbsent) return 0;

        let total = CONFIG.SCORE_ITEMS.reduce((sum, item) => {
            return sum + (scoreRecord.items[item.id] ? item.points : 0);
        }, 0);

        // Add prayer event points
        const prayerLevel = scoreRecord.items && scoreRecord.items[CONFIG.PRAYER_EVENT.id];
        if (prayerLevel) {
            const level = CONFIG.PRAYER_EVENT.levels.find(l => l.id === prayerLevel);
            if (level) total += level.points;
        }

        return total;
    },

    getPercentage(total) {
        return Math.round((total / CONFIG.TOTAL_POINTS) * 100);
    },

    getTodayKey() {
        return new Date().toISOString().split('T')[0];
    },

    formatDate(dateStr) {
        try {
            return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
        } catch (e) {
            return dateStr;
        }
    },

    generateWhatsAppLink(text) {
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
    },

    getUnitForMember(member, units) {
        return units.find(u => u.id === member.unitId);
    },

    // --- Counselor Ranking Functions ---
    countCounselorTotal(scoreRecord) {
        if (!scoreRecord) return 0;

        return CONFIG.COUNSELOR_ITEMS.reduce((sum, item) => {
            return sum + (scoreRecord.items[item.id] ? item.points : 0);
        }, 0);
    },

    async calculateUnitEfficiency(unitId, dateKey) {
        const members = await Store.getMembersByUnit(unitId);
        if (members.length === 0) return 0;

        const totalPossible = members.length * CONFIG.TOTAL_POINTS;

        let totalObtained = 0;
        for (const member of members) {
            const score = await Store.getMemberScore(member.id, dateKey);
            totalObtained += this.countTotal(score);
        }

        return (totalObtained / totalPossible) * 100;
    },

    async calculateCounselorPersonalScore(counselorId, dateKey) {
        const evaluation = await Store.getCounselorScore(counselorId, dateKey);
        const totalObtained = this.countCounselorTotal(evaluation);

        return (totalObtained / CONFIG.TOTAL_COUNSELOR_POINTS) * 100;
    },

    async calculateCounselorFinalScore(counselorId, dateKey) {
        const members = await Store.getMembers();
        const member = members.find(m => m.id === counselorId);
        if (!member) return 0;

        const unitEfficiency = await this.calculateUnitEfficiency(member.unitId, dateKey);
        const personalScore = await this.calculateCounselorPersonalScore(counselorId, dateKey);

        // Fórmula: (Eficiência × 0.7) + (Pessoal × 0.3)
        return (unitEfficiency * 0.7) + (personalScore * 0.3);
    }
};
