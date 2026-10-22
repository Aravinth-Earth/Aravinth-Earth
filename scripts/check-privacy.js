#!/usr/bin/env node
/**
 * Keep js/privacy-manifest.js honest.
 *
 * A per-page privacy manifest is only worth having if it stays TRUE. This
 * script checks three ways it could rot:
 *
 *   1. COVERAGE  -- every page on the site has an entry. A page with no entry
 *      shows "not yet reviewed" to the user, which is honest but not useful.
 *
 *   2. EGRESS    -- the third parties a page's entry claims it contacts must
 *      actually appear in that page's HTML, CSS, and JS. This catches a
 *      manifest that was updated but the page was not (or the reverse).
 *
 *   3. TRACKERS  -- a page that actually loads a tracker must say so in its
 *      entry. This is the check that would have caught the original bug,
 *      where 9 pages ran GoatCounter with no privacy notice at all.
 *
 * Usage:  node scripts/check-privacy.js
 * Exit code 1 on any violation.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/**
 * Resolve a reference found in a page to a file in the repository.
 *
 * A root-relative reference ("/js/pwa.js") is relative to the SITE ROOT,
 * not to the filesystem root. Resolving it against the filesystem root
 * silently skips it, so a page that started calling a third party from a
 * shared script was never checked.
 */
function resolveRef(dir, raw) {
    const clean = raw.split('#')[0].split('?')[0];
    if (clean.startsWith('/')) return path.join(ROOT, clean);
    return path.resolve(dir, clean);
}

const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'scripts', 'docs', '.github',
]);

// Hosts that identify a party in the manifest. Keyed by the label the
// manifest uses, matched against the host that actually appears in source.
const PARTY_HOSTS = {
    'GoatCounter': ['gc.zgo.at', 'goatcounter.com'],
    'PostHog': ['posthog.com'],
    'Google Fonts': ['fonts.googleapis.com', 'fonts.gstatic.com'],
    'jsDelivr': ['cdn.jsdelivr.net'],
    'unpkg': ['unpkg.com'],
    'cdnjs': ['cdnjs.cloudflare.com'],
    'YouTube': ['youtube.com', 'youtube-nocookie.com', 'youtu.be'],
    'CARTO': ['cartocdn.com'],
    'transparenttextures.com': ['transparenttextures.com'],
};

function walk(dir, out = [], exts = null) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.has(entry.name)) continue;
            walk(full, out, exts);
        } else if (entry.isFile()) {
            if (!exts || exts.has(path.extname(entry.name).toLowerCase())) out.push(full);
        }
    }
    return out;
}

const htmlFiles = walk(ROOT, [], new Set(['.html']));
const textFiles = walk(ROOT, [], new Set(['.js', '.css', '.html']));

/** Route as the site serves it: "/w/foo/index.html" -> "/w/foo/" */
function routeFor(abs) {
    let rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (rel === 'index.html') return '/';
    if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
    return '/' + rel;
}

// --- Load the manifest (it is a browser module; shim the globals it wants).
const MANIFEST_PATH = path.join(ROOT, 'js/privacy-manifest.js');
const manifestSource = fs.readFileSync(MANIFEST_PATH, 'utf8');
const sandbox = { window: {}, location: { pathname: '/' } };
sandbox.window.window = sandbox.window;
new Function('window', 'location', 'globalThis', manifestSource)(
    sandbox.window,
    sandbox.location,
    sandbox.window
);
const manifest = sandbox.window.SITE_PRIVACY;

if (!manifest) {
    console.error('Could not load SITE_PRIVACY from js/privacy-manifest.js');
    process.exit(1);
}

// The manifest object carries helper functions alongside its route keys.
// Only the route keys are entries.
delete manifest.route;
delete manifest.lookup;
delete manifest.canonical;

/**
 * The canonical route for a pathname -- the same normalisation the browser
 * side uses. A directory index collapses to its directory, so
 * "/w/foo/index.html" and "/w/foo/" are the same page.
 */
function canonical(pathname) {
    let p = pathname || '/';
    if (p.charAt(0) !== '/') p = '/' + p;
    if (p.length > 'index.html'.length && p.endsWith('index.html')) {
        p = p.slice(0, p.length - 'index.html'.length);
    }
    return p;
}

const problems = [];
const warnings = [];

// --- 0. The lookup function must resolve every page ----------------------
//
// This is the check that was missing. The manifest was keyed by the
// DIRECTORY form ("/w/secret-share/") while the homepage links to the FILE
// form ("w/secret-share/index.html"). A visitor following a homepage link
// landed on a page whose privacy panel said "not reviewed yet" -- a false
// statement on 13 of 37 pages, including the one that ships gameplay data
// to PostHog.
//
// So: exercise the manifest's own lookup against BOTH spellings of every
// route, using the module exactly as the browser loads it.
{
    const src = fs.readFileSync(path.join(ROOT, 'js/privacy-manifest.js'), 'utf8');
    for (const file of htmlFiles) {
        const rel = path.relative(ROOT, file).split(path.sep).join('/');
        const dirRoute = routeFor(file);

        // The file form: "/w/foo/index.html" and "/w/foo/calc.html".
        const fileRoute = '/' + rel;

        // The directory form: "/w/foo/".
        const dirForm = dirRoute.endsWith('/') ? dirRoute : dirRoute + '/';

        for (const candidate of new Set([fileRoute, dirForm])) {
            const box = { window: { location: { pathname: candidate } }, location: { pathname: candidate } };
            box.window.window = box.window;
            new Function('window', 'location', 'globalThis', src)(box.window, box.location, box.window);
            const m = box.window.SITE_PRIVACY;
            if (!m || typeof m.lookup !== 'function') {
                problems.push(`${candidate}  ->  js/privacy-manifest.js does not expose a lookup() function`);
                break;
            }
            const entry = m.lookup();
            if (!entry) {
                problems.push(
                    `${candidate}  ->  the privacy manifest has no entry (the page would say "not reviewed yet")`
                );
                break;
            }
        }
    }
}

