// Service worker for offline play. Generated into dist/sw.js at build time by
// the plugin in vite.config.ts, which fills in the file list and version.
//
// - Install: download and cache the whole game (~16 MB) in the background,
//   except the 2x art in assets/hd/ (only high-DPI screens load it).
// - The page itself: network first, so a new upload shows up when online,
//   falling back to the cached copy offline.
// - Everything else: cache first, falling back to the network. HD art is added
//   to the cache as it's fetched, so levels played once also look sharp offline.
// - A new version takes over once every tab of the old one is closed, then
//   deletes the old cache. (No skipWaiting: swapping files under a running
//   game could break levels it hasn't loaded yet.)

const VERSION = '__VERSION__';
const CACHE = `mof-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((path) => new Request(path, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mof-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./', copy));
          return response;
        })
        .catch(() => caches.match('./', { cacheName: CACHE }).then((hit) => hit || caches.match('index.html'))),
    );
    return;
  }

  const isHd = new URL(request.url).pathname.includes('/assets/hd/');
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (isHd && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
