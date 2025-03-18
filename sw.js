const CACHE_NAME = 'site-cache-v2.3'; // Increment version

// Files to cache on install
const PRECACHE_URLS = [
  // Base site files
  '/',
  '/index.html',
  '/css/style.css',
  '/js/refresh-handler.js',
  '/favicon.png',
  '/manifest.json',
  
  // QR generator files
  '/w/qr/generator.html',
  '/w/qr/qr-styles.css',
  '/w/qr/qr-script.js',
  '/w/qr/2025_03_18_qrcode.mini.js', // Local fallback file
  'https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js' // CDN version
];

// Install event - precache key resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// Update fetch handler to prioritize CDN cache for QR library
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Special handling for QR code library from CDN
    if (url.href.includes('cdn.jsdelivr.net/gh/davidshimjs/qrcodejs')) {
        event.respondWith(
            // First try the cache
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse; // Return cached version if available
                    }
                    
                    // Otherwise try fetching from network
                    return fetch(event.request)
                        .then(response => {
                            // Cache the fetched response
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                            return response;
                        })
                        .catch(error => {
                            console.error('Fetch failed:', error);
                            // No specific fallback here as the HTML will handle the CDN failure
                        });
                })
        );
        return;
    }
    
    // Standard handling for other resources
    if (url.pathname.match(/\.(html|css|js|mp3)$/) && url.origin === location.origin) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return fetch(event.request).then(response => {
                    cache.put(event.request, response.clone());
                    return response;
                }).catch(() => {
                    return cache.match(event.request);
                });
            })
        );
    }
});

// Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
        ))
    );
});
