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

        // Add Impacto event items (presenca, uniforme)
        if (CONFIG.IMPACTO_EVENT && CONFIG.IMPACTO_EVENT.items) {
            CONFIG.IMPACTO_EVENT.items.forEach(item => {
                if (scoreRecord.items[item.id] === true) total += item.points;
            });
        }

        // Add Holy Week event items (presenca = 20pts)
        if (CONFIG.HOLY_WEEK_EVENT && CONFIG.HOLY_WEEK_EVENT.items) {
            CONFIG.HOLY_WEEK_EVENT.items.forEach(item => {
                if (scoreRecord.items[item.id] === true) total += item.points;
            });
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
    },

    // ── Range-based ranking functions ────────────────────────────────────────
    // Generates array of date strings between start and end (inclusive)
    _dateRange(start, end) {
        const dates = [];
        for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    },

    // Helper: determine max points possible for a given date
    _maxPointsForDate(dateKey) {
        // Holy Week: only presenca (20pts)
        if (CONFIG.HOLY_WEEK_EVENT && dateKey >= CONFIG.HOLY_WEEK_EVENT.startDate && dateKey <= CONFIG.HOLY_WEEK_EVENT.endDate) {
            return CONFIG.HOLY_WEEK_EVENT.maxPoints; // 20
        }
        // Impacto: presenca + uniforme (40pts)
        if (CONFIG.IMPACTO_EVENT && dateKey === CONFIG.IMPACTO_EVENT.date) {
            return CONFIG.IMPACTO_EVENT.maxPoints; // 40
        }
        // Regular meeting
        return CONFIG.TOTAL_POINTS; // 184
    },

    async calculateUnitEfficiencyRange(unitId, start, end) {
        const members = await Store.getMembersByUnit(unitId);
        if (members.length === 0) return 0;

        const dates = this._dateRange(start, end);
        const allScores = await Store.getScores();

        let totalObtained = 0, totalPossible = 0;

        for (const dateKey of dates) {
            const dayScores = allScores[dateKey] || {};
            // Only count days where at least one member was scored (avoids empty days)
            const hasSomeScore = members.some(m => dayScores[m.id] !== undefined);
            if (!hasSomeScore) continue;

            const maxPts = this._maxPointsForDate(dateKey);

            for (const member of members) {
                const score = dayScores[member.id];
                totalObtained += this.countTotal(score);
                totalPossible += maxPts;
            }
        }

        return totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
    },

    async calculateCounselorPersonalScoreRange(counselorId, start, end) {
        const allCounselorScores = await Store.getCounselorScores();
        const dates = this._dateRange(start, end);

        let totalObtained = 0, daysLogged = 0;

        for (const dateKey of dates) {
            const dayScores = allCounselorScores[dateKey] || {};
            if (!dayScores[counselorId]) continue;
            totalObtained += this.countCounselorTotal(dayScores[counselorId]);
            daysLogged++;
        }

        if (daysLogged === 0) return 0;
        return (totalObtained / (daysLogged * CONFIG.TOTAL_COUNSELOR_POINTS)) * 100;
    },

    async calculateCounselorFinalScoreRange(counselorId, unitId, start, end) {
        const unitEfficiency = await this.calculateUnitEfficiencyRange(unitId, start, end);
        const personalScore = await this.calculateCounselorPersonalScoreRange(counselorId, start, end);
        return (unitEfficiency * 0.7) + (personalScore * 0.3);
    }
};
