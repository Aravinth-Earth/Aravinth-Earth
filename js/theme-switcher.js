/**
 * Theme Switcher for 332321.xyz
 * Random theme on each load, user can pick & save a theme.
 */
(function () {
    'use strict';

    const THEMES = [
        { key: 'current',  label: 'Current',   emoji: '🔵' },
        { key: 'amber',    label: 'Amber',      emoji: '🟠' },
        { key: 'teal',     label: 'Teal',       emoji: '🟢' },
        { key: 'charcoal', label: 'Charcoal',   emoji: '⚫' },
        { key: 'greenish', label: 'Greenish',   emoji: '🌿' },
        { key: 'colorful', label: 'Colorful',   emoji: '🎨' },
        { key: 'sunset',   label: 'Sunset',     emoji: '🌅' },
        { key: 'nord',     label: 'Nord',       emoji: '❄️' },
        { key: 'cyberpunk',label: 'Cyberpunk',  emoji: '⚡' }
    ];

    const STORAGE_KEY = 'site-theme';
    const html = document.documentElement;

    // --- Core functions ---

    /** Apply theme to page + save to localStorage (only for explicit picks) */
    function applyTheme(key) {
        html.setAttribute('data-theme', key);
        localStorage.setItem(STORAGE_KEY, key);
        updateActiveIndicator(key);
    }

    /** Apply theme WITHOUT saving (for random / initial load) */
    function applyThemeTransient(key) {
        html.setAttribute('data-theme', key);
        updateActiveIndicator(key);
    }

    function pickRandom() {
        const idx = Math.floor(Math.random() * THEMES.length);
        return THEMES[idx].key;
    }

    function clearToRandom() {
        localStorage.removeItem(STORAGE_KEY);
        applyThemeTransient(pickRandom());
    }

    function updateActiveIndicator(activeKey) {
        document.querySelectorAll('.theme-option').forEach(el => {
            el.classList.toggle('theme-active', el.dataset.key === activeKey);
        });
    }

    // --- Init on load ---

    function init() {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            // User picked a specific theme → apply and persist
            applyTheme(saved);
        } else {
            // No saved theme → random, do NOT save
            applyThemeTransient(pickRandom());
        }

        // Build dropdown if container exists
        const container = document.getElementById('theme-switcher');
        if (!container) return;

        const gear = container.querySelector('.theme-gear');
        const dropdown = container.querySelector('.theme-dropdown');

        // Render options
        let html_options = '<button class="theme-option theme-random" data-key="__random">🎲 Random</button>';
        THEMES.forEach(t => {
            html_options += `<button class="theme-option" data-key="${t.key}">${t.emoji} ${t.label}</button>`;
        });
        dropdown.innerHTML = html_options;

        // Gear click → toggle
        gear.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.toggle('open');
            gear.setAttribute('aria-expanded', isOpen);
        });

        // Option click
        dropdown.addEventListener('click', (e) => {
            const btn = e.target.closest('.theme-option');
            if (!btn) return;

            const key = btn.dataset.key;
            if (key === '__random') {
                clearToRandom();
            } else {
                applyTheme(key);
            }
            dropdown.classList.remove('open');
            gear.setAttribute('aria-expanded', 'false');
        });

        // Click outside → close
        document.addEventListener('click', () => {
            dropdown.classList.remove('open');
            gear.setAttribute('aria-expanded', 'false');
        });

        // Prevent dropdown clicks from closing
        dropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
