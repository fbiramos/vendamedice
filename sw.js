const CACHE_NAME = 'vendamedice-cache-v2';
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

  // Estrategia: Network First para index.html
  if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clonar la respuesta porque un stream de respuesta solo puede ser consumido una vez
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request)) // Si la red falla, ir a la caché
    );
    return;
  }

  // Para otros recursos, estrategia: Cache First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
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
    }).then(() => {
      // Activa el nuevo service worker inmediatamente
      self.clients.claim();
    })
  );
  self.skipWaiting();
});
