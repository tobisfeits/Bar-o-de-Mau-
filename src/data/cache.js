export const Cache = {
    data: {},
    timestamps: {},
    TTL: 5 * 60 * 1000, // 5 minutos
    MAX_ENTRIES: 50,

    set(key, value) {
        // Evict oldest entry if at capacity
        const keys = Object.keys(this.data);
        if (keys.length >= this.MAX_ENTRIES && !(key in this.data)) {
            let oldestKey = keys[0];
            let oldestTime = this.timestamps[keys[0]] || 0;
            for (const k of keys) {
                if ((this.timestamps[k] || 0) < oldestTime) {
                    oldestTime = this.timestamps[k];
                    oldestKey = k;
                }
            }
            delete this.data[oldestKey];
            delete this.timestamps[oldestKey];
        }
        this.data[key] = value;
        this.timestamps[key] = Date.now();
    },

    get(key) {
        const timestamp = this.timestamps[key];
        if (!timestamp) return null;

        const age = Date.now() - timestamp;
        if (age > this.TTL) {
            delete this.data[key];
            delete this.timestamps[key];
            return null;
        }

        return this.data[key];
    },

    clear() {
        this.data = {};
        this.timestamps = {};
    },

    invalidate(key) {
        delete this.data[key];
        delete this.timestamps[key];
    }
};
