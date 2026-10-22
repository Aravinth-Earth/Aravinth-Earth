#!/usr/bin/env node
/**
 * Verify every page has exactly one <h1>.
 *
 * Why this matters: screen reader users navigate a page by heading level
 * (rotor / H key). A page with no <h1> has no document-level name, and a page
 * with two <h1>s has an ambiguous outline. WCAG 1.3.1 (Info and Relationships)
 * and 2.4.6 (Headings and Labels) are what this is protecting.
 *
 * Usage:  node scripts/check-headings.js
 * Exit code 1 on any violation.
 */

const fs = require('fs');
const path = require('path');
const { stripNonMarkup } = require('./lib/html');

const ROOT = path.resolve(__dirname, '..');

const EXCLUDED_DIRS = new Set([
    'node_modules',
    '.git',
    'scripts',
    'docs',
    '.github',
]);

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

/**
 * Count <h1> elements in the document.
 *
 * Only counts real elements: tags inside <script>/<style> blocks and HTML
 * comments are ignored, so a stylesheet rule like `.error-title { ... }` or a
 * commented-out <h1> is never mistaken for a heading.
 */
function countH1(html) {
    const stripped = stripNonMarkup(html);
    const matches = stripped.match(/<h1\b/gi);
    return matches ? matches.length : 0;
}

/** True when the page has a <title> element with content. */
function hasTitle(html) {
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return !!m && m[1].trim().length > 0;
}

/** True when the document declares a lang. */
function hasLang(html) {
    return /<html[^>]*\slang\s*=\s*["'][a-zA-Z-]+["']/i.test(html);
}

const problems = [];
const pages = walk(ROOT);

for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const rel = path.relative(ROOT, page);
    const h1s = countH1(html);

    if (h1s === 0) {
        problems.push(`${rel}  ->  no <h1> (page has no document-level heading)`);
    } else if (h1s > 1) {
        problems.push(`${rel}  ->  ${h1s} <h1> elements (expected exactly 1)`);
    }

    if (!hasTitle(html)) {
        problems.push(`${rel}  ->  missing or empty <title>`);
    }
    if (!hasLang(html)) {
        problems.push(`${rel}  ->  <html> has no lang attribute`);
    }
}

console.log(`Checked headings on ${pages.length} pages.`);

if (problems.length) {
    console.error(`\n${problems.length} heading problem(s):\n`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
}

console.log('Every page has exactly one <h1>, a title, and a lang attribute.');
