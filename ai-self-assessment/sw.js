const CACHE_PREFIX = 'ai-self-assessment-app-';
const BUILD_ID = '79da0b2207f98559';
const PRECACHE_URLS = ["./assets/DavaSans-Bold-Cn2emffz.ttf","./assets/DavaSans-Medium-B5xyrn11.ttf","./assets/DavaSans-MediumBold-DA7CUDJi.ttf","./assets/DavaSans-Regular-BTcPz21n.ttf","./assets/endava-logo-transparent-BjkFltmC.png","./assets/flag-serbia-B4rEw9QT.svg","./assets/index-Crql0Ohv.css","./assets/index-DseDxWw3.js","./icons/app-icon-192.png","./icons/app-icon-512.png","./icons/app-icon-maskable-192.png","./icons/app-icon-maskable-512.png","./icons/app-icon-maskable.svg","./icons/app-icon.svg","./index.html","./locale-init.js","./manifest.en-GB.webmanifest","./manifest.sr-Cyrl.webmanifest","./manifest.webmanifest"];
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const CACHEABLE_NAVIGATION_PARAMS = new Set([
  'lang',
  '__appUpgradeAnswers',
  '__appUpgradeRevision',
  '__appUpgradeChanged',
]);
const CLIENT_REPLY_TIMEOUT_MS = 1500;

function precacheUrls() {
  return PRECACHE_URLS.map((path) => new URL(path, self.registration.scope).href);
}

function requestClientReply(client, type, timeoutMs) {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      channel.port1.close();
      resolve(value);
    };
    const timeout = setTimeout(() => finish(null), timeoutMs);
    channel.port1.onmessage = (event) => finish(event.data);
    try {
      client.postMessage({ type }, [channel.port2]);
    } catch {
      channel.port2.close();
      finish(null);
    }
  });
}

function isAppClient(client) {
  const url = new URL(client.url);
  const scope = new URL(self.registration.scope);
  return url.origin === scope.origin && url.pathname.startsWith(scope.pathname);
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
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));

    const clients = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .filter(isAppClient);
    const clientModes = await Promise.all(clients.map(async (client) => ({
      client,
      supportsAutomaticReload: (await requestClientReply(
        client,
        'CHECK_AUTO_RELOAD',
        300,
      ))?.supported === true,
    })));
    const legacyClients = clientModes.filter(({ supportsAutomaticReload }) => !supportsAutomaticReload);
    const legacySaves = await Promise.all(legacyClients.map(async ({ client }) => {
      await requestClientReply(client, 'PREPARE_UPDATE', CLIENT_REPLY_TIMEOUT_MS);
      return client;
    }));

    await self.clients.claim();
    legacySaves.forEach((client) => {
      try {
        client.navigate(client.url).catch(() => {
          client.postMessage({ type: 'UPDATE_ACTIVATING' });
        });
      } catch {
        client.postMessage({ type: 'UPDATE_ACTIVATING' });
      }
    });
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  const hasUnsupportedQuery = [...url.searchParams.keys()]
    .some((key) => !CACHEABLE_NAVIGATION_PARAMS.has(key));
  if (url.origin !== scope.origin || hasUnsupportedQuery || !url.pathname.startsWith(scope.pathname)) return;

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
