importScripts('/config/version.js');

const CACHE_NAMES = {
    core: `app-core-${APP_VERSION.cacheKey}`,
    static: `app-static-${APP_VERSION.cacheKey}`,
    dynamic: `app-dynamic-${APP_VERSION.cacheKey}`
};

// Version numbers - UPDATE THESE when making changes
const VERSION = {
    CORE: 'v2',
    STATIC: 'v2',
    DYNAMIC: 'v2'
};

// Core assets required for PWA to function
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png',
    '/style.css',
    '/js/refresh-handler.js',
    '/offline.html'  // Fallback page
];

// All subpages and their assets
const SUBPAGES = {
    'planner': {
        root: '/w/sp/',
        files: ['planner.html', 'planner.js', 'planner.css']
    },
    'calculator': {
        root: '/w/c/',
        files: ['calc.html', 'calc.js', 'calc.css']
    },
    'clock': {
        root: '/w/lc/',
        files: ['clock.html', 'clock.js']
    },
    'timer': {
        root: '/w/cdt/',
        files: ['count-down.html', 'timer.js']
    },
    'math': {
        root: '/w/mg/',
        files: ['index.html', 'game.js']
    },
    'news': {
        root: '/w/ytn/',
        files: ['news.html', 'news.js']
    },
    'life': {
        root: '/w/ra/',
        files: ['Life_On_Earth.html', 'life.js']
    },
    'stocks': {
        root: '/w/ssa/',
        files: ['analysis.html', 'analysis.js']
    }
};

// Create flat list of all static assets
const STATIC_ASSETS = [
    ...CORE_ASSETS,
    ...Object.values(SUBPAGES).flatMap(({ root, files }) => 
        files.map(file => root + file)
    )
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAMES.core).then(cache => {
            console.log('Caching core assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    // Delete old cache versions
                    if (!Object.values(CACHE_NAMES).includes(key)) {
                        console.log('Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    // Ensure SW takes control immediately
    return self.clients.claim();
});

// Fetch event with network-first strategy for dynamic content
// and cache-first for static assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Handle project-specific assets
    for (const [project, { root, files }] of Object.entries(SUBPAGES)) {
        if (files.some(file => url.pathname.includes(root + file))) {
            event.respondWith(handleProjectAsset(event.request, project));
            return;
        }
    }

    // Handle core assets
    if (STATIC_ASSETS.includes(url.pathname)) {
        event.respondWith(handleCoreAsset(event.request));
        return;
    }

    // Default handling
    event.respondWith(handleDefault(event.request));
});

// Handle project-specific assets with cache-first strategy
async function handleProjectAsset(request, project) {
    const cache = await caches.open(CACHE_NAMES.static);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // Return cached version but update cache in background
        updateCache(request, cache);
        return cachedResponse;
    }

    try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        return caches.match('/offline.html');
    }
}

// Handle core assets with network-first strategy
async function handleCoreAsset(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAMES.core);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || caches.match('/offline.html');
    }
}

// Handle all other requests
async function handleDefault(request) {
    // Only cache GET requests
    if (request.method !== 'GET') return fetch(request);

    try {
        const response = await fetch(request);
        // Cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAMES.dynamic);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || caches.match('/offline.html');
    }
}

// Background cache update
async function updateCache(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response);
        }
    } catch (error) {
        console.log('Background cache update failed:', error);
    }
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
