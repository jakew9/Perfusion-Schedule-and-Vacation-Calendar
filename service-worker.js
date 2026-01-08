// Service Worker for U of U Perfusion Schedule Manager PWA
const CACHE_NAME = 'perfusion-schedule-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/js/auth/authManager.js',
  '/js/auth/authUI.js',
  '/js/api/sheetsapi.js',
  '/js/storage/localStorageManager.js',
  '/js/state/calendarState.js',
  '/js/calendar/calendarInit.js',
  '/js/components/navigation.js',
  '/js/components/modals.js',
  '/js/components/versionManager.js',
  '/js/components/accountPage.js',
  '/js/utils/dateUtils.js',
  '/js/config.js',
  'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.0/main.min.css',
  'https://cdn.jsdelivr.net/npm/fullcalendar@5.11.0/main.min.js'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
