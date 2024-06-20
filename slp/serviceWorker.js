// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const appVersion = "v1.6";
const PRECACHE = "slp-precache-" + appVersion;
const LAZYLOAD = 'slp-lazyload-' + appVersion;
const RUNTIME = 'slp-runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [

    // manifest
    "./browserconfig.xml",
    "./manifest.json",

    // core app
    "./",
    "./index.html",
    "./js/app.js",
    "./js/console.js",
    "./js/dataManager.js",
    "./js/handlebarsHelpers.js",
    "./js/scriptsManager.js",
    "./js/templateManager.js",
    "./js/toolbar.js",

    // commands
    "./js/commands/agent.js",
    "./js/commands/autoview.js",
    "./js/commands/clear.js",
    "./js/commands/command.js",
    "./js/commands/connect.js",
    "./js/commands/continue.js",
    "./js/commands/default.js",
    "./js/commands/disconnect.js",
    "./js/commands/factory.js",
    "./js/commands/hide.js",
    "./js/commands/kill.js",
    "./js/commands/list.js",
    "./js/commands/load.js",
    "./js/commands/padding.js",
    "./js/commands/property.js",
    "./js/commands/reset.js",
    "./js/commands/run.js",
    "./js/commands/save.js",
    "./js/commands/show.js",
    "./js/commands/text.js",
    "./js/commands/toggle.js",
    "./js/commands/verbose.js",
    "./js/commands/zoom.js",

    // connectors
    "./js/connectors/connector.js",
    "./js/connectors/manager.js",
    "./js/connectors/socket.js",

    // menu
    "./js/menu/menu.js",

    // nodes
    "./js/nodes/dalle.js",
    "./js/nodes/dalle2.js",
    "./js/nodes/dalle3.js",
    "./js/nodes/google.js",
    "./js/nodes/node.js",
    "./js/nodes/openAi.js",
    "./js/nodes/openAiChat.js",
    "./js/nodes/text.js",

    // values
    "./js/values/editor.js",
    "./js/values/empty.js",
    "./js/values/error.js",
    "./js/values/image.js",
    "./js/values/text.js",
    "./js/values/value.js",
    "./js/values/viewer.js",

    // third party libs
    "./js/libs/handlebars.min.js",

    // ui templates
    "./templates/app.hbs",
    "./templates/menu.hbs",
    "./templates/node.hbs",
    "./templates/nodeDalle.hbs",
    "./templates/nodeDalle2.hbs",
    "./templates/nodeDalle3.hbs",
    "./templates/nodeGoogle.hbs",
    "./templates/nodeOpenAi.hbs",
    "./templates/nodeOpenAiChat.hbs",
    "./templates/nodeText.hbs",
    "./templates/toolbar.hbs",
    "./templates/valueEditor.hbs",
    "./templates/valueEditText.hbs",
    "./templates/valueViewEmpty.hbs",
    "./templates/valueViewer.hbs",
    "./templates/valueViewError.hbs",
    "./templates/valueViewImage.hbs",
    "./templates/valueViewText.hbs",

    // styles
    "./css/app.css",
    "./css/common.css",
    "./css/connector.css",
    "./css/console.css",
    "./css/menu.css",
    "./css/node.css",
    "./css/system.css",
    "./css/toolbar.css",
    "./css/ui.css",
    "./css/value.css",

    // gfx
    "./img/slp-transparent.svg"
];

const LAZYLOAD_URLS = [

    // icons
  "./img/icons/icon-128x128.png",
  "./img/icons/icon-144x144.png",
  "./img/icons/icon-152x152.png",
  "./img/icons/icon-192x192.png",
  "./img/icons/icon-384x384.png",
  "./img/icons/icon-512x512.png",
  "./img/icons/icon-72x72.png",
  "./img/icons/icon-96x96.png"
];

async function addAllBypassCache(cacheName, urls) {
  const cache = await caches.open(cacheName);
  const requests = urls.map((url) => new Request(url, {
    cache: 'reload',
  }));
  await cache.addAll(requests);
}

// The install handler takes care of precaching the resources we always need.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => {
        //cache.addAll(PRECACHE_URLS);
        const requests = PRECACHE_URLS.map((url) => new Request(url, {
          cache: 'reload',
        }));
        cache.addAll(requests);
      })
      .then(() => { return caches.open(LAZYLOAD).then(cache => {       
        //cache.addAll(LAZYLOAD_URLS);
        const requests = LAZYLOAD_URLS.map((url) => new Request(url, {
          cache: 'reload',
        }));
        cache.addAll(requests);
      }); })
      .then(self.skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", event => {
  const currentCaches = [PRECACHE, LAZYLOAD, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

var regexDoNotCache = new RegExp("(/api/)|(/socket.io/)");

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener("fetch", event => {

  if (event.request.method !== 'GET') {

    return;
  }

  if (event.request.url.match(regexDoNotCache)) {

    return;
  }

  // Skip cross-origin requests, like those for Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {

          console.log(`Service Worker returning ${event.request.url} from a cache.`);
          return cachedResponse;
        }

        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {

            console.log(`Service Worker fetched ${event.request.url} and caching in the runtime cache.`);
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  }
});