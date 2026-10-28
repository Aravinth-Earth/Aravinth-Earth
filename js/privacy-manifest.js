/**
 * Per-page privacy manifest.
 *
 * WHY THIS EXISTS
 * The site used to ship ONE hardcoded privacy list inside the About modal and
 * inject it verbatim on 13 pages. That list was wrong in both directions:
 *
 *   - It claimed "No cookies" on pages that set none, but the same list was
 *     shown on pages that were NOT Calm Sweep -- so the PostHog disclosure
 *     appeared on 13 pages that never used PostHog, and on the ONE page that
 *     does use it, there was no disclosure at all.
 *   - It claimed "All app data stays on your device" on pages that ship
 *     gameplay events to PostHog, embed YouTube players, or request map tiles
 *     that reveal which area of the map you are looking at.
 *
 * A generic banner is not a privacy policy. Each tool does something
 * different, so each tool states its own behaviour.
 *
 * HOW IT WORKS
 * This file is a plain data module -- no fetch, no JSON round-trip, so it
 * works offline and never delays the modal. The modal looks up the current
 * page by route and renders the matching entry. A route with no entry gets an
 * honest "not yet documented" state rather than a wrong claim.
 *
 * scripts/check-privacy.js enforces that every page has an entry, and that
 * the entries still match what the pages actually do.
 *
 * SCHEMA
 *   name      display name of the tool
 *   summary   one line on what the tool does
 *   stores    what the tool writes to your device
 *   sends     what the tool sends off your device, and to whom
 *   loads     third-party resources the page requests (these can see your IP
 *             and user agent, but receive nothing about your use of the tool)
 *   notes     optional caveats that do not fit the lists above
 *
 *   stores[]  { label, detail }
 *   sends[]   { to, what, why }
 *   loads[]   { to, what }
 */

