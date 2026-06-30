const CACHE_PREFIX = 'pyra-wallet-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v11`;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './pyra-wallet-config.json',
  './pyra-wallet-icon.jpg',
  './offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (APP_SHELL.some(entry => url.pathname.endsWith(entry.replace('./', '/')))) {
    event.respondWith(cacheFirstWithRefresh(request, event));
  }
});

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return (
      await caches.match(request, { ignoreSearch: true }) ||
      await caches.match('./index.html') ||
      await caches.match('./offline.html') ||
      Response.error()
    );
  }
}

async function cacheFirstWithRefresh(request, event) {
  const cached = await caches.match(request, { ignoreSearch: true });
  const refresh = fetch(request)
    .then(async response => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }

  return (await refresh) || Response.error();
}
