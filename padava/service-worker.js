/**
 * @fileoverview Service Worker for Padava PWA.
 * Implements cache-first strategy for offline support.
 * @module service-worker
 */

const CACHE_NAME = 'padava-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.svg',
    '/icons/app-icon-32px.png',
    '/icons/app-icon-180px.png',
    '/icons/app-icon-192px.png',
    '/icons/app-icon-512px.png',
    '/src/app.js',
    '/src/css/variables.css',
    '/src/css/reset.css',
    '/src/css/layout.css',
    '/src/css/components.css',
    '/src/css/responsive.css',
    '/lib/material-icons/material-icons.css',
    '/lib/material-icons/MaterialSymbolsOutlined-Regular.ttf'
];

/**
 * @description Handles the install event.
 *              Pre-caches all static assets and calls skipWaiting().
 * @param {ExtendableEvent} event - The install event.
 * @returns {void}
 */
function handleInstall(event) {
    console.info('[ServiceWorker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function onCacheOpen(cache) {
                console.info('[ServiceWorker] Pre-caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(function onCacheComplete() {
                console.info('[ServiceWorker] Pre-caching complete');
                return self.skipWaiting();
            })
            .catch(function onCacheError(error) {
                console.error('[ServiceWorker] Pre-caching failed:', error);
            })
    );
}

/**
 * @description Handles the activate event.
 *              Claims all clients and cleans up old caches.
 * @param {ExtendableEvent} event - The activate event.
 * @returns {void}
 */
function handleActivate(event) {
    console.info('[ServiceWorker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(function onCacheKeys(cacheNames) {
                return Promise.all(
                    cacheNames
                        .filter(function filterOldCaches(cacheName) {
                            return cacheName !== CACHE_NAME;
                        })
                        .map(function deleteOldCache(cacheName) {
                            console.info('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(function onCleanupComplete() {
                console.info('[ServiceWorker] Claiming clients');
                return self.clients.claim();
            })
            .catch(function onActivateError(error) {
                console.error('[ServiceWorker] Activation failed:', error);
            })
    );
}

/**
 * @description Handles fetch events with cache-first strategy.
 *              Serves from cache if available, falls back to network.
 * @param {FetchEvent} event - The fetch event.
 * @returns {void}
 */
function handleFetch(event) {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(function onCacheMatch(cachedResponse) {
                if (cachedResponse) {
                    console.debug('[ServiceWorker] Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                console.debug('[ServiceWorker] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(function onFetchSuccess(networkResponse) {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(function onCacheOpenForStore(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(function onFetchError(error) {
                        console.error('[ServiceWorker] Fetch failed:', error);
                        throw error;
                    });
            })
    );
}

self.addEventListener('install', handleInstall);
self.addEventListener('activate', handleActivate);
self.addEventListener('fetch', handleFetch);
