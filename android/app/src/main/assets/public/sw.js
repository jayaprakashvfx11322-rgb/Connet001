/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Service Worker for ConnectX Social Super-App.
 * Implements high-end caching strategy: cache-first for static assets/fonts/images
 * with network backup to ensure complete offline availability.
 */

const CACHE_NAME = 'connectx-static-v1';

// Assets to cache immediately on SW install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching core application shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Cleaning up older cache instance:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event with Stale-While-Revalidate caching pattern
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip APIs and non-GET requests (e.g. video streams, backend endpoints, chrome extensions)
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    // If it's an external media request (like Unsplash posts images), cache it dynamically!
    if (event.request.method === 'GET' && (requestUrl.host.includes('images.unsplash.com') || requestUrl.host.includes('images.pexels.com') || requestUrl.host.includes('googleapis.com') || requestUrl.host.includes('gstatic.com'))) {
      event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              // Fetch fresh copy in background
              fetch(event.request).then((networkResponse) => {
                if (networkResponse.status === 200) {
                  cache.put(event.request, networkResponse);
                }
              }).catch(() => {/* Ignore dynamic refresh failures offline */});
              return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            }).catch(() => {
              // Gracefully swallow offline failures for individual external media assets
              return new Response('', { status: 404, statusText: 'Offline representation unavailable' });
            });
          });
        })
      );
    }
    return;
  }

  // Local assets cache-first lookup with background updates (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[ServiceWorker] Offline fetch failed, falling back to static cache:', err);
          return cachedResponse; // fallback
        });

      return cachedResponse || fetchPromise;
    })
  );
});
