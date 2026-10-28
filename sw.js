/**
 * Service Worker for https://www.332321.xyz
 *
 * Design notes
 * ------------
 * - The cache name lives ONLY here. The client never names a cache; it asks
 *   this worker for its version over a MessageChannel. That removes the whole
 *   class of bug where the page and the worker disagree about the cache name
 *   (which previously made the "refresh" button a silent no-op).
 * - Bump CACHE_NAME whenever the cached content should be invalidated. The
 *   `activate` handler deletes the previous generation of THIS worker's
 *   caches, so a bump is all it takes to evict them. It deliberately leaves
 *   other caches on the origin alone: the worker's scope is "/", so it can
 *   see every Cache on the host, and deleting someone else's would be
 *   rude.
 *   BUMP IT WHEN: the shared CSS or JS changes. Stylesheets are served
 *   cache-first, so a returning visitor keeps the copy they already have
 *   until the cache name changes. A new theme, a new token, or a changed
 *   focus ring will not reach them otherwise.
 * - Responses are classified by request, then each class gets the strategy
 *   that fits it: pages are stale-while-revalidate (instant, self-healing),
 *   static assets and JSON are cache-first with a background revalidate
 *   (instant + eventually fresh), third-party libraries are cache-first
 *   (explicit allowlist only), and everything else goes straight to the
 *   network untouched.
 *
 * - LIVE_DATA_PATHS is an exception to all of that: a page whose whole point
 *   is a feed of third-party live-stream ids is worthless unless the ids are
 *   current, and its embeds need the network anyway -- an offline copy buys
 *   nothing. Those requests are not intercepted at all, so no strategy can
 *   answer with an old copy.
 */

const CACHE_NAME = 'site-cache-v8';

/**
 * The prefix every cache this worker owns shares.
 *
 * The worker's scope is "/", so it can see every Cache on the origin -- not
 * just its own. The activate handler only removes caches with this prefix,
 * so another app keeping a cache on the same host is left alone.
 */
const CACHE_PREFIX = 'site-cache-';

/** Served for offline navigations that were never cached. */
const OFFLINE_FALLBACK_URL = '/404.html';

/** Local copy of the QR library, used when the CDN cannot be reached. */
const QR_LOCAL_FALLBACK = '/w/qr-generator/2025_03_18_qrcode.mini.js';
// The pinned commit the QR generator actually requests. This must match the
// URL in w/qr-generator/generator.html, or the local fallback below will
// never be reached when the CDN fails.
const QR_CDN_PREFIX =
    'https://cdn.jsdelivr.net/gh/davidshimjs/qrcodejs@06c7a5e134f116402699f03cda5819e10a0e5787/';

/**
 * Site shell: the minimum needed to render the homepage and to look like a
 * real app (manifest, icons, theme). Installed first and awaited on its own.
 */
const SHELL_PRECACHE_URLS = [
    '/',
    '/index.html',
    '/404.html',
    '/manifest.json',
    '/favicon.png',
    '/og-image.png',
    '/apple-touch-icon.png',

    // The design tokens and the shared primitives. Without these the shell
    // renders unstyled offline: the tokens define the colours and the
    // primitives are the buttons, cards and focus rings every page uses.
    '/css/tokens.css',
    '/css/base.css',
    '/css/style.css',
    '/css/themes.css',
    '/css/about-privacy.css',

    '/js/pwa.js',
    '/js/theme-switcher.js',
    '/js/privacy-manifest.js',
    '/js/about-privacy.js'
];

