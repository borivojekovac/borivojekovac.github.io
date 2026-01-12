const CACHE_NAME = 'wirehead-v9';
const IS_DEV = ['localhost', '127.0.0.1', '0.0.0.0'].includes(self.location.hostname);
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/banner/wirehead-art-01.webp',
  '/banner/wirehead-art-01.png',
  '/posts.json',
  '/sitemap.xml',
  '/robots.txt',
  '/lib/marked.min.js',
  '/lib/inspiration-regular.ttf',
  '/lib/material-icons.woff2',
  '/lib/roboto-regular.woff2',
  '/lib/roboto-300.woff2',
  '/lib/roboto-500.woff2',
  '/lib/roboto-700.woff2',
  '/lib/roboto-condensed-regular.woff2'
];

self.addEventListener('install', event => {
  if (IS_DEV) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  if (IS_DEV) {
    // Bypass cache entirely in development
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  if (IS_DEV) {
    event.waitUntil(self.clients.claim());
    return;
  }
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
      })
    ))
  );
});
