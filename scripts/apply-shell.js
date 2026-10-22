#!/usr/bin/env node
/**
 * Apply the shared page shell to every HTML file in the site.
 *
 * WHY THIS IS A SCRIPT AND NOT 37 MANUAL EDITS
 * Every page needs the same four things, and they must be identical across
 * the site or the site stops feeling like one site:
 *
 *   1. the three shared stylesheets, in the order tokens -> base -> themes
 *   2. the anti-flash inline snippet that applies the saved theme before
 *      first paint
 *   3. the shared scripts (pwa, theme-switcher, privacy manifest, modal)
 *   4. the icon and manifest links
 *
 * Doing that by hand means 37 chances to forget one, and the failure is
 * invisible until someone notices a page looks different.
 *
 * The script is idempotent: it detects what is already present and only
 * adds what is missing, so it can be re-run safely.
 *
 * Usage:  node scripts/apply-shell.js
 *         node scripts/apply-shell.js --check   (report drift, exit 1)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// The deployed origin. Used for the absolute URLs the site needs:
// og:url and the canonical link.
const BASE_URL = 'https://www.332321.xyz';

const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'scripts', 'docs', '.github',
]);

// Pages that intentionally do not get the full shell.
// (none currently -- 404.html DOES get it, so the error page matches the
// site it is an error page for.)
const SKIP = new Set();

// The anti-flash snippet. Kept inline and tiny on purpose: it must run
// before the stylesheets paint, and it must not depend on a network fetch.
//
// It sets data-theme to the saved theme, or -- when the visitor has not
// chosen one -- to the theme that matches their OS preference. That last
// part is what stops a first-time visitor with a light-mode operating
// system from seeing a white flash before the site settles on its default.
//
// This MUST agree with js/theme-switcher.js: same key, same light-theme
// name, same OS check. If they disagree, the page paints one theme and
// then switches to another.
const THEME_SNIPPET = `<script>
            /* site-theme:applies-before-paint */
            (function () {
                try {
                    var THEMES = [
                        'current', 'light', 'amber', 'teal', 'charcoal',
                        'greenish', 'colorful', 'sunset', 'nord', 'cyberpunk'
                    ];
                    var saved = localStorage.getItem('site-theme');
                    // Validate before applying. An unknown value would fall
                    // through to the default tokens -- an unpainted page --
                    // and, because the switcher only reads valid keys, it
                    // would never be repaired. The switcher writes the
                    // resolved value back, so an invalid one self-heals.
                    if (saved && THEMES.indexOf(saved) !== -1) {
                        document.documentElement.setAttribute('data-theme', saved);
                    } else if (
                        window.matchMedia &&
                        window.matchMedia('(prefers-color-scheme: light)').matches
                    ) {
                        document.documentElement.setAttribute('data-theme', 'light');
                    } else {
                        document.documentElement.setAttribute('data-theme', 'current');
                    }
                } catch (e) {
                    /* storage unavailable -- the default theme is fine */
                }
            })();
        </script>`;

const STYLESHEETS = [
    '    <link rel="stylesheet" href="/css/tokens.css" />',
    '    <link rel="stylesheet" href="/css/base.css" />',
    '    <link rel="stylesheet" href="/css/themes.css" />',
];

const HEAD_LINKS = [
    '    <link rel="icon" type="image/png" href="/favicon.png" />',
    '    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    '    <link rel="manifest" href="/manifest.json" />',
    // The About/Privacy modal styles. Every page loads about-privacy.js, so
    // every page needs this sheet too -- without it the modal renders
    // unstyled, as a plain block of text in the middle of the page.
    '    <link rel="stylesheet" href="/css/about-privacy.css" />',
];

const SCRIPTS = [
    '    <script src="/js/pwa.js" defer></script>',
    '    <script src="/js/theme-switcher.js" defer></script>',
    '    <script src="/js/privacy-manifest.js" defer></script>',
    '    <script src="/js/about-privacy.js" defer></script>',
];

// The QA Playground pages are automation fixtures. A floating widget in the
// corner is a liability for click-based selectors, so they get the theme
// applied but not the picker.
const NO_PICKER = /\/w\/qa-playground\//;

// The theme picker markup. Injected into pages that do not already have it.
const PICKER_MARKUP = [
    '        <!-- Theme picker. The theme itself is a site-wide preference; see js/theme-switcher.js. -->',
    '        <div class="theme-switcher" id="theme-switcher">',
    '            <div class="theme-gear" role="button" aria-label="Change theme" aria-expanded="false" tabindex="0">⚙</div>',
    '            <div class="theme-dropdown" role="menu"></div>',
    '        </div>',
];

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.has(entry.name)) continue;
            walk(full, out);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            out.push(full);
        }
    }
    return out;
}

function routeFor(abs) {
    let rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (rel === 'index.html') return '/';
    if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
    return '/' + rel;
}

function indentOf(line) {
    const m = line.match(/^\s*/);
    return m ? m[0] : '';
}

/**
 * Insert lines immediately before the line containing `marker`.
 *
 * The block goes BEFORE the marker's own line, which keeps that line's
 * indentation. Callers check for what they are about to add before calling
 * this, so a second run adds nothing.
 */
function insertBefore(html, marker, lines) {
    const idx = html.indexOf(marker);
    if (idx === -1) return null;
    const lineStart = html.lastIndexOf('\n', idx) + 1;
    const indent = indentOf(html.slice(lineStart, idx));
    const block = lines.map((l) => (l.startsWith('    ') ? l : indent + l.trim())).join('\n') + '\n';
    return html.slice(0, lineStart) + block + html.slice(lineStart);
}

function insertAfterLast(html, marker, lines) {
    const idx = html.lastIndexOf(marker);
    if (idx === -1) return null;
    const lineEnd = html.indexOf('\n', idx);
    const at = lineEnd === -1 ? html.length : lineEnd + 1;
    const block = lines.map((l) => (l.startsWith('    ') ? l : l)).join('\n') + '\n';
    return html.slice(0, at) + block + html.slice(at);
}

/**
 * Resolve a link's href against the page's own route, giving the absolute
 * site path it points at.
 *
 * This is what makes the shell idempotent on pages that were written with
 * relative paths. `/css/base.css` and `../../css/base.css` (from a nested
 * page) are the same file, so both must be recognised as the shell's sheet
 * rather than treated as a missing sheet and re-added -- which is how a page
 * ended up with two copies of every stylesheet.
 *
 * Returns null for anything that is not a same-origin path.
 */
function sitePathFor(href, route) {
    if (!href) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return null;
    const clean = href.split('#')[0].split('?')[0];
    if (clean.startsWith('/')) return clean;
    const dir = route.endsWith('/') ? route : route.slice(0, route.lastIndexOf('/') + 1);
    return path.posix.normalize(dir + clean);
}

// The shell's own stylesheets, in the order they must appear. themes.css is
// a pure custom-property re-declaration, so it comes after every consumer --
// including about-privacy.css, which is why that one is listed before it.
const SHELL_SHEETS = [
    { href: '/css/tokens.css', line: STYLESHEETS[0].trim().replace(/^/, '    ') },
    { href: '/css/base.css', line: STYLESHEETS[1].trim().replace(/^/, '    ') },
    { href: '/css/about-privacy.css', line: '    <link rel="stylesheet" href="/css/about-privacy.css" />' },
    { href: '/css/themes.css', line: STYLESHEETS[2].trim().replace(/^/, '    ') },
];

const SHELL_ICONS = [
    { rel: 'icon', line: HEAD_LINKS[0] },
    { rel: 'apple-touch-icon', line: HEAD_LINKS[1] },
    { rel: 'manifest', line: HEAD_LINKS[2] },
];

const SHEET_LINE_RE = /^[ \t]*<link\b[^>]*\brel=["']stylesheet["'][^>]*>[ \t]*$/i;
const ICON_LINE_RE = /^[ \t]*<link\b[^>]*\brel=["'](icon|apple-touch-icon|manifest)["'][^>]*>[ \t]*$/i;
const SCRIPT_LINE_RE = /^[ \t]*<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>[ \t]*<\/script>[ \t]*$/i;

function srcOf(line) {
    const m = line.match(/\bsrc=["']([^"']+)["']/i);
    return m ? m[1] : '';
}

function hrefOf(line) {
    const m = line.match(/\bhref=["']([^"']+)["']/i);
    return m ? m[1] : '';
}

function hrefOfLine(line) {
    const m = line.match(/\b(?:href|src)=["']([^"']+)["']/i);
    return m ? m[1] : '';
}

/**
 * Leave exactly one canonical copy of each shell <link>, and put the shell's
 * stylesheets in the order they require.
 *
 * Rewriting to a canonical line on every run -- rather than skipping when a
 * matching href is present -- is what keeps this idempotent. The earlier
 * version tested `html.includes('/css/base.css')`, which is true for
 * `../../css/base.css`, so a relative page never got the absolute copy; and
 * the stylesheet swap then alternated two tags on every run.
 */
function normalizeHeadLinks(html, route) {
    const seenSheets = new Set();
    const seenIcons = new Set();
    const seenScripts = new Set();
    const out = [];

    for (const line of html.split('\n')) {
        if (SHEET_LINE_RE.test(line)) {
            const target = SHELL_SHEETS.find((s) => sitePathFor(hrefOf(line), route) === s.href);
            if (target) {
                if (seenSheets.has(target.href)) continue;
                seenSheets.add(target.href);
                out.push(target.line);
                continue;
            }
        } else if (ICON_LINE_RE.test(line)) {
            const rel = line.match(/\brel=["']([^"']+)["']/i)[1].toLowerCase();
            const target = SHELL_ICONS.find((i) => i.rel === rel);
            if (target) {
                if (seenIcons.has(target.rel)) continue;
                seenIcons.add(target.rel);
                out.push(target.line);
                continue;
            }
        } else if (SCRIPT_LINE_RE.test(line)) {
            const src = srcOf(line);
            const target = SCRIPTS.find((s) => sitePathFor(src, route) === hrefOfLine(s));
            if (target) {
                const href = hrefOfLine(target);
                if (seenScripts.has(href)) continue;
                seenScripts.add(href);
                out.push(target);
                continue;
            }
        }
        out.push(line);
    }

    const headEnd = () => {
        const i = out.findIndex((l) => /<\/head>/i.test(l));
        return i === -1 ? out.length : i;
    };

    // tokens.css and base.css carry the reset, so they must precede the
    // page's own stylesheet rather than be appended after it.
    const prepend = SHELL_SHEETS
        .filter((s) => (s.href === '/css/tokens.css' || s.href === '/css/base.css') && !seenSheets.has(s.href))
        .map((s) => s.line);
    if (prepend.length) {
        const firstSheet = out.findIndex((l) => SHEET_LINE_RE.test(l));
        out.splice(firstSheet === -1 ? headEnd() : firstSheet, 0, ...prepend);
    }

    // about-privacy.css consumes the tokens, so it goes before themes.css.
    if (!seenSheets.has('/css/about-privacy.css')) {
        const themesAt = out.findIndex(
            (l) => SHEET_LINE_RE.test(l) && sitePathFor(hrefOf(l), route) === '/css/themes.css'
        );
        out.splice(themesAt === -1 ? headEnd() : themesAt, 0,
            SHELL_SHEETS.find((s) => s.href === '/css/about-privacy.css').line);
    }

    // themes.css must be the last stylesheet on the page. Move it rather than
    // re-inserting it blindly, so a page with its own sheets after the shell
    // block keeps its own sheets in front of the theme re-declarations.
    {
        const isThemes = (l) => SHEET_LINE_RE.test(l) && sitePathFor(hrefOf(l), route) === '/css/themes.css';
        const at = out.findIndex(isThemes);
        const line = at === -1 ? SHELL_SHEETS.find((s) => s.href === '/css/themes.css').line : out[at];
        if (at !== -1) out.splice(at, 1);
        const lastSheet = out.reduce((acc, l, i) => (SHEET_LINE_RE.test(l) ? i : acc), -1);
        out.splice(lastSheet === -1 ? headEnd() : lastSheet + 1, 0, line);
    }

    for (const icon of SHELL_ICONS) {
        if (seenIcons.has(icon.rel)) continue;
        out.splice(headEnd(), 0, icon.line);
    }

    // The shared scripts, in one canonical order, at the end of the body.
    // A relative copy (`../../js/about-privacy.js`) and an absolute copy are
    // the same file; keeping both executed the modal twice.
    const bodyEnd = () => {
        const i = out.findIndex((l) => /<\/body>/i.test(l));
        return i === -1 ? out.length : i;
    };
    const missingScripts = SCRIPTS.filter((s) => !seenScripts.has(hrefOfLine(s)));
    if (missingScripts.length) out.splice(bodyEnd(), 0, ...missingScripts);

    return out.join('\n');
}

// The theme snippet must be byte-identical on every page, so it is
// identified by a marker. The marker alone is not enough: an EARLIER
// version of the snippet carried the same marker but applied an
// unvalidated stored theme, so the validation list is what identifies the
// current version.
const THEME_SNIPPET_MARKER = '/* site-theme:applies-before-paint */';
const THEME_SNIPPET_CURRENT = 'var THEMES = [';

const check = process.argv.includes('--check');
const problems = [];
let changed = 0;

/**
 * What a page is missing from the shared shell.
 *
 * This is checked against the ORIGINAL file, before any repair. Checking
 * the repaired file instead would make the check vacuous: every gap it
 * looks for is one its own repair code can fix, so the check would always
 * pass and never catch a drifted page.
 */
function shellGaps(original, route) {
    const gaps = [];

    // Count the shell's own sheets by resolved site path, so a page that
    // already links `../../css/base.css` is not reported as missing it.
    const sheetLines = original.split('\n').filter((l) => SHEET_LINE_RE.test(l));
    const sheetPaths = sheetLines.map((l) => sitePathFor(hrefOf(l), route));
    for (const sheet of SHELL_SHEETS) {
        const count = sheetPaths.filter((p) => p === sheet.href).length;
        if (count === 0) gaps.push(`stylesheet ${sheet.href}`);
        if (count > 1) gaps.push(`${count} copies of ${sheet.href}`);
    }

    if (sheetPaths.length && sheetPaths[sheetPaths.length - 1] !== '/css/themes.css') {
        gaps.push('themes.css is not the last stylesheet');
    }

    // Icons are matched by rel, not by href: a page whose og:image happens
    // to point at /favicon.png used to satisfy an includes('/favicon.png')
    // test and never get the <link rel="icon"> it was missing.
    const iconRels = new Set(
        original.split('\n')
            .filter((l) => ICON_LINE_RE.test(l))
            .map((l) => l.match(/\brel=["']([^"']+)["']/i)[1].toLowerCase())
    );
    for (const icon of SHELL_ICONS) {
        if (!iconRels.has(icon.rel)) gaps.push(`link rel="${icon.rel}"`);
    }

    const scriptSrcs = original
        .split('\n')
        .filter((l) => SCRIPT_LINE_RE.test(l))
        .map((l) => sitePathFor(srcOf(l), route));
    for (const script of SCRIPTS) {
        const src = hrefOfLine(script);
        const count = scriptSrcs.filter((s) => s === src).length;
        if (count === 0) gaps.push(`script ${src}`);
        if (count > 1) gaps.push(`${count} copies of ${src}`);
    }

    // The theme snippet, and it must be the CURRENT one. An earlier version
    // carried the same marker but applied an unvalidated stored theme, so
    // the marker alone is not enough to identify it.
    if (!original.includes(THEME_SNIPPET_CURRENT)) {
        gaps.push('the theme snippet (or it is the old, unvalidated one)');
    }

    // More than one theme snippet means two things are setting data-theme
    // and the later one wins, so the page's behaviour depends on load order.
    const snippetCount = (original.match(/site-theme:applies-before-paint/g) || []).length;
    if (snippetCount > 1) gaps.push(`${snippetCount} theme snippets`);

    if (!NO_PICKER.test(route) && !original.includes('id="theme-switcher"')) {
        gaps.push('the theme picker');
    }

    if (!/rel="canonical"/.test(original)) gaps.push('the canonical link');
    if (!/property="og:url"/.test(original)) gaps.push('og:url');
    if (!/property="og:image" content="https?:\/\//.test(original)) {
        gaps.push('an absolute og:image');
    }
    if (!/property="og:type"/.test(original)) gaps.push('og:type');
    if (!/property="og:description"/.test(original)) gaps.push('og:description');
    if (!/name="twitter:card"/.test(original)) gaps.push('twitter:card');
    if (!/name="twitter:description"/.test(original)) gaps.push('twitter:description');

    // themes.css must be the last stylesheet: it only re-declares custom
    // properties, so it has to come after every sheet that consumes them.
    const linkOrder = [...original.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
    const themeIdx = linkOrder.findIndex((h) => h.endsWith('/css/themes.css'));
    if (themeIdx !== -1 && themeIdx < linkOrder.length - 1) {
        gaps.push('themes.css is not the last stylesheet');
    }

    return gaps;
}

for (const file of walk(ROOT)) {
    const route = routeFor(file);
    if (SKIP.has(route)) continue;

    const original = fs.readFileSync(file, 'utf8');

    if (check) {
        const gaps = shellGaps(original, route);
        if (gaps.length) {
            problems.push(`${route}  ->  ${gaps.join(', ')}`);
        }
        continue;
    }

    let html = normalizeHeadLinks(original, route);

    // --- canonical + og:url ----------------------------------------------
    // The canonical link tells a search engine which URL is the real one;
    // og:url tells a social platform which URL a card belongs to. Both are
    // absolute and per-page, so they cannot live in the shared block.
    {
        // The 404 page is not a real page -- it is served for every missing
        // URL. Its canonical should point at the homepage, or a search
        // engine would try to index the error page. Its og:url, on the other
        // hand, should be its own address: a shared 404 link should not
        // produce a social card claiming to be the homepage.
        const is404 = route === '/404.html';
        const canonicalUrl = is404 ? `${BASE_URL}/` : `${BASE_URL}${route === '/' ? '/' : route}`;
        const ogUrlValue = `${BASE_URL}${is404 ? '/404.html' : route === '/' ? '/' : route}`;

        const canonical = `    <link rel="canonical" href="${canonicalUrl}" />`;
        if (!html.includes('rel="canonical"')) {
            const next = insertBefore(html, '</head>', [canonical]);
            if (next) html = next;
        } else {
            html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, canonical.trim());
        }

        const ogUrl = `    <meta property="og:url" content="${ogUrlValue}" />`;
        if (!html.includes('property="og:url"')) {
            const next = insertBefore(html, '</head>', [ogUrl]);
            if (next) html = next;
        } else {
            html = html.replace(
                /<meta property="og:url" content="[^"]*" \/>/,
                ogUrl.trim()
            );
        }
    }

    // --- social image + site name ----------------------------------------
    // Scrapers fetch the value of og:image exactly as written -- they do
    // not resolve a relative path against the page. A relative og:image
    // means a text-only link card on Facebook, LinkedIn, Slack and X.
    // The same applies to twitter:image.
    {
        const imageUrl = `${BASE_URL}/og-image.png`;

        const ogImage = `    <meta property="og:image" content="${imageUrl}" />`;
        if (!html.includes('property="og:image"')) {
            const next = insertBefore(html, '</head>', [ogImage]);
            if (next) html = next;
        } else {
            // The tag may be written with ">" or "/>" -- match both.
            html = html.replace(
                /<meta property="og:image" content="[^"]*"\s*\/?>/,
                ogImage.trim()
            );
        }

        const twImage = `    <meta name="twitter:image" content="${imageUrl}" />`;
        if (!html.includes('name="twitter:image"')) {
            const next = insertBefore(html, '</head>', [twImage]);
            if (next) html = next;
        } else {
            html = html.replace(
                /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
                twImage.trim()
            );
        }

        // The site name appears in the card chrome, so it should be the same
        // on every page.
        const siteName = `    <meta property="og:site_name" content="Aravinth" />`;
        if (!html.includes('property="og:site_name"')) {
            const next = insertBefore(html, '</head>', [siteName]);
            if (next) html = next;
        }
    }

    // --- og:title / twitter:title match <title> --------------------------
    // A social card shows the og:title, not the <title>. When they differ,
    // the card shows a shorter or vaguer name than the search result does,
    // which is both a worse preview and a hint that the page's metadata was
    // not maintained together.
    {
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
            const raw = titleMatch[1].trim();
            // Keep the page's own entities (&amp; and friends) as they are.
            const ogTitle = `    <meta property="og:title" content="${raw}" />`;
            if (!html.includes('property="og:title"')) {
                const next = insertBefore(html, '</head>', [ogTitle]);
                if (next) html = next;
            } else {
                html = html.replace(
                    /<meta property="og:title" content="[^"]*" \/>/,
                    ogTitle.trim()
                );
            }

            const twTitle = `    <meta name="twitter:title" content="${raw}" />`;
            if (!html.includes('name="twitter:title"')) {
                const next = insertBefore(html, '</head>', [twTitle]);
                if (next) html = next;
            } else {
                html = html.replace(
                    /<meta name="twitter:title" content="[^"]*" \/>/,
                    twTitle.trim()
                );
            }
        }
    }

    // --- the rest of the social card -------------------------------------
    // A card scraped by another server needs these four tags or it degrades:
    // no og:type and some scrapers refuse the card outright, no
    // twitter:card means a bare link instead of a large-image card, and a
    // missing description shows the URL. They are derived from the page's
    // own description, so they cannot drift from what the page says.
    {
        const descMatch = html.match(
            /<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i
        );
        const description = descMatch ? descMatch[2] : null;

        const ensure = (attr, key, value) => {
            const aligned = new RegExp(`<meta\\s+${attr}=(["'])${key}\\1[^>]*?content=(["'])[\\s\\S]*?\\2\\s*/?>`, 'i');
            const line = `    <meta ${attr}="${key}" content="${value}" />`;
            if (aligned.test(html)) {
                html = html.replace(aligned, line.trim());
            } else {
                const next = insertBefore(html, '</head>', [line]);
                if (next) html = next;
            }
        };

        ensure('property', 'og:type', 'website');
        ensure('name', 'twitter:card', 'summary_large_image');
        if (description) {
            ensure('property', 'og:description', description);
            ensure('name', 'twitter:description', description);
        }
    }

    // --- stylesheet order ------------------------------------------------
    // themes.css must be LAST. It only re-declares custom properties, so
    // it has to come after every sheet that CONSUMES them -- otherwise a
    // later sheet's use of a token wins over the theme's value for it.
    //
    // about-privacy.css is a consumer, so it goes before themes.css.
    {
        const linkRe = /^\s*<link rel="stylesheet" href="([^"]+)"\s*\/?>\s*$/gim;
        const links = [];
        let m;
        while ((m = linkRe.exec(html)) !== null) links.push(m[1]);

        const themesIdx = links.findIndex((h) => h.endsWith('/css/themes.css'));
        const apIdx = links.findIndex((h) => h.endsWith('/css/about-privacy.css'));

        if (themesIdx !== -1 && apIdx !== -1 && apIdx > themesIdx) {
            const apLine = html.match(/^\s*<link rel="stylesheet" href="[^"]*about-privacy\.css"[^>]*>\s*$/im)[0];
            const themesLine = html.match(/^\s*<link rel="stylesheet" href="[^"]*themes\.css"[^>]*>\s*$/im)[0];
            html = html.replace(themesLine, '@@THEMES@@');
            html = html.replace(apLine, themesLine);
            html = html.replace('@@THEMES@@', apLine);
        }
    }

    // --- anti-flash theme snippet ---------------------------------------
    // The snippet must be byte-identical on every page, so it is matched by
    // a marker rather than by content: several variants exist in the tree
    // (one with a THEMES allowlist, one with only a saved-theme lookup),
    // and they disagree about the default. Normalise them all to this one.
    //
    // The marker alone is not enough: an EARLIER version of this snippet
    // also carried the marker but applied an unvalidated stored value. So
    // the check looks for the validation list, which only the current
    // version has.
    // Every <script> block that reads the site theme, whatever its shape.
    const themeSnippetRe =
        /[ \t]*<script>(?:(?!<\/script>)[\s\S])*?localStorage\.getItem\('site-theme'\)(?:(?!<\/script>)[\s\S])*?<\/script>[ \t]*\n(?:[ \t]*\n)*/g;

    {
        const snippets = html.match(themeSnippetRe) || [];

        // Drop them all, and the orphaned explanatory comment above them,
        // then put exactly one canonical snippet back.
        if (snippets.length) {
            html = html.replace(themeSnippetRe, '');
            html = html.replace(
                /\n\s*<!--\s*Apply the saved site theme before first paint\.[\s\S]*?-->/g,
                ''
            );
            // Removing the old block leaves the whitespace that surrounded
            // it, so each run would add another blank line. Collapse the
            // runs of blank lines the removal leaves behind.
            html = html.replace(/\n{3,}/g, '\n\n');
        }

        if (!html.includes(THEME_SNIPPET_CURRENT)) {
            const next = insertBefore(html, '</head>', [THEME_SNIPPET]);
            if (next) html = next;
        }
    }

    // --- scripts ---------------------------------------------------------
    for (const script of SCRIPTS) {
        const src = script.match(/src="([^"]+)"/)[1];
        if (!html.includes(src)) {
            const next = insertBefore(html, '</body>', [script]);
            if (next) html = next;
        }
    }

    // --- theme picker -----------------------------------------------------
    if (!NO_PICKER.test(route) && !html.includes('id="theme-switcher"')) {
        const next = insertBefore(html, '</body>', PICKER_MARKUP);
        if (next) html = next;
    }

    if (html === original) continue;

    // --- verify the result ------------------------------------------------
    // In --check mode, report what is actually MISSING rather than "the file
    // changed". The script's job is to leave every page with the same
    // shell; the check is whether they have it.
    if (check) {        const gaps = [];

        for (const link of STYLESHEETS) {
            const href = link.match(/href="([^"]+)"/)[1];
            if (!html.includes(href)) gaps.push(`stylesheet ${href}`);
        }
        for (const link of HEAD_LINKS) {
            const href = link.match(/href="([^"]+)"/)[1];
            if (!html.includes(href)) gaps.push(`link ${href}`);
        }
        for (const script of SCRIPTS) {
            const src = script.match(/src="([^"]+)"/)[1];
            if (!html.includes(src)) gaps.push(`script ${src}`);
        }
        if (!html.includes(THEME_SNIPPET_CURRENT)) {
            gaps.push('the theme snippet (or it is the old, unvalidated one)');
        }
        if (!NO_PICKER.test(route) && !html.includes('id="theme-switcher"')) {
            gaps.push('the theme picker');
        }
        if (!/rel="canonical"/.test(html)) gaps.push('the canonical link');
        if (!/property="og:url"/.test(html)) gaps.push('og:url');
        if (!/property="og:image" content="https?:\/\//.test(html)) {
            gaps.push('an absolute og:image');
        }

        // themes.css must be the last stylesheet.
        const linkOrder = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
        const themeIdx = linkOrder.findIndex((h) => h.endsWith('/css/themes.css'));
        if (themeIdx !== -1 && themeIdx < linkOrder.length - 1) {
            gaps.push('themes.css is not the last stylesheet');
        }

        if (gaps.length) {
            problems.push(`${route}  ->  ${gaps.join(', ')}`);
        }
        continue;
    }

    // Collapse the blank lines the inserts leave behind, so a second run
    // produces byte-identical output.
    html = collapseBlankLines(html);

    if (html === original) continue;
    changed++;
    fs.writeFileSync(file, html);
}

/**
 * Collapse runs of blank lines.
 *
 * Inserting a block leaves the blank line that was around the marker, and
 * several inserts at the same marker stack up. Collapsing keeps the output
 * stable, so running this script twice changes nothing the second time.
 *
 * The blank lines carry the surrounding indentation, so the pattern has to
 * allow whitespace between the newlines -- "\n    \n    \n" is three blank
 * lines, not one.
 */
function collapseBlankLines(text) {
    return text.replace(/(?:[ \t]*\n){3,}/g, '\n\n');
}

if (check) {
    if (problems.length) {
        console.error(`${problems.length} page(s) are missing parts of the shared shell:\n`);
        for (const p of problems) console.error('  ' + p);
        console.error('\nRun: node scripts/apply-shell.js');
        process.exit(1);
    }
    console.log('Every page has the shared shell.');
} else {
    console.log(`Updated ${changed} page(s).`);
}