/** Every tool page, so the whole site is browsable offline on a first visit. */
const PAGE_PRECACHE_URLS = [
    '/w/calculator/calc.html',
    '/w/calm-sweep/index.html',
    '/w/clock/clock.html',
    '/w/countdown/count-down.html',
    '/w/daily-planner/index.html',
    '/w/decision-helper/index.html',
    '/w/expense-splitter/index.html',
    '/w/life-on-earth/Life_On_Earth.html',
    '/w/math-game/index.html',
    '/w/password-generator/pwd.html',
    '/w/qa-playground/accessibility.html',
    '/w/qa-playground/api-mock.html',
    '/w/qa-playground/data-tables.html',
    '/w/qa-playground/downloads.html',
    '/w/qa-playground/dynamic.html',
    '/w/qa-playground/forms.html',
    '/w/qa-playground/frames.html',
    '/w/qa-playground/index.html',
    '/w/qa-playground/inputs.html',
    '/w/qa-playground/interactive.html',
    '/w/qa-playground/nested-frame.html',
    '/w/qa-playground/selection.html',
    '/w/qa-playground/shadow-dom.html',
    '/w/qa-playground/storage.html',
    '/w/qa-playground/upload.html',
    '/w/qr-generator/generator.html',
    '/w/random-number/random-number.html',
    '/w/reverse-planning/index.html',
    '/w/secret-share/index.html',
    '/w/simon-game/index.html',
    '/w/stock-portfolio-split/index.html',
    '/w/teach-me/index.html',
    '/w/tn-assembly-map/index.html',
    '/w/today-date/index.html'
    // NOTE: w/youtube-news/ is deliberately absent -- see LIVE_DATA_PATHS.
];

/**
 * Heavy / per-tool assets. These are installed *after* the shell in a separate
 * waitUntil so that ~1.8 MB of GeoJSON and a 700 KB audio track can never
 * delay the shell becoming available. Nothing here is larger than 2 MB; bigger
 * files are left to the runtime cache-first handler.
 */
const ASSET_PRECACHE_URLS = [
    // TN assembly map GeoJSON (1.8 MB) - the map is unusable offline without it.
    '/w/tn-assembly-map/data/constituencies.json',
    '/w/tn-assembly-map/data/districts.json',
    '/w/tn-assembly-map/data/timeline.json',

    // QR generator: local fallback for the CDN copy of the library.
    '/w/qr-generator/2025_03_18_qrcode.mini.js',
    '/w/qr-generator/qr-styles.css',
    '/w/qr-generator/qr-script.js',

    // QA playground.
    '/w/qa-playground/qa-playground.css',
    '/w/qa-playground/qa-playground.js',
    '/w/qa-playground/data.json',

    // Life on Earth.
    '/w/life-on-earth/config.js',
    '/w/life-on-earth/main.css',
    '/w/life-on-earth/main.js',
    '/w/life-on-earth/quotes.js',
    '/w/life-on-earth/shapes.js',
    '/w/life-on-earth/utils.js',
    '/w/life-on-earth/edge-summer-forest.opus',

    // Today / Date.
    '/w/today-date/css/style.css',
    '/w/today-date/js/calendars.js',
    '/w/today-date/js/astronomy.js'
];

/** Flat view of everything that is precached (used by tooling / tests). */
const PRECACHE_URLS = SHELL_PRECACHE_URLS.concat(
    PAGE_PRECACHE_URLS,
    ASSET_PRECACHE_URLS
);

/**
 * Paths whose content is live data, not app code: never intercepted, never
 * cached, never precached.
 *
 * `w/youtube-news/` renders a feed of YouTube live-stream ids that the
 * publisher refreshes several times a day. Every strategy here would answer
 * the first load after a publish with the previous copy -- cache-first serves
 * the entry it already holds, stale-while-revalidate serves the cached page
 * -- and a stale id is a dead embed. The page is useless without the network,
 * so there is nothing to buy by keeping a copy: pass it through untouched.
 */
const LIVE_DATA_PATHS = ['/w/youtube-news/'];

/**
 * Static assets that are safe to serve from cache and refresh in the
 * background. `mp3`/`opus` are included so the precached Life on Earth
 * soundtrack is actually served from the cache instead of being ignored.
 */
const STATIC_ASSET_PATTERN =
    /\.(css|js|png|svg|jpe?g|webp|gif|ico|woff2?|ttf|otf|mp3|opus)$/i;

