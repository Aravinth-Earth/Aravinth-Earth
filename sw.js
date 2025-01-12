const CACHE_NAME = 'site-cache-v2.1';

// Update the path to style.css in urlsToCache
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Update path check for style.css
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
