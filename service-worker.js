// ============================================
// ⚙️ Service Worker (PWA Offline Support)
// ============================================

const CACHE_NAME = 'harvestermate-v2.0.0';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/main.css',
  '/js/config/firebase-config.js',
  '/js/pages/splash.js',
  '/assets/icons/pwa/icon-192.png',
  '/assets/icons/pwa/icon-512.png'
];

// ===== INSTALL =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
  console.log('⚙️ SW installed');
});

// ===== ACTIVATE =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
  console.log('⚙️ SW activated');
});

// ===== FETCH =====
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Skip non-GET
  if (req.method !== 'GET') return;

  // Skip firebase requests (always network)
  if (req.url.includes('firebase') ||
      req.url.includes('googleapis.com') ||
      req.url.includes('gstatic.com')) {
    return;
  }

  // Skip chrome extensions
  if (req.url.startsWith('chrome-extension')) return;

  // Network first, cache fallback
  event.respondWith(
    fetch(req)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, clone).catch(() => {});
          });
        }
        return response;
      })
      .catch(async () => {
        // Fallback to cache
        const cached = await caches.match(req);
        if (cached) return cached;

        // Fallback to offline page for HTML
        if (req.headers.get('accept')?.includes('text/html')) {
          return caches.match(OFFLINE_URL);
        }

        return new Response('Offline', { status: 503 });
      })
  );
});

// ===== MESSAGE =====
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});