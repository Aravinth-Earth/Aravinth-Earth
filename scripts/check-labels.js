#!/usr/bin/env node
/**
 * Audit the form controls for accessible names.
 *
 * A control needs an accessible name: a <label for>, a wrapping <label>,
 * aria-label, aria-labelledby, a title, or (for buttons) text content.
 * A placeholder is NOT an accessible name -- it disappears as soon as the
 * user types, and several screen readers do not announce it.
 *
 * Usage:  node scripts/check-labels.js
 * Exit code 1 if any control has no accessible name.
 *
 * Pass --report to list every control and its state without failing.
 */

const fs = require('fs');
const path = require('path');
const { stripNonMarkup } = require('./lib/html');

const ROOT = path.resolve(__dirname, '..');

const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'scripts', 'docs', '.github',
]);

// Controls whose type is irrelevant to naming.
const SKIP_TYPES = new Set(['hidden', 'submit', 'reset', 'button', 'image']);

// The QA Playground pages are TEST FIXTURES. They deliberately contain
// unlabelled inputs, missing alt attributes, positive tabindex and other
// defects, so that people can practise test automation against something
// real. Reporting them as defects would be wrong -- and "fixing" them would
// destroy the only reason those pages exist.
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

/**
 * Find every control and work out whether it has an accessible name.
 *
 * This is a light parser: it walks the tags in order and tracks whether
 * we are inside a <label>. It is not a full HTML parser, but it is enough
 * to tell "has a name" from "does not", which is what the audit needs.
 */
function audit(html) {
    const problems = [];

    // Remove comments and the contents of script/style, which are not markup.
    const cleaned = stripNonMarkup(html);

    // Every <label for="..."> in the document.
    const labelFor = new Set();
    const labelRe = /<label\b([^>]*)>/gi;
    let m;
    while ((m = labelRe.exec(cleaned)) !== null) {
        const f = m[1].match(/for\s*=\s*["']([^"']+)["']/i);
        if (f) labelFor.add(f[1]);
    }

    // Controls.
    const controlRe = /<(input|textarea|select)\b([^>]*)>/gi;
    while ((m = controlRe.exec(cleaned)) !== null) {
        const tag = m[1].toLowerCase();
        const attrs = m[2];

        const typeAttr = (attrs.match(/type\s*=\s*["']([^"']+)["']/i) || [, 'text'])[1].toLowerCase();
        if (tag === 'input' && SKIP_TYPES.has(typeAttr)) continue;

        const id = (attrs.match(/id\s*=\s*["']([^"']+)["']/i) || [, null])[1];
        const name = (attrs.match(/name\s*=\s*["']([^"']+)["']/i) || [, null])[1];
        const hasAriaLabel = /aria-label\s*=\s*["'][^"']+["']/i.test(attrs);
        const hasAriaLabelledBy = /aria-labelledby\s*=\s*["'][^"']+["']/i.test(attrs);
        const hasTitle = /title\s*=\s*["'][^"']+["']/i.test(attrs);
        const placeholder = (attrs.match(/placeholder\s*=\s*["']([^"']+)["']/i) || [, null])[1];

        // Is this control inside a <label>? Look backwards for an unclosed
        // <label> that is not closed before this control.
        const before = cleaned.slice(0, m.index);
        const lastLabelOpen = before.lastIndexOf('<label');
        const lastLabelClose = before.lastIndexOf('</label>');
        const insideLabel = lastLabelOpen > lastLabelClose;

        const hasName =
            (id && labelFor.has(id)) ||
            insideLabel ||
            hasAriaLabel ||
            hasAriaLabelledBy ||
            hasTitle;

        if (!hasName) {
            problems.push({
                tag,
                type: typeAttr,
                id,
                name,
                placeholder,
                // A placeholder is a hint, not a name.
                placeholderOnly: !!placeholder,
            });
        }
    }

    return problems;
}

const report = process.argv.includes('--report');
const pages = walk(ROOT);
const perPage = [];
const fixtureCounts = [];
let total = 0;

for (const file of pages) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf8');
    const problems = audit(html);
    if (!problems.length) continue;

    if (rel.startsWith(FIXTURE_DIR)) {
        // Counted, but not reported as a defect -- these are intentional.
        fixtureCounts.push({ rel, count: problems.length });
        continue;
    }

    perPage.push({ rel, problems });
    total += problems.length;
}

if (report) {
    console.log(`${total} control(s) with no accessible name, across ${perPage.length} pages:\n`);
    for (const { rel, problems } of perPage.sort((a, b) => b.problems.length - a.problems.length)) {
        console.log(`${rel}  (${problems.length})`);
        for (const p of problems) {
            const what = p.id ? `${p.tag}#${p.id}` : `${p.tag}[name=${p.name || '-'}]`;
            console.log(`    ${what}${p.placeholderOnly ? `  placeholder="${p.placeholder}"` : ''}`);
        }
    }
    if (fixtureCounts.length) {
        const fixtureTotal = fixtureCounts.reduce((s, f) => s + f.count, 0);
        console.log(
            `\n(${fixtureTotal} more in ${fixtureCounts.length} QA Playground fixture pages, ` +
                `which are meant to have them.)`
        );
    }
    process.exit(0);
}

console.log(`Checked the form controls on ${pages.length} pages.`);

if (total) {
    console.error(`\n${total} control(s) with no accessible name:\n`);
    for (const { rel, problems } of perPage) {
        console.error(`  ${rel}:`);
        for (const p of problems) {
            const what = p.id ? `${p.tag}#${p.id}` : `${p.tag}[name=${p.name || '-'}]`;
            console.error(`    ${what}`);
        }
    }
    process.exit(1);
}

console.log('Every form control has an accessible name.');