/** JSON data files (the GeoJSON payloads are large, so they must be cached). */
const JSON_PATTERN = /\.json$/i;

/**
 * Third-party libraries we are willing to serve from cache. Host + path
 * prefix, because a bare host allowlist would let any path on those CDNs be
 * cached. Everything else cross-origin is left completely alone.
 *
 * The prefixes name the EXACT pinned version of each library, so the
 * allowlist cannot silently start covering a different file. Every one of
 * these is pinned to an immutable reference in the page's <script> tag:
 * an unpinned URL would resolve to whatever the CDN serves today, and the
 * cache would freeze that version for every returning visitor.
 */
const THIRD_PARTY_ALLOWLIST = [
    { host: 'cdn.jsdelivr.net', prefix: '/gh/davidshimjs/qrcodejs@06c7a5e134f116402699f03cda5819e10a0e5787/' },
    { host: 'cdn.jsdelivr.net', prefix: '/npm/chart.js@4.5.1/' },
    { host: 'cdn.jsdelivr.net', prefix: '/npm/chartjs-plugin-datalabels@2.2.0/' },
    { host: 'unpkg.com', prefix: '/leaflet@1.9.4/dist/' },
    { host: 'cdnjs.cloudflare.com', prefix: '/ajax/libs/animejs/3.2.2/' },
    { host: 'cdnjs.cloudflare.com', prefix: '/ajax/libs/font-awesome/6.0.0-beta3/' }
];

/**
 * Set for one navigation when the user explicitly asks for a refresh. Pages
 * are normally served stale-while-revalidate, so without this a manual
 * refresh would keep showing the cached copy.
 */

// ---------------------------------------------------------------------------
// Install / activate
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
    // Separate waitUntil() calls: the shell is the critical path, the heavy
    // assets are not. `install` only resolves once all of them are done, but
    // the shell is in the cache from the moment its own group finishes, and
    // the data group only starts after the shell is in place.
    const shell = precacheGroup(SHELL_PRECACHE_URLS, 'shell');
    event.waitUntil(shell);
    event.waitUntil(shell.then(() => precacheGroup(PAGE_PRECACHE_URLS, 'pages')));
    event.waitUntil(
        shell.then(() => precacheGroup(ASSET_PRECACHE_URLS, 'assets'))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            // Only this worker knows the current cache name, so it is also the
            // only place that can decide what to throw away.
            //
            // Only caches this worker OWNS are removed. The scope is "/", so
            // any other app, worker or library keeping a Cache on this origin
            // would otherwise lose it every time this worker activated.
            const keys = await caches.keys();
            await Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME && key.startsWith(CACHE_PREFIX))
                    .map((key) => caches.delete(key))
            );
            // Take over pages that are already open, so a new deploy applies
            // to them without the user having to navigate first.
            await self.clients.claim();
        })()
    );
});

// ---------------------------------------------------------------------------
// Messages from the page
// ---------------------------------------------------------------------------

self.addEventListener('message', (event) => {
    const data = event.data || {};

    if (data.type === 'SKIP_WAITING') {
        if (data.bypassCache) {
        }
        // NOTE: skipWaiting() belongs here, not in `install`. Calling it during
        // install would activate the new worker before the page asked for it
        // and break the "waiting -> activate -> reload" update flow.
        self.skipWaiting();
        reply(event, { ok: true, version: CACHE_NAME });
        return;
    }

    if (data.type === 'GET_VERSION') {
        reply(event, { version: CACHE_NAME });
    }
});

