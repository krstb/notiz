const CACHE_NAME = 'notizen_offline-v6';
const ASSETS = [
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'icon-192.png',
  'icon-512.png'
];

// Installation: Fehler bei einzelnen Dateien ignorieren
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Wir laden jede Datei einzeln, damit ein fehlendes Icon nicht alles stoppt
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
  // Zwingt den Service Worker, sofort die Kontrolle zu übernehmen
  return self.clients.claim();
});

// Strategie: Cache-First mit Netzwerk-Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 1. Wenn im Speicher (Cache), sofort liefern
      if (response) return response;

      // 2. Wenn nicht im Speicher, Netzwerk versuchen
      return fetch(event.request).catch(() => {
        // 3. Wenn Flugmodus UND nicht im Speicher: Leere Antwort statt Absturz
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
        return new Response('');
      });
    })
  );
});
