// CyberX Service Worker — Production-grade PWA caching strategy
// Strategy:
//   Static assets  → Cache-First
//   Navigation     → Network-First with offline fallback
//   Google Fonts   → Stale-While-Revalidate
//   API mutations  → Never cached (pass-through only)
//   GET /api/      → Network-First (no cache)

const CACHE_VERSION = 'cyberx-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const OFFLINE_URL = '/offline';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-icon-180.png',
  '/cyberx-logo.png',
  '/cyberx-logo.webp',
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(
        PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, FONT_CACHE, PAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── Skip non-GET requests entirely (POST, PUT, PATCH, DELETE)
  if (request.method !== 'GET') return;

  // ── Skip auth cookies, sensitive headers, chrome-extension URLs
  if (
    url.protocol === 'chrome-extension:' ||
    url.hostname === 'localhost' && url.port !== location.port
  ) return;

  // ── Never cache API routes — always network, never store
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // ── Google Fonts — Stale-While-Revalidate
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // ── Next.js static chunks (_next/static) — Cache-First (immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Static public assets (icons, images, manifest) — Cache-First
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|otf|webmanifest)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Navigation requests (HTML pages) — Network-First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // ── Everything else — Network with cache fallback
  event.respondWith(networkWithCacheFallback(request, STATIC_CACHE));
});

// ─── Strategy: Cache-First ───────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Network error', { status: 408 });
  }
}

// ─── Strategy: Stale-While-Revalidate ────────────────────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || networkPromise;
}

// ─── Strategy: Network-First with Offline Fallback ───────────────────────────
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Serve offline page from precache
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;

    return new Response('<h1>You are offline</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ─── Strategy: Network with Cache Fallback ───────────────────────────────────
async function networkWithCacheFallback(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Network error', { status: 408 });
  }
}

// ─── Message: Skip Waiting (for update flow) ─────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