/** Answer a message on the MessageChannel port the page provided. */
function reply(event, payload) {
    const port = event.ports && event.ports[0];
    if (port) {
        port.postMessage(payload);
    } else if (event.source) {
        event.source.postMessage(payload);
    }
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Only GETs are cacheable. POST/PUT/DELETE go straight to the network.
    if (request.method !== 'GET') return;

    // Range requests are used for media seeking; they must not be cached
    // (a partial response would poison the cache entry).
    if (request.headers.has('range')) return;

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;

    // Never cache API traffic.
    if (sameOrigin && url.pathname.startsWith('/api/')) return;

    // Live data is passed through for navigations and assets alike: no
    // strategy may answer this page or its feed with a copy the worker holds.
    if (sameOrigin && isLiveDataPath(url)) return;

    if (request.mode === 'navigate') {
        const result = handleNavigation(event);
        // Registered synchronously so the worker stays alive for the whole
        // background refresh, not just for the response.
        event.waitUntil(result.background);
        event.respondWith(result.response.catch(() => serviceUnavailable()));
        return;
    }

    if (!sameOrigin) {
        // Only the explicit allowlist is intercepted. Any other cross-origin
        // request is left untouched, which also means no opaque response is
        // ever stored.
        if (isAllowedThirdParty(url)) {
            const result = handleThirdParty(event);
            event.waitUntil(result.background);
            event.respondWith(result.response.catch(() => serviceUnavailable()));
        }
        return;
    }

    if (
        JSON_PATTERN.test(url.pathname) ||
        STATIC_ASSET_PATTERN.test(url.pathname)
    ) {
        const result = handleNetworkFirstAsset(event);
        event.waitUntil(result.background);
        event.respondWith(result.response.catch(() => serviceUnavailable()));
    }
    // Anything else (unknown extension) is not intercepted at all.
});

