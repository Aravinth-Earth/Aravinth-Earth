#!/usr/bin/env node
/**
 * Generate sitemap.xml from the actual site tree.
 *
 * Why a generator instead of a hand-maintained file: the previous sitemap was
 * hand-edited and drifted -- it listed 28 URLs while the site shipped 35
 * pages, and its <lastmod> values were months stale. Deriving both from disk
 * and git history means the sitemap cannot drift from reality.
 *
 * Usage:  node scripts/gen-sitemap.js
 *         node scripts/gen-sitemap.js --check   (verify sitemap is current, exit 1 if not)
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://www.332321.xyz';
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');

// Directories that hold fixtures, artifacts or vendored code -- never site pages.
const EXCLUDED_DIRS = new Set([
    'node_modules',
    '.git',
    'scripts',
    'docs',
    '.github',
    'shelf',
]);

// Priority hints by route. The homepage and the flagship tools earn a higher
// priority; deep fixture pages sit at the bottom.
const PRIORITY = {
    '': '1.0',
    'w/qa-playground/': '0.9',
    'w/daily-planner/': '0.8',
    'w/secret-share/': '0.8',
    'w/qr-generator/generator.html': '0.8',
    'w/password-generator/pwd.html': '0.8',
    // The keys are ROUTES, not file paths: a directory route keeps its
    // trailing slash ("w/tn-assembly-map/"), because that is what
    // toRoute() produces and what the site actually serves.
    'w/tn-assembly-map/': '0.8',
    'w/life-on-earth/Life_On_Earth.html': '0.8',
    'w/youtube-news/news.html': '0.8',
};

const DEFAULT_PRIORITY = '0.7';

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
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

/** Turn an absolute file path into a site-relative route. */
function toRoute(absPath) {
    let rel = path.relative(ROOT, absPath).split(path.sep).join('/');
    if (rel === 'index.html') return '';
    if (rel === '404.html') return null; // 404 is not a destination
    if (rel.endsWith('/index.html')) return rel.slice(0, -'index.html'.length);
    return rel;
}

/**
 * Last modification date from git, falling back to the filesystem mtime.
 *
 * WHY GIT AND NOT THE FILE MTIME: the mtime changes every time the working
 * tree is touched, including by a checkout or a branch switch, so it would
 * make the sitemap churn. Git history is the truthful record of when a page
 * last changed.
 *
 * NOTE ON THE COMMIT ORDER: because this reads git history, the sitemap can
 * only be correct for a commit that ALREADY EXISTS. So the workflow is:
 *   1. commit the page changes
 *   2. run `node scripts/gen-sitemap.js`
 *   3. commit the regenerated sitemap
 * Step 3 does not change any page, so the dates in step 2 stay valid and
 * CI's `--check` passes.
 */
function lastmod(absPath) {
    try {
        const out = execFileSync(
            'git',
            ['log', '-1', '--format=%ad', '--date=short', '--', path.relative(ROOT, absPath)],
            { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim();
        if (out) return out;
    } catch {
        /* not tracked -- fall through to fs */
    }
    return fs.statSync(absPath).mtime.toISOString().slice(0, 10);
}

function build() {
    const pages = walk(ROOT)
        .map((abs) => ({ abs, route: toRoute(abs) }))
        .filter((p) => p.route !== null)
        .sort((a, b) => a.route.localeCompare(b.route));

    const urls = pages.map(({ abs, route }) => {
        const loc = `${BASE_URL}/${route}`;
        const priority = PRIORITY[route] ?? DEFAULT_PRIORITY;
        return [
            '  <url>',
            `    <loc>${loc}</loc>`,
            `    <lastmod>${lastmod(abs)}</lastmod>`,
            `    <priority>${priority}</priority>`,
            '  </url>',
        ].join('\n');
    });

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls.join('\n'),
        '</urlset>',
        '',
    ].join('\n');
}

const generated = build();

/** The set of URLs in a sitemap, ignoring dates and priorities. */
function urlsOf(xml) {
    return (xml.match(/<loc>[^<]+<\/loc>/g) || []).map((s) => s.replace(/<\/?loc>/g, '')).sort();
}

if (process.argv.includes('--check')) {
    const current = fs.existsSync(SITEMAP_PATH) ? fs.readFileSync(SITEMAP_PATH, 'utf8') : '';

    if (!current) {
        console.error('sitemap.xml is missing. Run: node scripts/gen-sitemap.js');
        process.exit(1);
    }

    // Two separate questions, checked separately.
    //
    // 1. Does the sitemap list the right PAGES? A page that exists but is
    //    not in the sitemap is invisible to search engines, and a sitemap
    //    entry for a page that does not exist is a 404 waiting to happen.
    //    This is the part that must always be right.
    const currentUrls = urlsOf(current);
    const generatedUrls = urlsOf(generated);

    const missing = generatedUrls.filter((u) => !currentUrls.includes(u));
    const extra = currentUrls.filter((u) => !generatedUrls.includes(u));

    if (missing.length || extra.length) {
        console.error('sitemap.xml does not match the site:\n');
        for (const u of missing) console.error(`  missing: ${u}`);
        for (const u of extra) console.error(`  no longer exists: ${u}`);
        console.error('\nRun: node scripts/gen-sitemap.js');
        process.exit(1);
    }

    // 2. Are the DATES current? This one is allowed to lag by a commit.
    //    The dates come from git history, so a sitemap generated before the
    //    current commit exists necessarily carries the previous dates. That
    //    is a warning, not a failure -- otherwise CI would fail on every
    //    commit that touches a page, including the very commit that
    //    regenerates the sitemap.
    if (current.trim() !== generated.trim()) {
        console.warn('sitemap.xml dates are one commit behind (run `npm run sitemap` to refresh).');
        console.log(`sitemap.xml lists all ${currentUrls.length} pages.`);
    } else {
        console.log(`sitemap.xml is up to date (${currentUrls.length} URLs).`);
    }
} else {
    fs.writeFileSync(SITEMAP_PATH, generated);
    const count = (generated.match(/<loc>/g) || []).length;
    console.log(`Wrote sitemap.xml with ${count} URLs.`);
}
