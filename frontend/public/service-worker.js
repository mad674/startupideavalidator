/* eslint-disable no-restricted-globals */

// ⚙️ CACHE SETTINGS
const CACHE_NAME = "startup-idea-validator-cache-v1";
const urlsToCache = [
  "/", // main page
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png"
];

// 🧱 INSTALL: Cache core app shell files
self.addEventListener("install", event => {
  console.log("[ServiceWorker] Install");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[ServiceWorker] Caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 🚀 ACTIVATE: Cleanup old caches
self.addEventListener("activate", event => {
  console.log("[ServiceWorker] Activate");
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 🌐 FETCH: Serve cached content when offline
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Serve from cache first
      if (response) {
        return response;
      }

      // Otherwise fetch from network and cache it
      return fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Clone and store in cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});

// 🧹 Optional: Enable manual cache refresh
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
