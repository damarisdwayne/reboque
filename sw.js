const CACHE = 'reboque-v3';

const ARQUIVOS = [
  './',
  'index.html',
  'css/app.css',
  'js/db.js',
  'js/novo.js',
  'js/cobrar.js',
  'js/compartilhar.js',
  'js/export.js',
  'js/ui.js',
  'manifest.webmanifest',
  'assets/icone.svg',
  'assets/icone-192.png',
  'assets/icone-512.png',
  'assets/icone-512-maskable.png',
  'assets/icone-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cacheado) => {
      const rede = fetch(e.request)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
          return res;
        })
        .catch(() => cacheado || caches.match('index.html'));
      return cacheado || rede;
    })
  );
});
