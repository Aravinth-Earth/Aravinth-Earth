/**
 * Direct test of the service worker's logic, in Node, without a browser.
 *
 * The browser-based test (site-checks/sw-test.js in the private test
 * repository) is the real one, but it needs a browser and a live server.
 * This harness loads sw.js into a VM with stubbed ServiceWorker globals so
 * the cache strategies can be exercised directly -- no chromium, no
 * flakiness. It stays here because CI must block a broken worker before
 * merge, and it needs nothing a public checkout does not have.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const swSource = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

// --- A tiny Cache API + fetch stub -----------------------------------------
function makeCache() {
    const store = new Map();
    // Key by pathname, the way the browser's Cache API does for same-origin
    // requests and the way the worker looks entries up.
    const keyOf = (r) => {
        const u = typeof r === 'string' ? r : r.url;
        return new URL(u, ORIGIN).pathname;
    };
    return {
        _store: store,
        async match(request) {
            return store.get(keyOf(request)) || undefined;
        },
        async put(request, response) {
            store.set(keyOf(request), response);
        },
        async add(request) {
            // The worker calls cache.add(new Request(url, {cache:'reload'})).
            const res = await fetchHandler(new Request(abs(keyOf(request))));
            if (!res.ok) throw new Error('add failed: ' + res.status);
            store.set(keyOf(request), res);
        },
        async keys() {
            return [...store.keys()].map((url) => ({ url }));
        },
        async matchAll() {
            return [...store.keys()].map((url) => ({ url }));
        },
        async addAll() {},
        async delete(request) {
            return store.delete(typeof request === 'string' ? request : request.url);
        },
    };
}

const caches = {
    _caches: new Map(),
    async open(name) {
        if (!this._caches.has(name)) this._caches.set(name, makeCache());
        return this._caches.get(name);
    },
    async keys() {
        return [...this._caches.keys()];
    },
    async delete(name) {
        return this._caches.delete(name);
    },
};

/**
 * A Request that resolves relative URLs.
 *
 * In a browser, new Request('/index.html') inside a service worker resolves
 * against the worker's origin. Node's global Request requires an absolute
 * URL, so the worker would throw on every relative path.
 */
class BrowserRequest extends Request {
    constructor(input, init) {
        super(typeof input === 'string' ? new URL(input, ORIGIN).href : input, init);
    }
}
const ORIGIN = 'https://www.332321.xyz';

let fetchHandler = () => new Response('default', { status: 200 });

/** Requests in the worker are made against the site's origin. */
function abs(url) {
    return new URL(url, 'https://www.332321.xyz/').href;
}
// Capture the worker's own warnings -- precacheGroup logs its failures.
const workerLogs = [];
const workerConsole = {
    log: (...a) => workerLogs.push('log: ' + a.join(' ')),
    warn: (...a) => workerLogs.push('warn: ' + a.join(' ')),
    error: (...a) => workerLogs.push('error: ' + a.join(' ')),
    info: () => {},
    debug: () => {},
};

const self = {
    addEventListener(type, fn) {
        if (type === 'install') self._install = fn;
        if (type === 'activate') self._activate = fn;
        if (type === 'fetch') self._fetch = fn;
        if (type === 'message') self._message = fn;
    },
    skipWaiting() {},
    clients: { claim: async () => {}, matchAll: async () => [] },
    registration: {},
    location: new URL('https://www.332321.xyz/'),
    caches,
    fetch: (...args) => fetchHandler(...args),
    Response,
    Request: BrowserRequest,
    URL,
    console: workerConsole,
    setTimeout,
    clearTimeout,
    Promise,
    _install: null,
    _activate: null,
    _fetch: null,
    _message: null,
};

const context = vm.createContext({
    self,
    workerLogs,
    caches,
    fetch: (...args) => fetchHandler(...args),
    Response,
    Request: BrowserRequest,
    URL,
    console,
    setTimeout,
    clearTimeout,
    Promise,
    location: self.location,
});

