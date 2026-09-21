/* Kokoro Service Worker — offline-first (App Shell).
 * Daftarkan dari index.html bila dijalankan via http(s).
 * file:// tetap jalan tanpa SW (fallback aman).
 */
const CACHE_NAME = 'kokoro-v3-offline-006';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './vendor/tailwind.js',
  './vendor/jszip.min.js',
  './vendor/lucide.min.js',
  './vendor/fonts.css',
  './vendor/wanakana.min.js',
  './vendor/kuromoji.min.js',
  './vendor/deinflect.json',
  './vendor/pos-id.json',
  './dict-worker.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
  // Font woff2 (624 file) dikumpulkan otomatis saat pertama dimuat via fetch handler di bawah
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Hanya cache same-origin (app shell). CDN tetap ke network (dengan fallback cache bila pernah tersimpan).
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        const network = fetch(request).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