(function (global) {
    'use strict';

    // "GoatCounter" appears on most pages, so it is defined once here and
    // referenced by name. The check script compares these against the real
    // third-party hosts each page requests.
    var GC = {
        to: 'GoatCounter',
        what: 'count.js',
    };

    var PAGEVIEWS = {
        to: 'GoatCounter',
        what: 'the page path, the referring page, your screen size, and a daily-rotating hash of your IP',
        why: 'anonymous page-view counts. It sets no cookie and creates no identifier that follows you between sites.',
    };

    var STORAGE_LOCAL = 'localStorage';
    var STORAGE_SESSION = 'sessionStorage';
    var STORAGE_INDEXEDDB = 'IndexedDB';

    var manifest = {
        '/': {
            name: 'Home',
            summary: 'The index of every tool on this site.',
            stores: [
                {
                    label: 'Your theme choice',
                    detail: 'The name of the theme you picked, in ' + STORAGE_LOCAL + ' (key "site-theme").',
                },
            ],
            sends: [PAGEVIEWS],
            loads: [GC],
            notes: [
                'Choosing "Random" also stores the theme it landed on, so the palette stays the same as you move between tools. Clearing the key in your browser\'s site data resets it to a random theme again.',
            ],
        },

        '/404.html': {
            name: 'Page not found',
            summary: 'Shown when a URL does not match anything on the site.',
            stores: [],
            sends: [PAGEVIEWS],
            loads: [GC],
        },

        '/w/calculator/calc.html': {
            name: 'Calculator',
            summary: 'A basic calculator with memory keys. Runs entirely in the page.',
            stores: [],
            sends: [PAGEVIEWS],
            loads: [GC],
            notes: ['Calculator memory lives in a JavaScript variable, so it is gone as soon as you close or reload the tab.'],
        },

        '/w/calm-sweep/': {
            name: 'Calm Sweep',
            summary: 'A calm attention game. This is the one tool on the site that sends gameplay data off your device.',
            stores: [
                {
                    label: 'Your recent game sessions',
                    detail: 'Up to 25 records of score, accuracy, difficulty, and timestamps, in ' + STORAGE_LOCAL + ' (keys "calmSweepStats.v1" and "calmSweepPrefs.v1").',
                },
                {
                    label: 'A PostHog identifier',
                    detail: 'A randomly generated ID in ' + STORAGE_LOCAL + ' and a cookie of the same name. It identifies this browser to PostHog so your gameplay events are counted as one session. It is a random ID, not your name, email, or IP — but it is persistent, and any other page on this site can read it.',
                },
            ],
            sends: [
                {
                    to: 'PostHog',
                    what: 'gameplay events — difficulty, mode, round duration, whether a tile tap was correct, and the language you picked — along with the random ID above, and a page view',
                    why: 'to see how the game is played and where players get stuck. It does not receive the content of your game, your name, or your email.',
                },
                PAGEVIEWS,
            ],
            loads: [
                { to: 'PostHog', what: 'array.js' },
                GC,
            ],
            notes: [
                'This is the only page on the site that sets a tracking identifier, and the only one that identifies you to a third party. The identifier is persistent — it survives until you clear this site\'s data.',
                'PostHog is configured to keep a server-side profile for each identifier, so events are grouped over time rather than counted per visit.',
                'The "Plays offline" line in this page description is out of date — the game logic works offline, but the analytics do not.',
            ],
        },

        '/w/clock/clock.html': {
            name: 'Clock',
            summary: 'A 24-hour clock with adjustable colour and size.',
            stores: [
                {
                    label: 'Your display preferences',
                    detail: '12/24-hour format, colour mode, and font size, in ' + STORAGE_LOCAL + ' (keys "clock.is24HourFormat", "clock.colorMode", "clock.fontSize").',
                },
            ],
            sends: [PAGEVIEWS],
            loads: [GC],
            notes: ['The keys are namespaced with a "clock." prefix, so no other tool on this origin can read or overwrite them.'],
        },

        '/w/countdown/count-down.html': {
            name: 'Countdown Timer',
            summary: 'A countdown to a date and time you choose.',
            stores: [
                {
                    label: 'Your countdown target',
                    detail: 'The year, month, day, hour, minute, and second you set, in ' + STORAGE_LOCAL + ' (keys "countdown.year", "countdown.month", "countdown.day", "countdown.hour", "countdown.minute", "countdown.second").',
                },
            ],
            sends: [PAGEVIEWS],
            loads: [GC],
            notes: ['The keys are namespaced with a "countdown." prefix, so no other tool on this origin can read or overwrite them.'],
        },

        '/w/daily-planner/': {
            name: 'Local Planner',
            summary: 'A table-based task planner. All of your data is stored in your browser.',
            stores: [
                {
                    label: 'Your tables, rows, and columns',
                    detail: 'Every task you add, in ' + STORAGE_INDEXEDDB + ' on this device only (database "LocalPlannerDB").',
                },
            ],
            sends: [PAGEVIEWS],
            loads: [GC],
            notes: ['Export before clearing your browser data — nothing is stored on a server, so a cleared database is gone.'],
        },

        '/w/decision-helper/': {
            name: 'Decision Helper',
            summary: 'A tool for breaking a stalled decision down into weighable options.',
            stores: [
                {
                    label: 'Your language preference',
                    detail: 'In ' + STORAGE_LOCAL + ' (key "dm-lang").',
                },
            ],
            sends: [
                PAGEVIEWS,
                {
                    to: 'Google Fonts',
                    what: 'your IP address, browser, and the address of this page',
                    why: 'to serve the font files. Nothing about your decisions is sent.',
                },
            ],
            loads: [GC, { to: 'Google Fonts', what: 'the stylesheet and font files' }],
            notes: ['This page description claims "no tracking". GoatCounter does send an anonymous page view — see above.'],
        },

        '/w/expense-splitter/': {
            name: 'Expense Splitter',
            summary: 'Splits a trip cost between the people who went.',
            stores: [
                {
                    label: 'Your trip and its expenses',
                    detail: 'Trip name, the list of people, and every expense amount, in ' + STORAGE_LOCAL + ' (key "expenseSplitter").',
                },
                {
                    label: 'Your display name',
                    detail: 'In ' + STORAGE_LOCAL + ' (key "splitter.me").',
                },
            ],
            sends: [
                PAGEVIEWS,
                {
                    to: 'jsDelivr',
                    what: 'your IP address and browser',
                    why: 'to serve the Chart.js library that draws the charts. Your expenses are never sent.',
                },
            ],
            loads: [GC, { to: 'jsDelivr', what: 'chart.js' }],
            notes: ['This page description claims "no data sent anywhere". The expense data does stay local, but the page does contact jsDelivr and GoatCounter.'],
        },

        '/w/life-on-earth/Life_On_Earth.html': {
            name: 'Life On Earth',
            summary: 'An interactive art piece with ambient sound.',
            stores: [],
            sends: [
                PAGEVIEWS,
                {
                    to: 'Google Fonts',
                    what: 'your IP address, browser, and the address of this page',
                    why: 'to serve the font files.',
                },
            ],
            loads: [GC, { to: 'Google Fonts', what: 'the stylesheet and font files' }],
        },

        '/w/math-game/': {
            name: 'Math Game',
            summary: 'A maths practice game with a scoreboard.',
            stores: [
                {
                    label: 'Your player name and game progress',
                    detail: 'The name you type, your scores, and your preferences, in ' + STORAGE_LOCAL + ' (keys "mathGame", "mathgame.theme", "statsCollapsed").',
                },
            ],
            sends: [
                PAGEVIEWS,
                {
                    to: 'cdnjs',
                    what: 'your IP address and browser',
                    why: 'to serve the Font Awesome icon stylesheet.',
                },
                {
                    to: 'transparenttextures.com',
                    what: 'your IP address and browser',
                    why: 'to serve a background texture image.',
                },
            ],
            loads: [
                GC,
                { to: 'cdnjs', what: 'the Font Awesome stylesheet' },
                { to: 'transparenttextures.com', what: 'a background texture' },
            ],
            notes: ['Your light/dark preference for this game is stored under the key "mathgame.theme", separate from the site-wide theme.'],
        },

        '/w/password-generator/pwd.html': {
            name: 'Password Generator',
            summary: 'Generates passwords locally. Nothing you type is sent anywhere.',
            stores: [
                {
                    label: 'Your light/dark preference for this tool',
                    detail: 'In ' + STORAGE_LOCAL + ' (key "pwdgen.theme"). This is separate from the site-wide theme, which lives under "site-theme".',
                },
            ],
            sends: [PAGEVIEWS],
            loads: [GC],
        },

        '/w/qa-playground/': {
            name: 'QA Playground',
            summary: 'A set of pages for practising test automation. Every page here is a fixture, not a real tool.',
            stores: [],
            sends: [PAGEVIEWS],
            loads: [GC],
        },

        '/w/qr-generator/generator.html': {
            name: 'QR Code Generator',
            summary: 'Generates QR codes in your browser. The text you encode never leaves your device.',
            stores: [],
            sends: [
                PAGEVIEWS,
                {
                    to: 'jsDelivr',
                    what: 'your IP address and browser',
                    why: 'to serve the QR code library. The content of your QR code is never sent.',
                },
            ],
            loads: [GC, { to: 'jsDelivr', what: 'qrcode.min.js' }],
            notes: [
                'This page says "works offline". It works offline once the library has loaded, or if the service worker has cached it — a first visit still needs the network.',
                'It also says "no data is sent to any server or third parties". The QR payload is never sent, but the page does load a script from jsDelivr.',
            ],
        },

        '/w/random-number/random-number.html': {
            name: 'Random Number',
            summary: 'Picks random numbers and rolls dice.',
            stores: [],
            sends: [PAGEVIEWS],
            loads: [GC],
        },

        '/w/reverse-planning/': {
            name: 'Reverse Plan',
            summary: 'Works backwards from an event date to build a schedule.',
            stores: [
                {
                    label: 'Your plan',
                    detail: 'Event names and their durations, in ' + STORAGE_LOCAL + ' (key "timelinePlan").',
                },
            ],
            sends: [PAGEVIEWS],
            loads: [GC],
        },

        '/w/secret-share/': {
            name: 'Secret Share',
            summary: 'Encrypts a message in your browser with a passphrase. The cleanest tool on this site.',
            stores: [],
            sends: [PAGEVIEWS],
            loads: [GC],
            notes: [
                'Your passphrase and plaintext exist only as values in the page. They are never written to storage and never transmitted.',
                'Encryption uses the Web Crypto API — PBKDF2 key derivation into AES-GCM-256 — so the code never leaves the browser either.',
            ],
        },

        '/w/simon-game/': {
            name: 'Simon',
            summary: 'A memory sequence game.',
            stores: [
                {
                    label: 'Your high score',
                    detail: 'In ' + STORAGE_LOCAL + ' (key "simon-high").',
                },
            ],
            sends: [PAGEVIEWS],
            loads: [GC],
        },

        '/w/stock-portfolio-split/': {
            name: 'Portfolio Split',
            summary: 'Splits a share portfolio between two people.',
            stores: [
                {
                    label: 'Your holdings',
                    detail: 'Tickers and amounts, in ' + STORAGE_LOCAL + ' (key "portfolio-holdings").',
                },
            ],
            sends: [
                PAGEVIEWS,
                {
                    to: 'jsDelivr',
                    what: 'your IP address and browser',
                    why: 'to serve Chart.js and its data-label plugin. Your holdings are never sent.',
                },
                {
                    to: 'Google Fonts',
                    what: 'your IP address, browser, and the address of this page',
                    why: 'to serve the font files.',
                },
            ],
            loads: [
                GC,
                { to: 'jsDelivr', what: 'chart.js and chartjs-plugin-datalabels' },
                { to: 'Google Fonts', what: 'the stylesheet and font files' },
            ],
            notes: ['This page’s README claims "no tracking, works offline". The holdings stay local, but the page does contact three CDNs.'],
        },

        '/w/teach-me/': {
            name: 'Teach Me',
            summary: 'Opens a topic in a free AI chat, with no account needed.',
            stores: [],
            sends: [
                PAGEVIEWS,
                {
                    to: 'Google Fonts',
                    what: 'your IP address, browser, and the address of this page',
                    why: 'to serve the font files.',
                },
            ],
            loads: [GC, { to: 'Google Fonts', what: 'the stylesheet and font files' }],
            notes: [
                'The links on this page take you to other providers — Proton, Duck.ai, ChatGPT, Perplexity. Once you follow a link, that provider sees the topic you searched for and applies its own privacy policy.',
                'This page says "nothing is sent from this page". That is true of your choices, but the page does send an anonymous page view to GoatCounter.',
            ],
        },

        '/w/tn-assembly-map/': {
            name: 'Tamil Nadu Assembly Map',
            summary: 'An interactive map of Tamil Nadu governments from 1952 to the present.',
            stores: [],
            sends: [
                PAGEVIEWS,
                {
                    to: 'CARTO',
                    what: 'the map tile coordinates you are looking at, which reveals the area of the map on screen',
                    why: 'to serve the map tiles. Nothing about you is sent beyond the request itself.',
                },
                {
                    to: 'unpkg',
                    what: 'your IP address and browser',
                    why: 'to serve the Leaflet map library.',
                },
                {
                    to: 'cdnjs',
                    what: 'your IP address and browser',
                    why: 'to serve the anime.js animation library.',
                },
            ],
            loads: [
                GC,
                { to: 'unpkg', what: 'leaflet.js and leaflet.css' },
                { to: 'cdnjs', what: 'anime.min.js' },
                { to: 'CARTO', what: 'map tiles' },
            ],
            notes: ['The map data itself — around 1.8 MB of constituency, district, and timeline GeoJSON — is served from this site and is cached by the service worker.'],
        },

        '/w/today-date/': {
            name: "Today's Date",
            summary: 'The current date and time, with Tamil and Gregorian calendars and astronomy.',
            stores: [
                {
                    label: 'Your calendar theme',
                    detail: 'In ' + STORAGE_LOCAL + ' (key "cal-theme").',
                },
            ],
            sends: [PAGEVIEWS],
            loads: [GC],
        },

        '/w/youtube-news/news.html': {
            name: 'YouTube News',
            summary: 'Live streams from Tamil news channels, embedded on the page.',
            stores: [
                {
                    label: 'Your custom stream list',
                    detail: 'The channel IDs you added, in ' + STORAGE_LOCAL + ' (key "yt-news-custom-stream-ids").',
                },
            ],
            sends: [
                {
                    to: 'YouTube',
                    what: 'a request for each video you scroll into view, which tells YouTube that you are watching that stream',
                    why: 'to play the embedded player. The embeds use youtube-nocookie.com, so no persistent YouTube cookie is set.',
                },
            ],
            loads: [{ to: 'YouTube', what: 'embedded players' }],
            notes: [
                'This is the only page on the site that does not use GoatCounter.',
                'A third-party visitor counter used to sit in this page’s footer. It was removed — it told an outside service who visited, which did not earn its place.',
            ],
        },
    };

    // The QA Playground sub-pages are fixtures with no data handling of their
    // own. They are listed explicitly so the check script can verify that
    // every fixture page is covered.
    var QA_SUBPAGES = [
        'accessibility', 'api-mock', 'data-tables', 'downloads', 'dynamic',
        'forms', 'frames', 'inputs', 'interactive', 'nested-frame',
        'accounts',
        'selection', 'shadow-dom', 'storage', 'upload',
    ];

    QA_SUBPAGES.forEach(function (name) {
        // The API fixture is the one QA page that makes a request: it loads
        // a local JSON file to imitate a real API response.
        var isApiMock = name === 'api-mock';

        manifest['/w/qa-playground/' + name + '.html'] = {
            name: 'QA Playground — ' + name,
            summary: 'A test fixture for practising test automation. It is not a real tool and handles no personal data.',
            stores: [],
            sends: [],
            loads: [],
            notes: [
                isApiMock
                    ? 'This fixture makes no external requests — no trackers, no CDNs, no analytics. It loads one JSON file from this site to imitate an API response.'
                    : 'This fixture makes no network requests at all — no trackers, no CDNs, no analytics.',
            ],
        };
    });

    // accounts.html is the one QA fixture that talks to a real backend.
    manifest['/w/qa-playground/accounts.html'] = {
        name: 'QA Playground — accounts',
        summary: 'A real signup and sign-in flow for automation practice, served by a Cloudflare Worker with a 24-hour database.',
        stores: [
            {
                label: 'Your session token',
                detail: 'In ' + STORAGE_LOCAL + ' (key "qa-accounts-token") when you tick "keep me signed in", otherwise in ' + STORAGE_SESSION + ' under the same key. Cleared on sign out, on account delete, and when the account is purged.',
            },
        ],
        // No third party: the API is this same domain (/api/qa), so it is
        // described in the notes rather than listed as an outside party.
        sends: [],
        loads: [],
        notes: [
            'This fixture makes no analytics or third-party requests. Its only network calls go to /api/qa on this same domain — a Cloudflare Worker that answers signup, login, MFA, reset, profile and delete.',
            'Accounts are disposable by design: every non-sandbox account is deleted 24 hours after it was created, together with its sessions. Nothing is emailed, verified or shared.',
            'Do not type a real password here. It is a public practice database, and the five sandbox accounts are listed on the page.',
        ],
    };

    // The storage fixture is the one QA page that deliberately stores things.
    manifest['/w/qa-playground/storage.html'] = {
        name: 'QA Playground — storage',
        summary: 'A test fixture that demonstrates the browser storage APIs.',
        stores: [
            {
                label: 'Two demo values',
                detail: 'A counter in ' + STORAGE_LOCAL + ' (key "qa.local.count") and a saved value (key "qa.saved.value"), plus a counter in ' + STORAGE_SESSION + ' (key "qa.session.count").',
            },
        ],
        sends: [],
        loads: [],
        notes: [
            'This fixture makes no network requests at all — no trackers, no CDNs, no analytics.',
            'It deliberately dumps the whole origin’s ' + STORAGE_LOCAL + ' and ' + STORAGE_SESSION + ' to the screen, so it will show what other tools on this site have stored.',
        ],
    };

    global.SITE_PRIVACY = manifest;

    // ---- Route resolution ------------------------------------------------
    //
    // The manifest is keyed by the route as the site publishes it, but a
    // browser reports the pathname the visitor actually typed, and the
    // homepage links to the FILE form ("w/secret-share/index.html") while
    // the manifest uses the DIRECTORY form ("/w/secret-share/").
    //
    // Both must resolve. The canonical form is: a directory route keeps its
    // trailing slash, a plain file keeps its name, and a directory index
    // collapses to its directory. Everything else is derived from that.

    /** Collapse "/w/foo/index.html" to "/w/foo/" and normalise the rest. */
    global.SITE_PRIVACY.canonical = function (pathname) {
        var p = pathname || '/';
        if (p.charAt(0) !== '/') p = '/' + p;
        if (p.length > 'index.html'.length && p.slice(-'index.html'.length) === 'index.html') {
            p = p.slice(0, p.length - 'index.html'.length);
        }
        return p;
    };

    /** The current page's canonical route. */
    global.SITE_PRIVACY.route = function () {
        // `global` IS `window` in a browser, so global.location is correct
        // there. The fallback keeps it working when the module is loaded in
        // a non-browser context (the check script).
        var loc = global.location || (typeof location !== 'undefined' ? location : null);
        return global.SITE_PRIVACY.canonical((loc && loc.pathname) || '/');
    };

    /**
     * The manifest entry for the current page, or null.
     *
     * Tries the canonical form first, then the equivalent spellings, so a
     * page reached by either URL finds its facts.
     */
    global.SITE_PRIVACY.lookup = function () {
        var route = global.SITE_PRIVACY.route();
        if (manifest[route]) return manifest[route];

        // "/w/foo/" -> "/w/foo" (a manifest keyed without the slash).
        var trimmed = route.length > 1 ? route.replace(/\/$/, '') : route;
        if (manifest[trimmed]) return manifest[trimmed];

        // "/w/foo" -> "/w/foo/" (a manifest keyed with the slash).
        if (trimmed !== '/' && manifest[trimmed + '/']) return manifest[trimmed + '/'];

        // "/w/foo" -> "/w/foo/index.html".
        if (trimmed !== '/' && manifest[trimmed + '/index.html']) return manifest[trimmed + '/index.html'];

        return null;
    };

    // Tell the modal the facts are ready. It may have been waiting, since
    // script execution order depends on how the page loaded them.
    if (typeof global.dispatchEvent === 'function') {
        global.dispatchEvent(new global.Event('site-privacy-ready'));
    }
})(typeof window !== 'undefined' ? window : globalThis);
