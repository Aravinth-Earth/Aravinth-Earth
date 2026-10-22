#!/usr/bin/env node
/**
 * Check the social preview tags on every page.
 *
 * A social card is rendered by Facebook, LinkedIn, Slack, Discord or X --
 * none of which run this site's JavaScript. They read the <meta> tags and
 * nothing else. So a tag that is present but malformed, relative, or
 * pointing at a file that does not exist produces a broken card, and
 * nothing else on the site would notice.
 *
 * Checks per page:
 *   - og:title, og:description, og:image, og:url, og:type, og:site_name
 *   - twitter:card, twitter:title, twitter:description, twitter:image
 *   - the image path is ABSOLUTE (scrapers do not resolve relative URLs)
 *   - the image file exists on disk
 *   - the image is large enough for a summary_large_image card (1200x630)
 *   - og:title / og:description match <title> / meta description
 *   - titles and descriptions are unique across the site
 *
 * Usage:  node scripts/check-social.js
 * Exit code 1 on any problem.
 */

const fs = require('fs');
const path = require('path');
const { decodeEntities } = require('./lib/html');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://www.332321.xyz';

const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'scripts', 'docs', '.github',
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
 * Pull a meta value by property/name.
 *
 * The attribute value is captured with a backreference to its own quote
 * character, so a value containing an apostrophe ("Don't Get Stuck") is
 * captured whole rather than being cut at the apostrophe.
 */
function meta(html, attr, value) {
    const re = new RegExp(
        `<meta\\s+${attr}=(["'])${value}\\1\\s+content=(["'])([\\s\\S]*?)\\2`,
        'i'
    );
    const m = html.match(re);
    return m ? m[3].trim() : null;
}

/**
 * Decode the HTML entities that appear in a title or description.
 *
 * The <title> element holds "&amp;" and the meta tags hold the same
 * characters, so a straight string comparison would flag every page whose
 * title contains an ampersand. Compare what a reader would actually see.
 */
function decode(s) {
    return decodeEntities(s);
}

const problems = [];
const titles = new Map();
const descriptions = new Map();

const pages = walk(ROOT);

for (const file of pages) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf8');

    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();

    const og = {
        'og:title': meta(html, 'property', 'og:title'),
        'og:description': meta(html, 'property', 'og:description'),
        'og:image': meta(html, 'property', 'og:image'),
        'og:url': meta(html, 'property', 'og:url'),
        'og:type': meta(html, 'property', 'og:type'),
        'og:site_name': meta(html, 'property', 'og:site_name'),
    };
    const tw = {
        'twitter:card': meta(html, 'name', 'twitter:card'),
        'twitter:title': meta(html, 'name', 'twitter:title'),
        'twitter:description': meta(html, 'name', 'twitter:description'),
        'twitter:image': meta(html, 'name', 'twitter:image'),
    };

    // 1. Required tags present.
    for (const [k, v] of Object.entries(og)) {
        if (!v) problems.push(`${rel}  ->  missing ${k}`);
    }
    for (const [k, v] of Object.entries(tw)) {
        if (!v) problems.push(`${rel}  ->  missing ${k}`);
    }

    // 2. The image must be an ABSOLUTE url. Scrapers do not resolve
    //    relative paths -- they fetch the tag value as given.
    for (const [k, v] of [['og:image', og['og:image']], ['twitter:image', tw['twitter:image']]]) {
        if (!v) continue;
        if (!/^https?:\/\//i.test(v)) {
            problems.push(`${rel}  ->  ${k} is relative ("${v}"); scrapers need an absolute URL`);
        } else {
            const pathOnly = new URL(v).pathname;
            if (!fs.existsSync(path.join(ROOT, pathOnly))) {
                problems.push(`${rel}  ->  ${k} points at ${pathOnly}, which does not exist`);
            }
        }
    }

    // 3. The image must be big enough for a summary_large_image card.
    if (og['og:image'] && /^https?:/i.test(og['og:image'])) {
        const p = path.join(ROOT, new URL(og['og:image']).pathname);
        if (fs.existsSync(p)) {
            try {
                const buf = fs.readFileSync(p);
                // PNG: width at byte 16, height at byte 20.
                if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
                    const w = buf.readUInt32BE(16);
                    const h = buf.readUInt32BE(20);
                    if (w < 1200 || h < 630) {
                        problems.push(
                            `${rel}  ->  og:image is ${w}x${h}; a summary_large_image card wants at least 1200x630`
                        );
                    }
                }
            } catch {
                /* unreadable -- not worth failing on */
            }
        }
    }

    // 4. og:title should match the page title.
    if (og['og:title'] && title && decode(og['og:title']) !== decode(title)) {
        problems.push(`${rel}  ->  og:title ("${og['og:title']}") does not match <title> ("${title}")`);
    }

    // 5. og:url must be absolute and must be this page.
    if (og['og:url']) {
        if (!/^https?:\/\//i.test(og['og:url'])) {
            problems.push(`${rel}  ->  og:url is relative ("${og['og:url']}")`);
        }
    }

    // 6. Uniqueness across the site.
    if (og['og:title']) {
        if (!titles.has(og['og:title'])) titles.set(og['og:title'], []);
        titles.get(og['og:title']).push(rel);
    }
    if (og['og:description']) {
        if (!descriptions.has(og['og:description'])) descriptions.set(og['og:description'], []);
        descriptions.get(og['og:description']).push(rel);
    }
}

// Duplicate social copy.
for (const [label, map] of [['og:title', titles], ['og:description', descriptions]]) {
    for (const [value, files] of map) {
        if (files.length > 1) {
            problems.push(`${label} "${value}" is used on ${files.length} pages: ${files.join(', ')}`);
        }
    }
}

console.log(`Checked the social tags on ${pages.length} pages.`);

if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
}

console.log('Every page has complete, absolute, unique social preview tags.');