/** Last-resort answer, so the user never sees a raw browser error page. */
function serviceUnavailable() {
    return new Response('Service Unavailable', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------

/**
 * Navigations: NETWORK FIRST.
 *
 * The internet is the source of truth. A page is fetched from the network on
 * every navigation and only falls back to the stored copy when that request
 * fails (offline, DNS, timeout) or the server answers with a 5xx. The old
 * order -- cache first, revalidate in the background -- made every deploy
 * invisible for one visit per page, which reads as "my change is not there"
 * even though it shipped.
 *
 * Trade-off, accepted on purpose: a navigation now costs a round trip when
 * the network is up. The site is static and edge-cached, so that trip is
 * short; a wrong-looking page is worse than a 100 ms wait.
 */
function handleNavigation(event) {
    const request = event.request;
    const url = new URL(request.url);
    const cachePromise = caches.open(CACHE_NAME);

    const response = (async () => {
        const cache = await cachePromise;

        try {
            // `cache: 'no-cache'` makes the browser revalidate with the server
            // instead of answering from its own HTTP cache, which would hand
            // back the same bytes we are trying to replace.
            const fresh = await fetch(request, { cache: 'no-cache' });

            if (fresh && !isServerError(fresh)) {
                if (isCacheable(fresh)) {
                    try {
                        // Store by PATHNAME, not the full URL: a query string
                        // would make every variant its own entry, so the cache
                        // could grow without bound.
                        await cache.put(
                            new Request(url.pathname, { headers: request.headers }),
                            fresh.clone()
                        );
                    } catch (err) {
                        /* cache.put can reject on odd responses - never fatal */
                    }
                }
                // A 404 is a dead end; serve our own styled page so the site
                // has ONE error entry whether the miss comes from here, the
                // server, or the offline fallback.
                if (fresh.status === 404) {
                    const styled = await cached404(cache);
                    if (styled) return styled;
                }
                return fresh;
            }

            // 5xx: a stored copy beats the server's error page.
            const cachedOnError = await matchPage(cache, url);
            if (cachedOnError) return cachedOnError;
            return fresh || offlineFallback(cache);
        } catch (err) {
            const cached = await matchPage(cache, url);
            if (cached) return cached;
            return offlineFallback(cache);
        }
    })();

    return { response, background: Promise.resolve() };
}

/**
 * The styled 404 page from the cache, if it is there.
 *
 * The response is re-wrapped with a 404 status so the page is not mistaken
 * for a successful load by anything inspecting the response.
 */
async function cached404(cache) {
    const fallback = await cache.match(OFFLINE_FALLBACK_URL);
    if (!fallback) return null;
    return new Response(fallback.body, {
        status: 404,
        statusText: 'Not Found',
        headers: fallback.headers,
    });
}

/**
 * Static assets and JSON: NETWORK FIRST, cache as the fallback.
 *
 * Same rule as pages: the network answers when it can, the stored copy only
 * when it cannot. The 1.8 MB GeoJSON payloads are the reason the cache still
 * exists at all -- without them the assembly map is dead offline -- but they
 * are no longer served from the cache while the network is available.
 */
function handleNetworkFirstAsset(event) {
    const request = event.request;
    const cachePromise = caches.open(CACHE_NAME);

    const response = (async () => {
        const cache = await cachePromise;

        try {
            const fresh = await fetch(request, { cache: 'no-cache' });
            if (isCacheable(fresh)) {
                try {
                    await cache.put(request, fresh.clone());
                } catch (err) {
                    /* a failed cache write must never fail the response */
                }
            }
            return fresh;
        } catch (err) {
            const cached = await cache.match(request);
            if (cached) return cached;
            // Not cached and unreachable: a plain 504, because serving the
            // HTML 404 page here would break CSS/JS parsing.
            return new Response('Service Unavailable', {
                status: 504,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }
    })();

    return { response, background: Promise.resolve() };
}

/**
 * Third-party libraries: cache-first, no revalidation.
 *
 * No revalidation is needed because every allowlisted URL is pinned to an
 * immutable reference -- an exact version for the npm packages, an exact
 * commit for the GitHub-hosted one. The content at that URL cannot change,
 * so re-fetching it would only cost bandwidth.
 *
 * (That is also why the allowlist names exact versions: with the bare
 * "/npm/chart.js" path the CDN would serve whatever is latest today, and
 * the cache would freeze that version for every returning visitor -- so a
 * broken upstream release would be permanent.)
 *
 * Only the allowlisted URLs reach this.
 */
function handleThirdParty(event) {
    const request = event.request;
    const url = new URL(request.url);
    const cachePromise = caches.open(CACHE_NAME);
    const background = deferred();

    const response = (async () => {
        const cache = await cachePromise;
        const cached = await cache.match(request);
        if (cached) {
            background.resolve();
            return cached;
        }

        try {
            const fresh = await fetch(request);
            if (fresh && (fresh.ok || fresh.type === 'opaque')) {
                background.resolve(
                    cache.put(request, fresh.clone()).catch(() => {})
                );
            } else {
                background.resolve();
            }
            return fresh;
        } catch (err) {
            background.resolve();
            // The CDN is unreachable. The QR generator has a local copy of the
            // library, so serve that instead of breaking the page.
            if (url.href.startsWith(QR_CDN_PREFIX)) {
                const fallback = await cache.match(QR_LOCAL_FALLBACK);
                if (fallback) return fallback;
            }
            return new Response('Service Unavailable', {
                status: 504,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }
    })();

    return { response, background: background.promise };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A promise whose value is supplied later. Used to hand the fetch handler a
 * background job that is only known once the cache lookup has finished, while
 * still being able to register it with waitUntil() synchronously.
 */
function deferred() {
    let resolve;
    const promise = new Promise((res) => {
        resolve = res;
    });
    return {
        promise: promise,
        // Rejections are swallowed: a background job must never fail the
        // fetch event, and the promise must never hang.
        resolve: (value) => resolve(Promise.resolve(value).catch(() => {}))
    };
}

/**
 * Fetch a page from the network and refresh the cache entry. Failures are
 * silent on purpose: a stale cached copy is always better than an error.
 */
async function revalidateInBackground(cache, request) {
    try {
        // `cache: 'no-cache'` forces the network rather than letting the
        // browser's HTTP cache answer. Without it the revalidation fetches
        // the SAME bytes that are already cached, writes them back, and the
        // cache stays stale forever -- a deploy would be shadowed by the
        // origin's own Cache-Control for as long as that is set.
        const response = await fetch(request, { cache: 'no-cache' });
        if (isCacheable(response)) {
            await cache.put(request, response.clone());
        }
    } catch (err) {
        /* offline or server error - keep the cached copy */
    }
}

/**
 * Match a navigation against the cache. GitHub Pages serves /w/tool/ from
 * /w/tool/index.html, but the cache key we precached is the file path, so
 * try the equivalent spellings before giving up.
 */
async function matchPage(cache, url) {
    const candidates = [url.pathname];

    if (url.pathname.endsWith('/')) {
        candidates.push(url.pathname + 'index.html');
    } else if (!/\.[a-z0-9]+$/i.test(url.pathname)) {
        candidates.push(url.pathname + '/');
        candidates.push(url.pathname + '/index.html');
        candidates.push(url.pathname + '.html');
    }

    for (const candidate of candidates) {
        const hit = await cache.match(candidate, { ignoreSearch: true });
        if (hit) return hit;
    }
    return null;
}

/** Offline fallback for a navigation: the styled 404 page, else a 503 stub. */
async function offlineFallback(cache) {
    // Serve the site's 404 page, re-wrapped with a 404 status. The cached
    // copy was stored with a 200 (it is a real file), so returning it
    // unchanged would make a missing page look like a successful load.
    const styled = await cached404(cache);
    if (styled) return styled;

    return new Response(
        '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<title>Offline</title></head>' +
            '<body style="background:#0a0c10;color:#c9d1d9;font-family:system-ui,sans-serif;' +
            'display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center">' +
            '<div><h1 style="font-size:3rem;margin:0 0 .5rem;color:#58a6ff">Offline</h1>' +
            '<p style="color:#8b949e">You are offline and this page has not been cached yet.</p>' +
            '<p><a href="/" style="color:#58a6ff">&larr; Back to Home</a></p></div></body></html>',
        {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
    );
}

/** True when the response may be written to the cache. */
function isCacheable(response) {
    if (!response || !response.ok) return false;
    if (response.type === 'opaque') return false;
    const cacheControl = response.headers.get('cache-control');
    if (
        cacheControl &&
        cacheControl.toLowerCase().indexOf('no-store') !== -1
    ) {
        return false;
    }
    return true;
}

/**
 * True when the response is an HTTP error (4xx / 5xx), i.e. something the
 * server reported as broken.
 *
 * The status is compared instead of using `response.ok` because an opaque
 * response (any cross-origin request) reports status 0: it is not an error,
 * it is simply unreadable, and it must still be returned to the page.
 */
function isServerError(response) {
    return response.status >= 400;
}

/** True when the URL is one of the explicitly allowlisted third-party files. */
function isAllowedThirdParty(url) {
    return THIRD_PARTY_ALLOWLIST.some(
        (entry) =>
            url.host === entry.host &&
            url.pathname.startsWith(entry.prefix)
    );
}

/** True when the URL belongs to a live-data path (see LIVE_DATA_PATHS). */
function isLiveDataPath(url) {
    return LIVE_DATA_PATHS.some((prefix) => url.pathname.startsWith(prefix));
}

/**
 * Add a group of URLs to the cache. Every URL is added individually so that
 * one missing file cannot abort the whole install; failures are logged.
 */
async function precacheGroup(urls, label) {
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(
        urls.map((url) =>
            // `cache: 'reload'` bypasses the HTTP cache so an install always
            // stores the current version of the file.
            cache.add(new Request(url, { cache: 'reload' }))
        )
    );

    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length) {
        console.warn(
            '[sw] precache "' +
                label +
                '": ' +
                failures.length +
                '/' +
                urls.length +
                ' failed',
            failures.map((failure) => String(failure.reason))
        );
    }
    return cache;
}
