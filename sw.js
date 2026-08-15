const CACHE_NAME = 'site-cache-v2.4'; // Increment version

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
  '/w/qr-generator/generator.html',
  '/w/qr-generator/qr-styles.css',
  '/w/qr-generator/qr-script.js',
  '/w/qr-generator/2025_03_18_qrcode.mini.js',
  'https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs/qrcode.min.js',

  // Calendar (Today's Date)
  '/w/today-date/index.html',
  '/w/today-date/css/style.css',
  '/w/today-date/js/calendars.js',
  '/w/today-date/js/astronomy.js'
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
                            
                            // Try to return the local fallback file instead of the CDN resource
                            return caches.match('/w/qr-generator/2025_03_18_qrcode.mini.js')
                                .then(fallbackResponse => {
                                    if (fallbackResponse) {
                                        return fallbackResponse;
                                    }
                                    
                                    // If we don't have the fallback cached either, create a simple error response
                                    return new Response(
                                        'console.error("Failed to load QR code library");', 
                                        { 
                                            status: 200, 
                                            headers: {'Content-Type': 'application/javascript'} 
                                        }
                                    );
                                });
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
