/**
 * PWA client glue.
 *
 * Responsibilities
 * ----------------
 *  - Register the service worker on every page (the worker is scoped to "/",
 *    so a user who lands directly on /w/some-tool/ gets one too).
 *  - Apply deploys without a manual refresh: when a new worker finishes
 *    installing it is told to take over, and the resulting `controllerchange`
 *    reloads the page so the new assets are actually used.
 *  - Wire the optional ".refresh-btn" control to the same handshake.
 *
 * The cache name is owned by sw.js alone. This script never names a cache; it
 * asks the worker for its version over a MessageChannel when it needs to show
 * or log it.
 */
(function () {
    'use strict';

    if (!('serviceWorker' in navigator)) return;

    var SW_URL = '/sw.js';
    var SCOPE = '/';
    var REPLY_TIMEOUT = 3000;
    var REFRESH_REPLY_TIMEOUT = 800;
    var REFRESH_FALLBACK = 5000;

    var registration = null;
    var reloading = false;
    var refreshing = false;
    var fallbackTimer = null;

    // On the very first visit there is no controller yet. When the first
    // worker activates and claims the page that fires `controllerchange` as
    // well - reloading then would throw away the page the user just opened,
    // so the first claim is ignored.
    var hadController = !!navigator.serviceWorker.controller;

    // -----------------------------------------------------------------
    // Reload
    // -----------------------------------------------------------------

    function reloadPage() {
        if (reloading) return;
        reloading = true;
        if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
        }
        // No argument: the "true" argument of location.reload() has been
        // ignored by browsers for years and only causes confusion.
        window.location.reload();
    }

    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadController) {
            // First worker claiming the page: no reload, the page is already
            // showing the right content.
            hadController = true;
            refreshVersion();
            return;
        }
        // The worker that just took over may be a new generation; ask it for
        // its version so the displayed value stays correct.
        refreshVersion();
        reloadPage();
    });

    // -----------------------------------------------------------------
    // Worker messaging
    // -----------------------------------------------------------------

    /**
     * Send a message to the controlling worker and wait for its answer.
     * Resolves with null when there is no controller, when the worker does
     * not answer, or when the browser has no MessageChannel.
     */
    function askWorker(message, timeout) {
        return new Promise(function (resolve) {
            var controller = navigator.serviceWorker.controller;
            if (!controller || typeof MessageChannel === 'undefined') {
                resolve(null);
                return;
            }

            var channel = new MessageChannel();
            var settled = false;

            var timer = setTimeout(function () {
                if (settled) return;
                settled = true;
                resolve(null);
            }, timeout || REPLY_TIMEOUT);

            channel.port1.onmessage = function (event) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(event.data);
            };

            try {
                controller.postMessage(message, [channel.port2]);
            } catch (err) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(null);
            }
        });
    }

    /** The cache version, as known by the worker. */
    function getVersion() {
        return askWorker({ type: 'GET_VERSION' }).then(function (data) {
            return data && data.version ? data.version : null;
        });
    }

    /** Show the worker's version in the DOM (and log it for debugging). */
    function refreshVersion() {
        return getVersion().then(function (value) {
            if (value) {
                document.documentElement.setAttribute('data-sw-version', value);
                console.info('[pwa] service worker version:', value);
            }
            return value;
        });
    }

    // -----------------------------------------------------------------
    // Update flow
    // -----------------------------------------------------------------

    /**
     * A worker that reaches "installed" while an older worker still controls
     * the page is waiting. Tell it to take over; `controllerchange` then
     * reloads the page with the new assets.
     */
    function watchForActivation(worker) {
        if (!worker) return;
        worker.addEventListener('statechange', function () {
            if (
                worker.state === 'installed' &&
                navigator.serviceWorker.controller
            ) {
                worker.postMessage({ type: 'SKIP_WAITING' });
            }
        });
    }

    function handleRegistration(reg) {
        if (!reg) return;
        registration = reg;

        // A worker may already be waiting (the page was left open across a
        // deploy), so activate it right away.
        if (reg.waiting && navigator.serviceWorker.controller) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        reg.addEventListener('updatefound', function () {
            watchForActivation(reg.installing);
        });
    }

    /**
     * Manual refresh. Pages are served stale-while-revalidate, so the worker
     * is asked to skip its cached copy for the next navigation; otherwise the
     * reload would just show the same old page again.
     */
    function refreshPage() {
        if (refreshing) return;
        refreshing = true;

        var reg = registration;

        // Safety net: if nothing takes over (no new worker, no answer from the
        // current one) the page still gets reloaded.
        fallbackTimer = setTimeout(function () {
            if (!reloading) reloadPage();
        }, REFRESH_FALLBACK);

        askWorker({ type: 'SKIP_WAITING', bypassCache: true }, REFRESH_REPLY_TIMEOUT)
            .then(function () {
                return reg && reg.update ? reg.update() : null;
            })
            .then(function () {
                if (reg) {
                    if (reg.waiting) {
                        // A newer worker is waiting: it will activate, take
                        // over and the controllerchange will reload the page.
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        return;
                    }
                    if (reg.installing) {
                        // An update is still downloading; activate it as soon
                        // as it is installed.
                        watchForActivation(reg.installing);
                        return;
                    }
                }
                // Nothing new to install: the reload below is enough, and the
                // worker will serve the fresh page because of bypassCache.
                reloadPage();
            })
            .catch(function (err) {
                console.warn('[pwa] refresh failed:', err);
                reloadPage();
            })
            .then(function () {
                refreshing = false;
            });
    }

    // -----------------------------------------------------------------
    // Wiring
    // -----------------------------------------------------------------

    function setupRefreshButton() {
        // The button only exists on some pages - do nothing when it is absent.
        var button = document.querySelector('.refresh-btn');
        if (!button) return;

        button.addEventListener('click', function (event) {
            event.preventDefault();
            refreshPage();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupRefreshButton);
    } else {
        setupRefreshButton();
    }

    navigator.serviceWorker
        .register(SW_URL, { scope: SCOPE })
        .then(handleRegistration)
        .catch(function (err) {
            console.warn('[pwa] service worker registration failed:', err);
        });

    // The worker owns the cache name; ask it for the version so it can be
    // shown in the UI or logged for debugging.
    var version = refreshVersion();

    // Small debug surface: window.pwa.version / window.pwa.refresh()
    window.pwa = {
        version: version,
        getVersion: getVersion,
        refresh: refreshPage
    };
})();
