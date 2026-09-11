// Türkçe — Учебник и диалози: Service Worker
// Версията в името на кеша е единственото, което трябва да се вдига при ъпдейт.
const VERSION = 'v1';
const CACHE = 'turkce-shell-' + VERSION;
const RUNTIME = 'turkce-runtime-' + VERSION;

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== RUNTIME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// stale-while-revalidate: връща от кеша веднага (ако има), а в
// същото време тегли по мрежата и опреснява кеша за следващия път.
// Работи и за приложението (same-origin), и за снимките от Wikipedia
// (cross-origin) — веднъж заредена снимка остава достъпна и офлайн.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || network || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isWikiImage = /wikipedia\.org|wikimedia\.org/.test(url.hostname);

  if (isSameOrigin) {
    event.respondWith(staleWhileRevalidate(req, CACHE));
  } else if (isWikiImage) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
  }
  // всичко останало (напр. TTS, ако използва мрежа) минава направо през мрежата
});
