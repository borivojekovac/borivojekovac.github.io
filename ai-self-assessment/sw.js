const CACHE_PREFIX = 'ai-self-assessment-app-';
const BUILD_ID = 'e57d530dd7bc1184';
const PRECACHE_URLS = ["./assets/DavaSans-Bold-Cn2emffz.ttf","./assets/DavaSans-Medium-B5xyrn11.ttf","./assets/DavaSans-MediumBold-DA7CUDJi.ttf","./assets/DavaSans-Regular-BTcPz21n.ttf","./assets/endava-logo-transparent-BjkFltmC.png","./assets/flag-serbia-B4rEw9QT.svg","./assets/index-Crql0Ohv.css","./assets/index-pVJj9Ecu.js","./icons/app-icon-192.png","./icons/app-icon-512.png","./icons/app-icon-maskable-192.png","./icons/app-icon-maskable-512.png","./icons/app-icon-maskable.svg","./icons/app-icon.svg","./index.html","./locale-init.js","./manifest.en-GB.webmanifest","./manifest.webmanifest"];
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const SAVE_ACK_TIMEOUT_MS = 8000;

function precacheUrls() {
  return PRECACHE_URLS.map((path) => new URL(path, self.registration.scope).href);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(precacheUrls());
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE_UPDATE') {
    event.waitUntil((async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: false });
      const ready = await Promise.all(clients.map((client) => new Promise((resolve) => {
        const channel = new MessageChannel();
        const timeout = setTimeout(() => {
          channel.port1.close();
          resolve(false);
        }, SAVE_ACK_TIMEOUT_MS);
        channel.port1.onmessage = (message) => {
          clearTimeout(timeout);
          channel.port1.close();
          resolve(message.data?.saved === true);
        };
        client.postMessage({ type: 'PREPARE_UPDATE' }, [channel.port2]);
      })));
      if (!clients.length || ready.some((saved) => !saved)) {
        event.source?.postMessage({ type: 'UPDATE_BLOCKED' });
        return;
      }
      clients.forEach((client) => client.postMessage({ type: 'UPDATE_ACTIVATING' }));
      await self.skipWaiting();
    })());
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || url.search || !url.pathname.startsWith(scope.pathname)) return;

  const assets = new Set(precacheUrls());
  if (request.mode === 'navigate') {
    const shell = new URL('index.html', scope).href;
    if (!assets.has(shell)) return;
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => (
      (await cache.match(shell)) ?? fetch(request)
    )));
    return;
  }

  if (!assets.has(url.href)) return;
  event.respondWith(caches.open(CACHE_NAME).then(async (cache) => (
    (await cache.match(request)) ?? fetch(request)
  )));
});