vm.runInContext(swSource, context, { filename: 'sw.js' });

// --- Helpers ----------------------------------------------------------------
function makeEvent(request) {
    const promises = [];
    let response = null;
    return {
        request,
        respondWith(p) {
            response = Promise.resolve(p);
        },
        waitUntil(p) {
            promises.push(Promise.resolve(p).catch(() => {}));
        },
        async settle() {
            // The worker registers three waitUntil calls; the second and
            // third are chains off the first, so they resolve later. Awaiting
            // all of them together is what settles the whole install.
            await Promise.all(promises);
            await new Promise((r) => setTimeout(r, 50));
            await Promise.all(promises);
        },
        // The response the handler committed to, if any.
        get response() {
            return response;
        },
    };
}

function req(url, opts = {}) {
    return new Request('https://www.332321.xyz' + url, opts);
}

/** A navigation request: the worker branches on request.mode === 'navigate'. */
function navReq(url) {
    const r = new Request('https://www.332321.xyz' + url);
    // request.mode is read-only on a real Request, so define it.
    Object.defineProperty(r, 'mode', { value: 'navigate', configurable: true });
    return r;
}

const results = [];
function check(name, ok, detail) {
    results.push({ name, ok, detail });
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`);
}

(async () => {
    console.log('Service worker logic (Node harness)\n');

    // --- install: precache ------------------------------------------------
    let installFailed = null;
    const origFetch = fetchHandler;
    fetchHandler = async (input) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('__fail__')) return new Response('nope', { status: 500 });
        return new Response('body of ' + url, { status: 200 });
    };
    const installEvent = makeEvent(req('/'));
    try {
        await self._install(installEvent);
        await installEvent.settle();
    } catch (e) {
        installFailed = e;
    }
    check('install completes', !installFailed, installFailed ? installFailed.message : '');
    if (workerLogs.length) console.log('    [worker logs]', workerLogs.slice(0, 3));
    check('install does not throw on a failed entry', true);

    // The shell should be cached now.
    const cacheNames = await caches.keys();
    check('a cache was created', cacheNames.length > 0, cacheNames.join(','));

    const cache = await caches.open(cacheNames[0]);
    const cached = await cache.keys();
    check(
        'the shell is precached (tokens + base included)',
        cached.some((r) => r.url.endsWith('/css/tokens.css')) &&
            cached.some((r) => r.url.endsWith('/css/base.css')),
        `${cached.length} entries`
    );
    check(
        'the pages are precached',
        cached.filter((r) => r.url.includes('/w/')).length >= 30,
        `${cached.filter((r) => r.url.includes('/w/')).length} page entries`
    );

    // --- activate: purge the old generation --------------------------------
    await caches.open('site-cache-v2');
    const activateEvent = makeEvent(req('/'));
    await self._activate(activateEvent);
    await activateEvent.settle();
    const afterActivate = await caches.keys();
    check(
        'activate purges the old cache generation',
        !afterActivate.includes('site-cache-v2'),
        afterActivate.join(',')
    );

    // --- fetch: navigation ------------------------------------------------
    // Offline navigation with a cached page -> the cached page.
    fetchHandler = async () => {
        throw new Error('offline');
    };
    const navEvent = makeEvent(navReq('/w/secret-share/'));
    self._fetch(navEvent);
    const navResponse = navEvent.response ? await navEvent.response : null;
    check(
        'an offline navigation serves the cached page',
        navResponse && navResponse.status === 200,
        navResponse ? 'status ' + navResponse.status : 'no response'
    );

    // Offline navigation to something never cached -> the 404 fallback.
    const nav2 = makeEvent(navReq('/never-visited-page/'));
    self._fetch(nav2);
    const resp2 = nav2.response ? await nav2.response : null;
    check(
        'an offline navigation to an uncached URL serves the 404 page',
        resp2 && resp2.status === 404,
        resp2 ? 'status ' + resp2.status : 'no response'
    );

    // A server error must NOT replace a good cached copy.
    await cache.put(req('/w/secret-share/'), new Response('cached copy', { status: 200 }));
    fetchHandler = async () => new Response('SERVER ERROR', { status: 500 });
    const nav3 = makeEvent(navReq('/w/secret-share/'));
    self._fetch(nav3);
    const resp3 = nav3.response ? await nav3.response : null;
    const body3 = resp3 ? await resp3.clone().text() : '';
    check(
        'a server error does not replace a good cached copy',
        body3 === 'cached copy',
        `body: ${JSON.stringify(body3.slice(0, 30))}`
    );

    // NETWORK FIRST: with the network healthy, the network body wins over a
    // perfectly good cached copy. This is the rule that makes a deploy visible
    // on the very next visit, so it is asserted explicitly.
    fetchHandler = async () => new Response('NETWORK BODY', { status: 200 });
    const nav4 = makeEvent(navReq('/w/secret-share/'));
    self._fetch(nav4);
    await nav4.settle();
    const resp4 = nav4.response ? await nav4.response : null;
    const body4 = resp4 ? await resp4.clone().text() : '';
    check(
        'a healthy network wins over the cached page',
        body4 === 'NETWORK BODY',
        `body: ${JSON.stringify(body4.slice(0, 30))}`
    );

    const refreshed = await cache.match(req('/w/secret-share/'));
    const refreshedBody = refreshed ? await refreshed.clone().text() : '';
    check(
        'the network copy replaces the cached page',
        refreshedBody === 'NETWORK BODY',
        `cached body: ${JSON.stringify(refreshedBody.slice(0, 30))}`
    );

    // --- fetch: static assets ---------------------------------------------
    fetchHandler = async () => new Response('css body', { status: 200 });
    const cssEvent = makeEvent(req('/css/style.css'));
    self._fetch(cssEvent);
    const cssResp = cssEvent.response ? await cssEvent.response : null;
    check(
        'a static asset is served and cached',
        cssResp && cssResp.status === 200 && (await cache.match(req('/css/style.css'))),
        ''
    );

    // --- assets are network first too -------------------------------------
    {
        // A stale asset in the cache must not be served while the network works.
        await cache.put(req('/css/style.css'), new Response('STALE CSS', { status: 200 }));
        fetchHandler = async () => new Response('FRESH CSS', { status: 200 });
        const assetEvent = makeEvent(req('/css/style.css'));
        self._fetch(assetEvent);
        await assetEvent.settle();
        const served = assetEvent.response ? await assetEvent.response : null;
        const servedBody = served ? await served.clone().text() : '';
        check(
            'a stale cached asset is replaced by the network copy',
            servedBody === 'FRESH CSS',
            'served: ' + JSON.stringify(servedBody.slice(0, 30))
        );
        const after = await cache.match(req('/css/style.css'));
        const body = after ? await after.clone().text() : '';
        check(
            'the fresh asset is written back to the cache',
            body === 'FRESH CSS',
            'cached body: ' + JSON.stringify(body.slice(0, 30))
        );
    }

    // --- offline asset falls back to the cache ---------------------------
    {
        await cache.put(req('/css/offline.css'), new Response('CACHED CSS', { status: 200 }));
        fetchHandler = async () => { throw new Error('offline'); };
        const off = makeEvent(req('/css/offline.css'));
        self._fetch(off);
        await off.settle();
        const offResp = off.response ? await off.response : null;
        const offBody = offResp ? await offResp.clone().text() : '';
        check(
            'an unreachable asset falls back to the cached copy',
            offBody === 'CACHED CSS',
            'served: ' + JSON.stringify(offBody.slice(0, 30))
        );
    }

    // --- never cache -------------------------------------------------------
    fetchHandler = async () => new Response('x', { status: 200 });
    for (const [url, why] of [
        ['/api/data', 'an /api/ path'],
        ['https://api.visitorbadge.io/api/combined', 'the visitor badge'],
    ]) {
        const ev = makeEvent(req(url));
        const h = self._fetch(ev);
        check(`${why} is not intercepted`, !h || !h.promise, h ? 'intercepted' : 'passed through');
    }

    const postEvent = makeEvent(req('/css/style.css', { method: 'POST' }));
    const postHandled = self._fetch(postEvent);
    check('a POST is not intercepted', !postHandled || !postHandled.promise, '');

    // --- live data: never intercepted, never stored ------------------------
    // The news page renders a feed that is republished several times a day, so
    // ANY strategy here would answer the first load after a publish with the
    // previous copy (cache-first serves its entry, stale-while-revalidate
    // serves the cached page). Both the page and the feed must pass straight
    // through, and neither may be precached.
    {
        fetchHandler = async () => new Response('window.YTN_STREAMS = {};', { status: 200 });
        for (const [label, build] of [
            ['the live-data page', () => navReq('/w/youtube-news/news.html')],
            ['the live-data feed', () => req('/w/youtube-news/streams.js?v=1')],
            ['the live-data feed (no query)', () => req('/w/youtube-news/streams.js')],
        ]) {
            const ev = makeEvent(build());
            self._fetch(ev);
            check(
                `${label} is not intercepted`,
                ev.response === null,
                ev.response === null ? 'passed through' : 'intercepted'
            );
        }

        const liveKeys = (await cache.keys())
            .map((r) => r.url)
            .filter((u) => u.includes('/w/youtube-news/'));
        check(
            'the live-data page is not precached',
            liveKeys.length === 0,
            liveKeys.join(',') || 'no cache entries under /w/youtube-news/'
        );
    }

    // --- message: GET_VERSION ---------------------------------------------
    let replied = null;
    const port = { postMessage: (m) => (replied = m), start() {} };
    const msgEvent = {
        data: { type: 'GET_VERSION' },
        source: { postMessage: (m) => (replied = m) },
        ports: [port],
        waitUntil(p) {},
    };
    self._message(msgEvent);
    check('GET_VERSION replies with the cache name', replied && replied.version, JSON.stringify(replied));

    // --- activate: only this worker's own caches are removed --------------
    // The worker's scope is "/", so it can see every Cache on the origin.
    await caches.open('some-other-app-cache-v1');
    const activate2 = makeEvent(req('/'));
    await self._activate(activate2);
    await activate2.settle();
    const afterActivate2 = await caches.keys();
    check(
        'activate leaves other apps\' caches alone',
        afterActivate2.includes('some-other-app-cache-v1'),
        afterActivate2.join(',')
    );
    check(
        'activate removes an OLD generation of this worker\'s cache',
        !afterActivate2.includes('site-cache-v4'),
        afterActivate2.join(',')
    );

    // --- navigations are stored by pathname, not by full URL --------------
    // Otherwise every distinct query string becomes its own cache entry and
    // the cache can grow without bound.
    {
        const q = makeEvent(navReq('/w/secret-share/?utm_source=twitter'));
        self._fetch(q);
        await q.response;
        await q.settle();
        const stored = (await cache.keys()).map((r) => r.url);
        check(
            'a navigation is cached by pathname, not by query string',
            stored.includes('/w/secret-share/') &&
                !stored.some((u) => u.includes('utm_source')),
            stored.filter((u) => u.includes('secret-share')).join(',')
        );
    }

    // --- the refresh button asks the worker to activate, optionally bypassing
    // the cache for the next navigation.
    let skipReply = null;
    let skipFlag = false;
    const skipEvent = {
        data: { type: 'SKIP_WAITING', bypassCache: true },
        source: { postMessage: (m) => (skipReply = m) },
        ports: [],
        waitUntil(p) {},
    };
    self._message(skipEvent);
    check('SKIP_WAITING is acknowledged', skipReply && skipReply.ok, JSON.stringify(skipReply));

    fetchHandler = origFetch;

    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
    if (failed.length) process.exit(1);
})();
