// Service Worker for Barão de Mauá PWA - IMPROVED VERSION
// Auto-update with network-first strategy for critical files

const CACHE_VERSION = '2026.02.26.003'; // A5 XSS + A6 cache limit + A12 lazy SheetJS
const CACHE_NAME = `barao-maua-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `barao-maua-runtime-v${CACHE_VERSION}`;

// Critical files that should ALWAYS be fetched from network first
const NETWORK_FIRST_FILES = [
    '/app.js',
    '/photo-manager.js',
    '/config.js',
    '/version.json',
    '/api/env'
];

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/error-boundary.js',
    '/logger.js',
    '/sanitizer.js',
    '/haptic.js',
    '/performance.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] 🚀 Installing service worker v' + CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] ⚡ Skipping waiting - activating immediately');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
    console.log('[SW] ✅ Activating service worker v' + CACHE_VERSION);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => {
                        console.log('[SW] 🗑️ Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW] 🎯 Taking control of all clients');
            return self.clients.claim();
        })
    );
});

// Helper: Check if URL should use network-first strategy
function shouldUseNetworkFirst(url) {
    return NETWORK_FIRST_FILES.some(file => url.includes(file));
}

// Helper: Check if request is for Supabase
function isSupabaseRequest(url) {
    return url.includes('supabase.co');
}

// Network-first strategy (for critical files)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        // Only cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] 📡 Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        console.log('[SW] 💾 Serving from cache:', request.url);
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] ❌ Failed to fetch:', request.url);
        throw error;
    }
}

// Fetch event - smart routing
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = request.url;

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Supabase requests (always go to network)
    if (isSupabaseRequest(url)) {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!url.startsWith('http')) {
        return;
    }

    // Use network-first for critical files
    if (shouldUseNetworkFirst(url)) {
        console.log('[SW] 🌐 Network-first:', url);
        event.respondWith(networkFirst(request));
        return;
    }

    // Use cache-first for everything else
    event.respondWith(cacheFirst(request));
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] 📨 Received SKIP_WAITING message');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] 🗑️ Clearing all caches');
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((name) => caches.delete(name))
                );
            })
        );
    }
});

console.log('[SW] 🎉 Service Worker v' + CACHE_VERSION + ' loaded');
