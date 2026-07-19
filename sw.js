/**
 * Minimal service worker — required by browsers to allow "Install app".
 * Uses a NETWORK-FIRST strategy: always tries to fetch the latest version
 * from the server first, and only falls back to the cached copy if the
 * network is unreachable (e.g. offline). This means updates you push to
 * index.html show up immediately on next load, instead of being stuck
 * behind a stale cache.
 *
 * IMPORTANT: bump CACHE_NAME (e.g. v2 -> v3) whenever you want to force
 * every installed copy to fully discard its old cache.
 */
const CACHE_NAME = 'student-feedback-shell-v2';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never cache API calls to the Apps Script backend — always go to network.
  if (url.hostname.includes('script.google.com')) return;
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return networkResponse;
    }).catch(() => caches.match(event.request))
  );
});
