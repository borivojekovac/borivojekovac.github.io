// Generated from the complete production build; do not edit.
const CACHE = 'prism-b51a93761a7a1656';
const ASSETS = ["./apple-touch-icon.png","./assets/index-5BBxX6H1.js","./assets/index-BF2aj04i.css","./icon-192.png","./icon-512.png","./icon-maskable.png","./icon.svg","./index.html","./manifest.webmanifest"];
const URLS = new Set(ASSETS.map(path => new URL(path, self.location).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  // No skipWaiting: a new build never replaces a running game's worker.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('prism-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    // Keep HTML and hashed assets from one build together while an update waits.
    event.respondWith(caches.open(CACHE).then(cache => cache.match(new URL('./index.html', self.location).href)).then(hit => hit || fetch(event.request)));
  } else if (URLS.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request)).then(hit => hit || fetch(event.request)));
  }
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'PRISM_CACHE_STATUS' || !event.source) return;
  event.source.postMessage({type:'PRISM_CACHE_STATUS',cache:CACHE});
});
