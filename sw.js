// Cache names for different sections
const CACHE_NAMES = {
    main: 'aravinth-site-v1',
    mathGame: 'math-game-v1',
    lifeOnEarth: 'life-on-earth-v1',
    clock: 'local-clock-v1',
    calculator: 'calculator-v1',
    planner: 'simple-planner-v1',
    ytNews: 'yt-news-v1',
    countdown: 'countdown-v1',
    reverseTimePlanner: 'reverse-time-planner-v1',
    stockAnalysis: 'stock-analysis-v1',
    passwordGenerator: 'password-generator-v1'
};

// Function to determine cache name based on URL
function getCacheName(url) {
    if (url.includes('/w/mg/')) return CACHE_NAMES.mathGame;
    if (url.includes('/w/ra/')) return CACHE_NAMES.lifeOnEarth;
    if (url.includes('/w/lc/')) return CACHE_NAMES.clock;
    if (url.includes('/w/c/')) return CACHE_NAMES.calculator;
    if (url.includes('/w/sp/')) return CACHE_NAMES.planner;
    if (url.includes('/w/ytn/')) return CACHE_NAMES.ytNews;
    if (url.includes('/w/cdt/')) return CACHE_NAMES.countdown;
    if (url.includes('/w/rtp/')) return CACHE_NAMES.reverseTimePlanner;
    if (url.includes('/w/ssa/')) return CACHE_NAMES.stockAnalysis;
    if (url.includes('/w/pg/')) return CACHE_NAMES.passwordGenerator;
    return CACHE_NAMES.main;
}

// Install event - cache basic assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAMES.main)
            .then(cache => cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/manifest.json',
                '/favicon.png',
                '/offline.html'
            ]))
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => !Object.values(CACHE_NAMES).includes(name))
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
                    return response;
                }
                
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        const cacheName = getCacheName(event.request.url);

                        caches.open(cacheName)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                        return null;
                    });
            })
    );
});
