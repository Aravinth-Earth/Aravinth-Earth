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
    '/w/ssa/analysis.html',
    '/w/ra/Life_On_Earth.html',
    '/offline.html'
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
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response; // Return cached version
                }
                
                return fetch(event.request)
                    .then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline page if it's a page request
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                        // Return null for other resources that aren't cached
                        return null;
                    });
            })
    );
});
