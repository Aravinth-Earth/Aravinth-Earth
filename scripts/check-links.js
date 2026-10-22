#!/usr/bin/env node
/**
 * Verify every internal link in the site resolves to a file that exists.
 *
 * This catches the class of bug that is invisible locally but breaks in
 * production: a page linking to "/favicon.png" when the file only exists at
 * the repo root, or a "Back to Home" that points at a path that was renamed.
 *
 * Scope: same-origin links only. External URLs are reported as a count but
 * not fetched -- CI should not depend on third-party uptime.
 *
 * Usage:  node scripts/check-links.js
 * Exit code 1 on any broken link.
 */

const fs = require('fs');
const path = require('path');
const { stripComments } = require('./lib/html');

const ROOT = path.resolve(__dirname, '..');
const SITE_ROOT = '/'; // deployed at the domain root, so "/" maps to the repo root

const EXCLUDED_DIRS = new Set([
    'node_modules',
    '.git',
    'scripts',
    'docs',
    '.github',
]);

const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.zip']);

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

/** Extract href/src values that point at this site. */
function extractLocalRefs(html) {
    const refs = [];
    // Strip comments first: a commented-out <script src> is not a live link.
    const stripped = stripComments(html);
    const re = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(stripped)) !== null) {
        const raw = m[1].trim();
        if (!raw) continue;
        if (/^(https?:)?\/\//i.test(raw)) continue; // external
        if (/^(mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
        // A fragment-only link is kept: the target has to exist on the
        // page, and a broken one is a dead link.
        if (raw === '#') continue; // a no-op link
        refs.push({ raw, attr: m[0].startsWith('href') ? 'href' : 'src' });
    }
    return refs;
}

/** Count references that point at another origin. */
function countExternal(html) {
    const stripped = stripComments(html);
    const re = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
    let count = 0;
    let m;
    while ((m = re.exec(stripped)) !== null) {
        if (/^(https?:)?\/\//i.test(m[1].trim())) count++;
    }
    return count;
}

/**
 * Resolve a site-root-relative or relative URL to a file on disk.
 * Returns true when the target exists.
 */
function resolvesToFile(pageAbsPath, rawUrl, pageIds) {
    // Strip query/hash.
    const clean = rawUrl.split('#')[0].split('?')[0];
    if (!clean) {
        // A pure fragment link. The target has to exist on THIS page, so
        // the check has to look at the page's ids rather than at the
        // filesystem.
        const fragment = rawUrl.split('#')[1];
        if (!fragment) return true; // href="#" -- a no-op link
        if (!pageIds) return true; // no id list available
        if (!pageIds.has(fragment)) {
            return `the fragment "#${fragment}" does not match any id on this page`;
        }
        return true;
    }

    let targetPath;
    if (clean.startsWith('/')) {
        // Site-root-relative: "/favicon.png" -> ROOT/favicon.png
        targetPath = path.join(ROOT, clean);
    } else {
        // Document-relative: resolve against the page's own directory.
        targetPath = path.resolve(path.dirname(pageAbsPath), clean);
    }

    // If it looks like a directory request, try index.html inside it.
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
        return fs.existsSync(path.join(targetPath, 'index.html'));
    }
    if (fs.existsSync(targetPath)) return true;

    // A URL with no extension is likely a directory route served by Pages.
    if (!path.extname(clean)) {
        return fs.existsSync(path.join(targetPath, 'index.html'));
    }
    return false;
}

const pages = walk(ROOT);
const problems = [];
let checked = 0;
let external = 0;

for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const rel = path.relative(ROOT, page);
    external += countExternal(html);
    // The ids on this page, so an in-page fragment can be checked.
    const pageIds = new Set(
        [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
    );
    for (const ref of extractLocalRefs(html)) {
        checked++;
        const verdict = resolvesToFile(page, ref.raw, pageIds);
        if (verdict !== true) {
            problems.push(`${rel}  ->  ${ref.raw}  (${ref.attr})  ${verdict}`);
        }
    }
}

console.log(`Checked ${checked} local references across ${pages.length} pages (${external} external skipped).`);

if (problems.length) {
    console.error(`\n${problems.length} broken internal link(s):\n`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
}

console.log('All internal links resolve.');
