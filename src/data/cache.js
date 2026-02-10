export const Cache = {
    data: {},
    timestamps: {},
    TTL: 5 * 60 * 1000, // 5 minutos

    set(key, value) {
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
