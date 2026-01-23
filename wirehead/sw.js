const CACHE_NAME = 'wirehead-v17';
const IS_DEV = ['localhost', '127.0.0.1', '0.0.0.0'].includes(self.location.hostname);
// Use relative paths (no leading slash) so they work on GitHub Pages subpaths
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './banner/wirehead-art-01.webp',
  './banner/wirehead-art-01.png',
  './posts.json',
  './sitemap.xml',
  './robots.txt',
  './lib/marked.min.js',
  './lib/WaterBrush-Regular.ttf',
  './lib/material-icons.woff2',
  './lib/roboto-regular.woff2',
  './lib/roboto-300.woff2',
  './lib/roboto-500.woff2',
  './lib/roboto-700.woff2',
  './lib/roboto-condensed-regular.woff2',
  './icon-192.png',
  './icon.svg'
];

self.addEventListener('install', event => {
  if (IS_DEV) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch(err => console.error('Cache install failed:', err))
  );
});

self.addEventListener('fetch', event => {
  if (IS_DEV) {
    // Bypass cache entirely in development
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for posts.json to get fresh content list
  if (event.request.url.endsWith('/posts.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(err => {
        console.error('Fetch failed:', err);
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

self.addEventListener('activate', event => {
  if (IS_DEV) {
    event.waitUntil(self.clients.claim());
    return;
  }
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      ))
      .then(() => self.clients.claim())
  );
});
