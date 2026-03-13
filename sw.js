const CACHE_NAME = 'vpos-v11-final-v1';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/html5-qrcode',
  'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;800;900&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
