// Service Worker for Barão de Mauá PWA
const CACHE_NAME = 'barao-maua-v1';
const RUNTIME_CACHE = 'barao-maua-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/config.js',
    '/styles.css',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        // For Supabase API calls, use network-first strategy
        if (url.hostname.includes('supabase')) {
            event.respondWith(networkFirst(request));
            return;
        }
        return;
    }

    // For navigation requests, use network-first
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }

    // For static assets, use cache-first
    event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        console.log('[SW] Serving from cache:', request.url);
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('[SW] Fetch failed:', error);
        throw error;
    }
}

// Network-first strategy
async function networkFirst(request) {
    const cache = await caches.open(RUNTIME_CACHE);

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[SW] Network failed, serving from cache:', request.url);
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
