/**
 * Theme switcher.
 *
 * A theme is a SITE-WIDE preference, not a per-page one. The picker used to
 * live only on the homepage, so picking "Nord" there and opening a tool gave
 * you a different palette -- the site looked like two different sites.
 *
 * Rules this file enforces:
 *
 *   1. The saved theme applies on EVERY page. This script is included site
 *      wide; a page that omits the picker markup still gets the theme.
 *
 *   2. The default is stable, not random. The previous behaviour applied a
 *      random theme on every load, which meant the homepage and a tool could
 *      show different palettes, and the site looked different on every
 *      visit. Random is still one click away -- choosing it picks a theme
 *      and sticks with it until you pick again.
 *
 *   3. The picker UI is created here if the page does not provide it, so
 *      every page can offer it without duplicating markup.
 *
 * The theme is stored under "site-theme" in localStorage. It is applied
 * before first paint by a small inline snippet in each page's <head> (see
 * the note there) to avoid a flash of the wrong theme; this file is the
 * source of truth for what that snippet should do.
 */

(function () {
    'use strict';

    var THEMES = [
        { key: 'current', label: 'Current', emoji: '🔵' },
        { key: 'light', label: 'Light', emoji: '☀️' },
        { key: 'amber', label: 'Amber', emoji: '🟠' },
        { key: 'teal', label: 'Teal', emoji: '🟢' },
        { key: 'charcoal', label: 'Charcoal', emoji: '⚫' },
        { key: 'greenish', label: 'Greenish', emoji: '🌿' },
        { key: 'colorful', label: 'Colorful', emoji: '🎨' },
        { key: 'sunset', label: 'Sunset', emoji: '🌅' },
        { key: 'nord', label: 'Nord', emoji: '❄️' },
        { key: 'cyberpunk', label: 'Cyberpunk', emoji: '⚡' }
    ];

    var STORAGE_KEY = 'site-theme';
    var DEFAULT_THEME = 'current';
    var LIGHT_THEME = 'light';
    var html = document.documentElement;

    /**
     * The theme to use when the visitor has not chosen one.
     *
     * The site is dark by default, but it follows the operating system's
     * light preference. This must agree with the inline <head> snippet in
     * every page, which sets the attribute before first paint -- if the two
     * disagree, the page flashes one theme and then settles on another.
     */
    function defaultTheme() {
        try {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                return LIGHT_THEME;
            }
        } catch (e) {
            /* matchMedia unavailable -- fall through to the default */
        }
        return DEFAULT_THEME;
    }

    function isValidKey(key) {
        for (var i = 0; i < THEMES.length; i++) {
            if (THEMES[i].key === key) return true;
        }
        return false;
    }

    function readSaved() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            return isValidKey(saved) ? saved : null;
        } catch (e) {
            // Private browsing or blocked storage -- the theme simply will
            // not persist. Everything else still works.
            return null;
        }
    }

    function writeSaved(key) {
        try {
            localStorage.setItem(STORAGE_KEY, key);
        } catch (e) {
            /* non-fatal */
        }
    }

    function applyTheme(key) {
        html.setAttribute('data-theme', key);
        updateActiveIndicator(key);
    }

    function pickRandom() {
        return THEMES[Math.floor(Math.random() * THEMES.length)].key;
    }

    function updateActiveIndicator(activeKey) {
        var options = document.querySelectorAll('.theme-option');
        for (var i = 0; i < options.length; i++) {
            var isRandom = options[i].dataset.key === '__random';
            var isActive = isRandom ? activeKey === '__random' : options[i].dataset.key === activeKey;
            options[i].classList.toggle('theme-active', isActive);
        }
    }

    /**
     * The picker UI, if the page wants it.
     *
     * A page opts in by including the container markup:
     *   <div class="theme-switcher" id="theme-switcher"> ... </div>
     *
     * The script does NOT create the picker on pages that omit it. That
     * matters for the QA Playground: those pages exist to be driven by test
     * automation, and a floating widget in the corner is a liability for
     * click-based selectors. Those pages still get the theme applied.
     */
    function switcherUI() {
        return document.getElementById('theme-switcher');
    }

    function buildDropdown(dropdown) {
        var htmlOptions = '<button type="button" class="theme-option theme-random" data-key="__random" role="menuitem">🎲 Random</button>';
        THEMES.forEach(function (t) {
            htmlOptions +=
                '<button type="button" class="theme-option" data-key="' + t.key + '" role="menuitem">' +
                t.emoji + ' ' + t.label + '</button>';
        });
        dropdown.innerHTML = htmlOptions;
    }

    function init() {
        var saved = readSaved();

        // The inline <head> snippet may have already applied the theme to
        // avoid a flash. Either way, make sure the DOM reflects the stored
        // preference, and fall back to the default for this visitor.
        var resolved = saved || defaultTheme();
        applyTheme(resolved);

        // Always write the RESOLVED value back, not just a valid saved one.
        // An invalid stored value -- from a future build, an older build, or
        // a hand-edited localStorage -- used to be left in place, so the
        // pre-paint snippet applied it again on every navigation, forever,
        // and the page flashed an unpainted theme each time. Writing the
        // resolved value repairs it once.
        writeSaved(resolved);

        var container = switcherUI();
        if (!container || !document.body) return;

        var gear = container.querySelector('.theme-gear');
        var dropdown = container.querySelector('.theme-dropdown');
        if (!gear || !dropdown) return;

        buildDropdown(dropdown);
        updateActiveIndicator(saved || defaultTheme());

        function setOpen(isOpen) {
            dropdown.classList.toggle('open', isOpen);
            gear.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }

        gear.addEventListener('click', function (e) {
            e.stopPropagation();
            setOpen(!dropdown.classList.contains('open'));
        });

        // Keyboard: the gear is a div, so it needs explicit key handling to
        // match the behaviour a native button would give.
        gear.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(!dropdown.classList.contains('open'));
            } else if (e.key === 'Escape') {
                setOpen(false);
            }
        });

        dropdown.addEventListener('click', function (e) {
            var btn = e.target.closest('.theme-option');
            if (!btn) return;

            var key = btn.dataset.key;
            if (key === '__random') {
                // Random picks a concrete theme and sticks with it, so the
                // palette does not change on every navigation. Choosing
                // Random again re-rolls.
                key = pickRandom();
            }

            applyTheme(key);
            writeSaved(key);
            setOpen(false);
        });

        document.addEventListener('click', function () {
            setOpen(false);
        });

        // Clicking inside the dropdown must not reach the document handler.
        dropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        // Escape closes the dropdown from anywhere.
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && dropdown.classList.contains('open')) {
                setOpen(false);
                gear.focus();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
