/**
 * About / Privacy / Source modal.
 *
 * The privacy content here is PER PAGE, not one global list. Each tool does
 * something different -- some are purely local, one ships gameplay events to
 * PostHog, one embeds YouTube players, one requests map tiles. A single
 * shared banner was wrong on every page it appeared on.
 *
 * The facts live in js/privacy-manifest.js. This file is only the renderer.
 * If a page has no manifest entry the modal says so plainly rather than
 * falling back to a generic claim that might be false.
 *
 * Usage on a page:
 *   <link rel="stylesheet" href="/css/about-privacy.css">
 *   <script src="/js/privacy-manifest.js"></script>
 *   <script src="/js/about-privacy.js" defer></script>
 *   <button class="about-btn" type="button">About &amp; Privacy</button>
 *
 * The trigger is a real <button>, not an <a href="javascript:void(0)">:
 * that keeps it keyboard-focusable, announces itself as a button to screen
 * readers, and works with middle-click and "open in new tab" disabled
 * sensibly.
 */

(function () {
    'use strict';

    var REPO_URL = 'https://github.com/Aravinth-Earth/Aravinth-Earth';
    var ISSUE_URL = REPO_URL + '/issues/new';
    var EMAIL = 'aravinth@332321.xyz';

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function listOfStores(stores) {
        if (!stores || !stores.length) {
            // Careful with the wording here. The theme picker writes a
            // "site-theme" preference on every page that has one, so "this
            // page does not write anything to your device" was not true --
            // it was true of the page's own data, not of the page.
            return '<p class="about-small-text">Nothing of your own. This tool does not store any of your data.</p>';
        }
        return (
            '<ul class="privacy-list">' +
            stores
                .map(function (s) {
                    return (
                        '<li><span class="privacy-label">' +
                        esc(s.label) +
                        '</span> <span class="privacy-detail">' +
                        esc(s.detail) +
                        '</span></li>'
                    );
                })
                .join('') +
            '</ul>'
        );
    }

    function listOfSends(sends) {
        if (!sends || !sends.length) {
            return '<p class="about-small-text">Nothing. This page sends no data off your device.</p>';
        }
        return (
            '<ul class="privacy-list">' +
            sends
                .map(function (s) {
                    return (
                        '<li><span class="privacy-label">To ' +
                        esc(s.to) +
                        ':</span> <span class="privacy-detail">' +
                        esc(s.what) +
                        (s.why ? ' This is ' + esc(s.why) : '') +
                        '</span></li>'
                    );
                })
                .join('') +
            '</ul>'
        );
    }

    function listOfLoads(loads) {
        if (!loads || !loads.length) {
            return '<p class="about-small-text">None. This page loads no third-party resources.</p>';
        }
        return (
            '<ul class="privacy-list">' +
            loads
                .map(function (l) {
                    return (
                        '<li><span class="privacy-label">' +
                        esc(l.to) +
                        '</span> <span class="privacy-detail">serves ' +
                        esc(l.what) +
                        '. They can see your IP address and browser, but receive nothing about how you use this page.</span></li>'
                    );
                })
                .join('') +
            '</ul>'
        );
    }

    function buildModalHTML(entry, route) {
        var sections = [];

        if (entry) {
            sections.push(
                '<section class="about-section">' +
                '<h3>🔒 What this page does with your data</h3>' +
                (entry.name
                    ? '<p class="about-page-name">' + esc(entry.name) + '</p>'
                    : '') +
                '<p class="about-section-intro">' +
                esc(entry.summary || '') +
                '</p>' +
                '<h4 class="about-subheading">Stored on your device</h4>' +
                listOfStores(entry.stores) +
                '<h4 class="about-subheading">Sent off your device</h4>' +
                listOfSends(entry.sends) +
                '<h4 class="about-subheading">Third-party resources this page loads</h4>' +
                listOfLoads(entry.loads) +
                (entry.notes && entry.notes.length
                    ? '<h4 class="about-subheading">Worth knowing</h4><ul class="privacy-list">' +
                      entry.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') +
                      '</ul>'
                    : '') +
                '</section>'
            );
        } else {
            sections.push(
                '<section class="about-section">' +
                '<h3>🔒 What this page does with your data</h3>' +
                '<p class="about-section-intro">This page has not been reviewed yet, so nothing is claimed about it here.</p>' +
                '<p class="about-small-text">If that is a problem, please open an issue and say so.</p>' +
                '</section>'
            );
        }

        // The site-wide preferences. These belong to the site chrome rather
        // than to any one tool, so they are stated once here instead of
        // being repeated on every page's list.
        sections.push(
            '<section class="about-section">' +
            '<h3>🌐 Across the whole site</h3>' +
            '<ul class="privacy-list">' +
            '<li><span class="privacy-label">Your theme choice</span> ' +
            '<span class="privacy-detail">The name of the theme you picked, stored in ' +
            'localStorage under "site-theme". It follows you between tools so the site ' +
            'looks the same everywhere. Clearing your site data removes it.</span></li>' +
            '</ul>' +
            '</section>'
        );

        sections.push(
            '<section class="about-section">' +
            '<h3>📜 Source &amp; Issues</h3>' +
            '<div class="link-group">' +
            '<a href="' + REPO_URL + '" target="_blank" rel="noopener noreferrer" class="about-link">🔗 View Source on GitHub</a>' +
            '<a href="' + ISSUE_URL + '" target="_blank" rel="noopener noreferrer" class="about-link">🐛 Report a Bug</a>' +
            '</div>' +
            '</section>'
        );

        sections.push(
            '<section class="about-section">' +
            '<h3>📧 Contact</h3>' +
            '<div class="link-group">' +
            '<a href="mailto:' + EMAIL + '" class="about-link">✉️ Email: ' + EMAIL + '</a>' +
            '</div>' +
            '</section>'
        );

        return (
            '<div id="about-privacy-modal" class="about-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="about-privacy-title" hidden>' +
            '<div class="about-modal">' +
            '<div class="about-modal-header">' +
            '<h2 id="about-privacy-title">ℹ️ About This Page</h2>' +
            '<button class="about-modal-close" type="button" aria-label="Close dialog">✕</button>' +
            '</div>' +
            '<div class="about-modal-content">' +
            sections.join('') +
            '</div>' +
            '</div>' +
            '</div>'
        );
    }

    function currentEntry() {
        var manifest = window.SITE_PRIVACY;
        if (!manifest) return null;
        if (typeof manifest.lookup === 'function') return manifest.lookup();
        if (typeof manifest.route !== 'function') return null;
        return manifest[manifest.route()] || null;
    }

    // Guards against re-arming the wait below. Without it, every tick of the
    // fallback timer would add another listener and another timer, and a
    // manifest that never arrives would spin forever.
    var initAttempts = 0;
    var MAX_INIT_ATTEMPTS = 2;

    function initializeModal() {
        // The manifest is a separate script and may not have executed yet if
        // it was loaded after this one. Without it we cannot say anything
        // truthful about the page, so wait for it rather than rendering an
        // empty modal that says "not reviewed" for a page that IS reviewed.
        if (!window.SITE_PRIVACY) {
            if (initAttempts >= MAX_INIT_ATTEMPTS) {
                // The manifest never arrived (missing script, blocked
                // request). Render anyway -- the modal will say the page has
                // not been reviewed, which is honest.
                initAttempts++;
                buildModal();
                return;
            }
            initAttempts++;
            window.addEventListener('site-privacy-ready', initializeModal, { once: true });
            setTimeout(initializeModal, 1500);
            return;
        }

        buildModal();
    }

    function buildModal() {
        if (document.getElementById('about-privacy-modal')) return;

        var container = document.createElement('div');
        container.innerHTML = buildModalHTML(currentEntry(), window.SITE_PRIVACY && window.SITE_PRIVACY.route());
        var overlay = container.firstElementChild;
        document.body.appendChild(overlay);

        var closeBtn = overlay.querySelector('.about-modal-close');
        var lastFocused = null;

        function openModal(returnTarget) {
            // Prefer the element that explicitly opened the dialog. Falling
            // back to document.activeElement is unreliable: a programmatic
            // click does not move focus, and Safari does not focus a button
            // on mousedown.
            lastFocused = returnTarget || document.activeElement;
            overlay.hidden = false;
            document.body.classList.add('about-modal-open');
            // The open class sets display:flex, so the dialog only becomes
            // focusable after the class lands. Move focus on the next frame,
            // once the browser has laid the dialog out.
            requestAnimationFrame(function () {
                overlay.classList.add('about-modal-open');
                requestAnimationFrame(function () {
                    closeBtn.focus();
                });
            });
        }

        function closeModal() {
            overlay.classList.remove('about-modal-open');
            document.body.classList.remove('about-modal-open');
            setTimeout(function () {
                overlay.hidden = true;
            }, 200);
            if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
        }

        closeBtn.addEventListener('click', closeModal);

        // Click on the backdrop (not the dialog itself) closes.
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('about-modal-open')) {
                closeModal();
            }
            // Keep focus inside the dialog while it is open.
            if (e.key === 'Tab' && overlay.classList.contains('about-modal-open')) {
                var focusables = overlay.querySelectorAll(
                    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (!focusables.length) return;
                var first = focusables[0];
                var last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });

        // Bind every trigger on the page. This replaces the old
        // `onclick="window.openAboutModal()"` inline handler, which required
        // an <a href="javascript:void(0)"> and was not a real control.
        document.querySelectorAll('.about-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openModal(btn);
            });
        });

        // Backwards compatibility: pages that still call this directly.
        window.openAboutModal = openModal;
        window.closeAboutModal = closeModal;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModal);
    } else {
        initializeModal();
    }
})();
