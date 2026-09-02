/* Adım · service worker — офлайн работа без билд стъпка */
const V = 'adim-v3';
const CORE = ['./', './index.html', './manifest.webmanifest',
              './content/a1.js',                    // първото ниво пътува с обвивката
              './icons/icon-192.png', './icons/icon-512.png'];
// Останалите content/*.js се кешират при първото отваряне на нивото.

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== V).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Навигация: мрежа първо, кеш при липса на връзка
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  // Останалото: кеш първо, после мрежа (шрифтовете се кешират в движение)
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone();
    if (res.ok) caches.open(V).then(c => c.put(req, copy));
    return res;
  }).catch(() => hit)));
});
