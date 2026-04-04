// Service Worker - Cache de imágenes remotas
const CACHE_NAME = 'toolbox-images-v1';

// Orígenes de imágenes que queremos cachear
const IMAGE_ORIGINS = [
  'ramiroev7.github.io',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo interceptar peticiones de imagen de los orígenes configurados
  const isTargetOrigin = IMAGE_ORIGINS.some((origin) => url.hostname === origin);
  const isImage =
    event.request.destination === 'image' ||
    /\.(png|jpe?g|gif|webp|svg|ico)(\?.*)?$/i.test(url.pathname);

  if (!isTargetOrigin || !isImage) return;

  // Estrategia Cache-First: sirve desde cache si existe, sino fetch y guarda
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        if (cached) return cached;

        return fetch(event.request).then((response) => {
          // Solo cachear respuestas válidas
          if (response && response.status === 200 && response.type !== 'error') {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    )
  );
});
