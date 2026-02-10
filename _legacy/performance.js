/**
 * Performance Optimizer
 * Utilities for improving app performance
 */

const Performance = {
    /**
     * Preload critical resources
     */
    preloadResources() {
        const resources = [
            { href: '/app.js', as: 'script' },
            { href: '/styles.css', as: 'style' },
            { href: '/fotos/barao-logo.png', as: 'image' }
        ];

        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            document.head.appendChild(link);
        });

        Logger.info('Critical resources preloaded', { count: resources.length });
    },

    /**
     * Lazy load images with Intersection Observer
     */
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');

        if (!images.length) return;

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);

                    Logger.debug('Image lazy loaded', { src: img.src });
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before entering viewport
        });

        images.forEach(img => imageObserver.observe(img));

        Logger.info('Lazy loading initialized', { images: images.length });
    },

    /**
     * Debounce function for performance
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} - Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function for performance
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} - Throttled function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Request Idle Callback wrapper
     * @param {Function} callback - Function to execute when idle
     */
    whenIdle(callback) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback);
        } else {
            setTimeout(callback, 1);
        }
    },

    /**
     * Measure performance of a function
     * @param {string} label - Label for measurement
     * @param {Function} func - Function to measure
     * @returns {Promise} - Result of function
     */
    async measure(label, func) {
        const start = performance.now();

        try {
            const result = await func();
            const duration = performance.now() - start;
            Logger.perf(label, duration.toFixed(2));
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            Logger.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
            throw error;
        }
    },

    /**
     * Get performance metrics
     * @returns {Object} - Performance metrics
     */
    getMetrics() {
        if (!performance.timing) return null;

        const timing = performance.timing;
        const metrics = {
            // Page load time
            pageLoad: timing.loadEventEnd - timing.navigationStart,

            // DOM ready time
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,

            // Time to first byte
            ttfb: timing.responseStart - timing.navigationStart,

            // DNS lookup time
            dns: timing.domainLookupEnd - timing.domainLookupStart,

            // TCP connection time
            tcp: timing.connectEnd - timing.connectStart,

            // Request time
            request: timing.responseEnd - timing.requestStart,

            // DOM processing time
            domProcessing: timing.domComplete - timing.domLoading
        };

        return metrics;
    },

    /**
     * Log performance metrics
     */
    logMetrics() {
        this.whenIdle(() => {
            const metrics = this.getMetrics();
            if (metrics) {
                Logger.info('Performance Metrics', metrics);
            }
        });
    },

    /**
     * Optimize images by converting to WebP (client-side check)
     * @returns {boolean} - Whether WebP is supported
     */
    supportsWebP() {
        const canvas = document.createElement('canvas');
        if (canvas.getContext && canvas.getContext('2d')) {
            return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        }
        return false;
    },

    /**
     * Prefetch next page resources
     * @param {string} url - URL to prefetch
     */
    prefetch(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);

        Logger.debug('Prefetching resource', { url });
    }
};
