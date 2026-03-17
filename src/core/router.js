export const Navigation = {
    history: [],

    push(view, params = {}) {
        this.history.push({ view, params });
    },

    pop() {
        if (this.history.length > 1) {
            this.history.pop();
            return this.history[this.history.length - 1];
        }
        return { view: 'dashboard', params: {} };
    },

    canGoBack() {
        return this.history.length > 1;
    },

    clear() {
        this.history = [];
    }
};
