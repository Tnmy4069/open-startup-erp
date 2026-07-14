// Kill-switch Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Do nothing, just pass through to network
  event.respondWith(fetch(event.request));
});

// Also try to unregister ourselves as soon as we can
self.registration.unregister().then(() => {
  console.log('[SW] Kill-switch activated: Service Worker unregistered and caches deleted.');
});

