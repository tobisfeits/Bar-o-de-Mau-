// Service Worker for Barão de Mauá PWA - IMPROVED VERSION
// Auto-update with network-first strategy for critical files

const CACHE_VERSION = '2026.05.03.084'; // v84 - Fix counselor score denominator to 110
const CACHE_NAME = `desbravadores-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `desbravadores-runtime-v${CACHE_VERSION}`;

// All JS app modules + critical files -- always fetch from network, cache only as offline fallback
const NETWORK_FIRST_FILES = [
    '/src/modules/app.js',
    '/src/ui/photo-manager.js',
    '/src/config/env.js',
    '/version.json',
    '/index.html', // Guarantee that index.html is always fresh
    '/src/',       // all modules in /src/**
];

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dist/output.css',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/src/core/error-boundary.js',
    '/src/core/logger.js',
    '/src/utils/sanitizer.js',
    '/src/ui/haptic.js',
    '/src/core/performance.js'
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
    return NETWORK_FIRST_FILES.some(pattern => url.includes(pattern));
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

// Stale-While-Revalidate Strategy (for Assets/HTML)
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    // Background fetch to update cache
    const fetchPromise = fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(error => {
        console.warn('[SW] Offline/Fetch fail during revalidation:', error);
    });

    // Return cached immediately if available, otherwise wait for network
    return cachedResponse || fetchPromise;
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

    // Use network-first for critical JSON APIs/version strings
    if (url.includes('version.json') || url.includes('api/')) {
        console.log('[SW] 🌐 Network-first (Critical):', url);
        event.respondWith(networkFirst(request));
        return;
    }

    if (shouldUseNetworkFirst(url)) {
        console.log('[SW] 🌐 Network-first (Modules):', url);
        event.respondWith(networkFirst(request));
        return;
    }

    // Use Stale-While-Revalidate for everything else (HTML, CSS, Assets)
    event.respondWith(staleWhileRevalidate(request));
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
