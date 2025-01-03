const CACHE_NAME = 'aravinth-site-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/manifest.json',
    '/favicon.png',
    '/w/lc/clock.html',
    '/w/c/calc.html',
    '/w/sp/planner.html',
    '/w/ytn/news.html',
    '/w/cdt/count-down.html',
    '/w/rtp/index.html',
    '/w/mg/index.html',
    '/w/ssa/analysis.html'
];

// Install event - cache basic assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
    // Don't cache third-party requests
    if (!event.request.url.includes('332321.xyz')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Clone the request because it can only be used once
                const fetchRequest = event.request.clone();

                // Make network request and cache the response
                return fetch(fetchRequest).then(response => {
                    // Check if response is valid
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it can only be used once
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// Handle offline functionality
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        // If both network and cache fail, show offline page
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});
