#!/usr/bin/env node
/**
 * Check the document structure of every page.
 *
 * Four things a page can get wrong that no other check looks at:
 *
 *   1. HEADING LEVELS -- a heading that skips a level (h1 then h3) breaks
 *      the outline a screen reader builds, and makes the page look like it
 *      has a section that is missing.
 *   2. DUPLICATE IDS -- the parser keeps the first and drops the rest, so
 *      a <label for>, an aria-labelledby or a #fragment silently points at
 *      the wrong element.
 *   3. IMAGES WITHOUT ALT -- an <img> with no alt is announced as its
 *      filename, or as nothing.
 *   4. BUTTONS WITHOUT A NAME -- a button with no text and no aria-label
 *      is announced as just "button".
 *
 * The QA Playground pages are TEST FIXTURES with deliberate defects of
 * exactly these kinds, so they are excluded.
 *
 * Usage:  node scripts/check-structure.js
 * Exit code 1 on any problem.
 */

const fs = require('fs');
const path = require('path');
const { stripNonMarkup, textOf } = require('./lib/html');

const ROOT = path.resolve(__dirname, '..');

const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'scripts', 'docs', '.github',
]);

// The QA Playground pages deliberately contain broken markup -- they exist
// to be tested against.
const FIXTURE_DIR = 'w/qa-playground/';

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

/** Strip comments, scripts and styles: their contents are not markup. */
function markupOnly(html) {
    return stripNonMarkup(html);
}

/** The page's own scripts, so a form's handler can be found. */
function readScriptSources(file) {
    const html = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);
    const out = [];
    for (const m of html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)) {
        const ref = m[1];
        if (/^(https?:)?\/\//i.test(ref)) continue;
        const clean = ref.split('#')[0].split('?')[0];
        const resolved = clean.startsWith('/')
            ? path.join(ROOT, clean)
            : path.resolve(dir, clean);
        if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
            out.push(fs.readFileSync(resolved, 'utf8'));
        }
    }
    return out.join('\n');
}

function checkPage(html, scriptSources) {
    const problems = [];
    const src = markupOnly(html);

    // --- 1. heading levels ------------------------------------------------
    // The closing tag is matched loosely: a mismatched closing tag (an <h4>
    // closed by </h2>) is itself a defect, and the browser recovers from it
    // in a way that hides the heading from the outline.
    const headings = [...src.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h[1-6]>/gi)];
    let previous = 0;
    for (const [, level, attrs, body] of headings) {
        const text = textOf(body).trim();
        const n = parseInt(level, 10);

        if (!text) {
            problems.push(`an empty <h${n}> heading`);
            continue;
        }
        // A closing tag that does not match its opening tag.
        const closeMatch = body.match(/<\/h([1-6])>/);
        if (closeMatch && parseInt(closeMatch[1], 10) !== n) {
            problems.push(
                `an <h${n}> heading closed by </h${closeMatch[1]}> ("${text.slice(0, 40)}")`
            );
        }
        // A heading may jump UP by more than one level only if the previous
        // heading was lower -- i.e. h1 -> h3 is a skip, h2 -> h1 is fine.
        if (previous && n > previous + 1) {
            problems.push(`heading level skips from h${previous} to h${n} ("${text.slice(0, 40)}")`);
        }
        previous = n;
    }

    // --- 2. duplicate ids -------------------------------------------------
    const ids = [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const seen = new Map();
    for (const id of ids) {
        seen.set(id, (seen.get(id) || 0) + 1);
    }
    for (const [id, count] of seen) {
        if (count > 1) {
            problems.push(`the id "${id}" appears ${count} times (only the first would be reachable)`);
        }
    }

    // --- 3. images without alt --------------------------------------------
    for (const m of src.matchAll(/<img\b([^>]*)>/gi)) {
        const attrs = m[1];
        if (!/\salt\s*=/i.test(attrs)) {
            const srcAttr = (attrs.match(/src="([^"]*)"/i) || [, '?'])[1];
            problems.push(`an <img> with no alt attribute (src="${srcAttr}")`);
        }
    }

    // --- 4. buttons without a name ---------------------------------------
    for (const m of src.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
        const attrs = m[1];
        const body = textOf(m[2]).trim();

        // An image with alt text inside the button names it.
        const imgAlt = (m[2].match(/<img[^>]*alt="([^"]*)"/i) || [, ''])[1].trim();
        // aria-label or aria-labelledby on the button.
        const ariaLabel = (attrs.match(/aria-label="([^"]*)"/i) || [, ''])[1].trim();
        const ariaLabelledBy = /aria-labelledby\s*=\s*["'][^"']+["']/i.test(attrs);
        const title = (attrs.match(/title="([^"]*)"/i) || [, ''])[1].trim();

        if (!body && !imgAlt && !ariaLabel && !ariaLabelledBy && !title) {
            const id = (attrs.match(/id="([^"]*)"/i) || [, '?'])[1];
            problems.push(`a <button> with no accessible name (id="${id}")`);
        }
    }

    // --- 5. a form that submits nowhere -----------------------------------
    // The handler may be attached in a script, so the page's own JS is
    // searched too.
    for (const m of src.matchAll(/<form\b([^>]*)>/gi)) {
        const attrs = m[1];
        if (/\baction\s*=/i.test(attrs)) continue;
        if (/\bonsubmit\s*=/i.test(attrs)) continue;
        // A form that names itself in a submit handler.
        const id = (attrs.match(/id="([^"]*)"/i) || [, ''])[1];
        const handledInScript = id
            ? new RegExp(id + "['\"\\`][^;]{0,80}onsubmit").test(scriptSources) ||
              new RegExp("addEventListener\\(\\s*['\"]submit['\"]").test(scriptSources)
            : false;
        if (handledInScript) continue;
        problems.push(`a <form> with neither an action nor a submit handler (id="${id || '?'}")`);
    }

    return problems;
}

const problems = [];
let pages = 0;

for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (rel.startsWith(FIXTURE_DIR)) continue;
    pages++;

    const html = fs.readFileSync(file, 'utf8');
    for (const p of checkPage(html, readScriptSources(file))) {
        problems.push(`${rel}  ->  ${p}`);
    }
}

console.log(`Checked the structure of ${pages} pages.`);

if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
}

console.log('Every page has a clean heading outline, unique ids, alt text and named buttons.');
