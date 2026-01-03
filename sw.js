const CACHE_NAME = 'notizen_offline-v10';
const ASSETS = [
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nur für Anfragen auf der eigenen Seite (keine externen APIs außer Tailwind)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Wenn wir offline sind oder ein Refresh stattfindet: Sofort Cache liefern
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Im Offline-Fall: Fehler unterdrücken, wir haben ja den Cache
      });

      return cachedResponse || fetchPromise;
    })
  );
});
