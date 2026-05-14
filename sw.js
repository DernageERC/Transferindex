const CACHE_NAME = 'norm-app-v3-command-center-app';
const ASSETS = [
  '/',
  '/index.html',
  '/app.html',
  '/app.css',
  '/app.js',
  '/community.html',
  '/community.css',
  '/community.js',
  '/control-center.html',
  '/control-center.css',
  '/control-center.js',
  '/styles.css',
  '/manifest.webmanifest',
  '/assets/norm-penrose.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/app.html')))
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Norm', body: 'You have a new community update.' };
  event.waitUntil(self.registration.showNotification(data.title || 'Norm', {
    body: data.body || 'You have a new community update.',
    icon: '/assets/norm-penrose.svg',
    badge: '/assets/norm-penrose.svg'
  }));
});
