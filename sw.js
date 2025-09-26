const CACHE_NAME = 'vendamedice-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // No cacheamos las peticiones a Firebase Firestore para asegurar que los datos estén frescos.
  if (event.request.url.includes('firestore.googleapis.com')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en la caché, lo devolvemos
        if (response) {
          return response;
        }
        // Si no, lo pedimos a la red
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Borra las cachés antiguas que no estén en nuestra whitelist
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
