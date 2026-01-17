const CACHE_NAME = 'quiz-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './scripts/app.js',
  './scripts/encryption.js',
  './manifest.json'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch from cache first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});