// --- 1. Coverage ---------------------------------------------------------
for (const file of htmlFiles) {
    const route = routeFor(file);
    if (!manifest[route]) {
        problems.push(`${route}  ->  no entry in js/privacy-manifest.js`);
    }
}
for (const route of Object.keys(manifest)) {
    const candidate = route === '/' ? 'index.html' : route.replace(/^\//, '');
    const abs = path.join(ROOT, candidate);
    const exists =
        fs.existsSync(abs) ||
        fs.existsSync(path.join(abs, 'index.html'));
    if (!exists) {
        problems.push(`${route}  ->  manifest entry points at a page that does not exist`);
    }
}

// --- 1b. The manifest must resolve for every URL the site actually links to.
//
// This is the check that was missing. The homepage links to the FILE form
// ("w/secret-share/index.html") while the manifest is keyed by the DIRECTORY
// form ("/w/secret-share/"). A visitor following a homepage link landed on a
// page whose privacy panel said "not reviewed yet" -- a false statement on 13
// of 37 pages, including the one that ships gameplay data to PostHog.
//
// So: take every internal link in the site, resolve it the way the browser
// would, and require the manifest to have an entry for it.
const linkTargets = new Set();
for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);
    const re = /href\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const raw = m[1].trim();
        if (!raw) continue;
        if (/^(https?:)?\/\//i.test(raw)) continue;
        if (/^(mailto:|tel:|data:|javascript:|#)/i.test(raw)) continue;

        // Resolve to a site path, exactly as the browser would.
        let sitePath;
        if (raw.startsWith('/')) {
            sitePath = raw;
        } else {
            const resolved = resolveRef(dir, raw);
            sitePath = '/' + path.relative(ROOT, resolved).split(path.sep).join('/');
        }

        // Only PAGE links matter. An <a href> to a stylesheet or script is
        // not a navigation, and pages do not have privacy entries for them.
        if (!sitePath.endsWith('.html') && !sitePath.endsWith('/')) continue;

        linkTargets.add(sitePath);
    }
}

for (const target of linkTargets) {
    // The root and the 404 are covered by the coverage check above.
    if (target === '/' || target === '/404.html') continue;

    const key = canonical(target);
    const trimmed = key.length > 1 ? key.replace(/\/$/, '') : key;
    const found =
        manifest[key] ||
        manifest[trimmed] ||
        (trimmed !== '/' && manifest[trimmed + '/']) ||
        (trimmed !== '/' && manifest[trimmed + '/index.html']);

    if (!found) {
        problems.push(
            `${target}  ->  the site links to this URL but the privacy manifest has no entry for it`
        );
    }
}

// --- 2 & 3. Egress and tracker truth --------------------------------------
// For each page, gather the hosts it actually references. Page-local assets
// (sibling .js/.css) count too, since a page's behaviour lives in its scripts.
for (const file of htmlFiles) {
    const route = routeFor(file);
    const entry = manifest[route];
    if (!entry) continue;

    const html = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);

    // Collect candidate local sources: the page plus scripts/stylesheets it
    // references that live beside it.
    const localSources = [html];
    const refRe = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = refRe.exec(html)) !== null) {
        const ref = m[1];
        if (/^(https?:)?\/\//i.test(ref)) continue;
        const resolved = resolveRef(dir, ref);
        if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
            const ext = path.extname(resolved).toLowerCase();
            if (ext === '.js' || ext === '.css') {
                // The manifest itself is a list of third parties, so it
                // contains every host name by definition. Following a page
                // reference into it would make every page look like it
                // contacts every third party on the site.
                if (path.resolve(resolved) === MANIFEST_PATH) continue;
                localSources.push(fs.readFileSync(resolved, 'utf8'));
            }
        }
    }

    const haystack = localSources.join('\n');

    // Which parties does this page actually contact?
    const actual = new Set();
    for (const [party, hosts] of Object.entries(PARTY_HOSTS)) {
        for (const host of hosts) {
            if (haystack.includes(host)) {
                actual.add(party);
                break;
            }
        }
    }

    // Which parties does the manifest claim?
    const claimed = new Set();
    for (const s of entry.sends || []) if (s.to) claimed.add(s.to);
    for (const l of entry.loads || []) if (l.to) claimed.add(l.to);

    for (const party of actual) {
        if (!claimed.has(party)) {
            problems.push(
                `${route}  ->  contacts ${party} but the manifest does not mention it (privacy notice is incomplete)`
            );
        }
    }
    for (const party of claimed) {
        if (!actual.has(party)) {
            // An ERROR, not a warning. A manifest that names a third party
            // the page never contacts is making a claim that is untrue, and
            // a reader who believes it is being misled about their data.
            problems.push(`${route}  ->  manifest mentions ${party} but the page does not reference it`);
        }
    }
}

console.log(`Checked ${htmlFiles.length} pages against ${Object.keys(manifest).length} manifest entries.`);

if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s) — manifest may be stale:`);
    for (const w of warnings) console.warn('  ' + w);
    console.warn('');
}

if (problems.length) {
    console.error(`${problems.length} problem(s):\n`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
}

console.log('Every page has a manifest entry, and every entry matches the page\'s actual behaviour.');
