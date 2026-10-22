#!/usr/bin/env node
/**
 * Verify the privacy manifest's STORAGE claims against the code.
 *
 * WHY THIS EXISTS
 * The manifest states, per page, which localStorage/sessionStorage/IndexedDB
 * keys the page writes. Those are the claims a reader is most likely to act
 * on ("this page stores nothing"), so they are the ones that must not rot.
 *
 * The egress side of the manifest is checked by check-privacy.js. The
 * storage side had no equivalent, and a stale key name shipped because of
 * it: the Math Game's entry still named the key "theme" after the tool had
 * been changed to write "mathgame.theme".
 *
 * HOW IT WORKS
 * For each page:
 *   1. collect the storage keys the page's own HTML/JS/CSS actually writes
 *   2. collect the keys the manifest entry names
 *   3. report any key the page writes but the manifest does not mention
 *   4. report any key the manifest mentions but the page does not write
 *
 * Usage:  node scripts/check-privacy-storage.js
 * Exit code 1 on any discrepancy.
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

// Keys the shared scripts write on every page. They belong to the site
// chrome, not to the tool, and the manifest discloses them once (on the
// homepage) plus in the modal's own note.
const SHARED_KEYS = new Set(['site-theme']);

// Keys that a tool may legitimately write but that are described in the
// entry's notes rather than its "stores" list.
const NOTE_ONLY_KEYS = new Set([]);

// The shared site scripts. Their constant names are not a tool's, so they
// are excluded when resolving a key that is written through a constant.
const SHARED_SOURCE_MARKERS = ['site-theme:applies-before-paint', 'SITE_PRIVACY'];

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

// --- Load the manifest -----------------------------------------------------
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
delete manifest.route;
delete manifest.lookup;
delete manifest.canonical;

// --- Key extraction --------------------------------------------------------

/** Storage keys written via setItem('key', ...) or localStorage['key'] = ... */
function writtenKeys(source, allSources) {
    const keys = new Set();

    // localStorage.setItem('key', ...) / sessionStorage.setItem('key', ...)
    const setItem = /(?:localStorage|sessionStorage)\s*\.\s*setItem\s*\(\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = setItem.exec(source)) !== null) keys.add(m[1]);

    // localStorage['key'] = ... / sessionStorage.key = ...
    const bracket = /(?:localStorage|sessionStorage)\s*\[\s*['"]([^'"]+)['"]\s*\]\s*=/g;
    while ((m = bracket.exec(source)) !== null) keys.add(m[1]);

    // localStorage.key = 'value'  (property assignment form)
    const prop = /(?:localStorage|sessionStorage)\s*\.\s*([A-Za-z_$][\w$]*)\s*=\s*(?!=)/g;
    while ((m = prop.exec(source)) !== null) {
        // Skip method names and the obvious non-keys.
        if (['setItem', 'getItem', 'removeItem', 'clear', 'key', 'length'].includes(m[1])) continue;
        keys.add(m[1]);
    }

    // Keys written through a variable or a constant rather than a literal.
    //
    //   localStorage.setItem(field, ...)        where field comes from
    //                                            ['year', 'month', ...]
    //   localStorage.setItem(this.STORAGE_KEY)  where STORAGE_KEY = 'dm-lang'
    //   localStorage.setItem(CUSTOM_STREAMS_STORAGE_KEY)
    //
    // These are real writes, so the key has to be resolved or the check
    // would report a false discrepancy.
    //
    // The constant is resolved within the file that USES it, and then from
    // the tool's own sibling files. Resolving it across every file the page
    // loads goes wrong: the shared site scripts are loaded last and define
    // names like STORAGE_KEY for their own purposes, so they would shadow
    // the tool's own definition.

    const constNames = new Map();
    const constRe = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/g;
    const objPropRe = /([A-Za-z_$][\w$]*)\s*:\s*['"]([^'"]+)['"]/g;

    // The file that uses it wins.
    while ((m = constRe.exec(source)) !== null) constNames.set(m[1], m[2]);
    while ((m = objPropRe.exec(source)) !== null) constNames.set(m[1], m[2]);

    // Then the tool's own sibling files, but never the shared site scripts:
    // their constant names are not the tool's.
    for (const src of allSources || []) {
        if (src === source) continue;
        if (SHARED_SOURCE_MARKERS.some((marker) => src.includes(marker))) continue;
        const re = new RegExp(constRe.source, 'g');
        while ((m = re.exec(src)) !== null) {
            if (!constNames.has(m[1])) constNames.set(m[1], m[2]);
        }
    }

    // A setItem whose first argument is a known constant name.
    const constArg = /(?:localStorage|sessionStorage)\s*\.\s*setItem\s*\(\s*(?:this\.)?([A-Za-z_$][\w$]*)\s*[,)]/g;
    while ((m = constArg.exec(source)) !== null) {
        if (constNames.has(m[1])) keys.add(constNames.get(m[1]));
    }

    // 2. A setItem whose first argument is a loop variable over a literal array.
    const arrayRe = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\[([^\]]*)\]/g;
    const arrays = new Map();
    while ((m = arrayRe.exec(source)) !== null) {
        const items = [];
        const itemRe = /['"]([^'"]+)['"]/g;
        let k;
        while ((k = itemRe.exec(m[2])) !== null) items.push(k[1]);
        if (items.length) arrays.set(m[1], items);
    }

    // forEach(field => ... localStorage.setItem(field, ...))
    const forEachRe = /([A-Za-z_$][\w$]*)\s*\.\s*forEach\s*\(\s*([A-Za-z_$][\w$]*)\s*=>/g;
    const loopVars = new Set();
    while ((m = forEachRe.exec(source)) !== null) loopVars.add(`${m[1]}|${m[2]}`);

    const loopArg = /(?:localStorage|sessionStorage)\s*\.\s*setItem\s*\(\s*([A-Za-z_$][\w$]*)\s*[,)]/g;
    while ((m = loopArg.exec(source)) !== null) {
        const varName = m[1];
        // Which array is this variable iterating over? Look for the nearest
        // preceding declaration of the array in the same file.
        for (const [arrName, items] of arrays) {
            if (new RegExp(`\\b${arrName}\\s*\\.\\s*forEach\\s*\\(\\s*${varName}\\s*=>`).test(source)) {
                for (const item of items) keys.add(item);
                break;
            }
        }
    }

    return keys;
}

/** IndexedDB database names, from open('name', ...) or open(DB_NAME, ...) */
function indexedDbNames(source) {
    const names = new Set();
    const re = /indexedDB\s*\.\s*open\s*\(\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = re.exec(source)) !== null) names.add(m[1]);

    // A constant holding the name: const DB_NAME = 'LocalPlannerDB'
    const constRe = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/g;
    const consts = new Map();
    while ((m = constRe.exec(source)) !== null) consts.set(m[1], m[2]);

    const argRe = /indexedDB\s*\.\s*open\s*\(\s*([A-Za-z_$][\w$]*)\s*[,)]/g;
    while ((m = argRe.exec(source)) !== null) {
        if (consts.has(m[1])) names.add(consts.get(m[1]));
    }
    return names;
}

/**
 * Keys the manifest entry names.
 *
 * Rather than parse the sentence, find every quoted string that sits in a
 * KEY CONTEXT -- i.e. right after the word "key" or "keys" (in either
 * order, with the quotes around it). That is how the manifest actually
 * names keys: (key "dm-lang"), keys "a" and "b", the key "site-theme".
 *
 * A bare quoted word elsewhere in the text is prose, not a claim.
 */
function claimedKeys(entry) {
    const keys = new Set();
    const text = [
        ...(entry.stores || []).map((s) => `${s.label} ${s.detail}`),
        ...(entry.notes || []),
    ].join('\n');

    // "key" followed by a quoted string, or a quoted string followed by
    // "key" -- e.g. '"dm-lang" (key', 'key "dm-lang"', 'key "a"'.
    const patterns = [
        // key "name"   /   keys "name"
        /\bkeys?\s*[:：]?\s*['"]([^'"]{1,60})['"]/gi,
        // "name" key   /   "name" (key
        /['"]([^'"]{1,60})['"]\s*\(\s*keys?\b/gi,
        // keys "a", "b", "c"  -- take the first, then the rest
        /\bkeys?\s*[:：]?\s*['"]([^'"]{1,60})['"]((?:\s*(?:,|and)\s*['"]([^'"]{1,60})['"])*)/gi,
    ];

    const add = (v) => {
        if (!v) return;
        const t = v.trim();
        if (!t || /\s/.test(t)) return; // a sentence, not a key
        if (/^https?:/i.test(t)) return;
        keys.add(t);
    };

    for (const re of patterns) {
        let m;
        while ((m = re.exec(text)) !== null) {
            add(m[1]);
            if (m[2]) {
                // The trailing "and "b", "c"" group.
                const rest = m[2].match(/['"]([^'"]{1,60})['"]/g) || [];
                for (const r of rest) add(r.replace(/['"]/g, ''));
            }
        }
    }
    return keys;
}

// --- Check -----------------------------------------------------------------

const problems = [];
const warnings = [];

const htmlFiles = walk(ROOT, [], new Set(['.html']));

for (const file of htmlFiles) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    let route = '/' + rel;
    if (rel === 'index.html') route = '/';
    else if (rel.endsWith('/index.html')) route = '/' + rel.slice(0, -'index.html'.length);

    const entry = manifest[route];
    if (!entry) continue;

    // Gather the page's own sources: the HTML plus any local .js/.css it
    // references, since a page's behaviour lives in its scripts.
    const html = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);
    const sources = [html];

    const refRe = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = refRe.exec(html)) !== null) {
        const ref = m[1];
        if (/^(https?:)?\/\//i.test(ref)) continue;
        const resolved = resolveRef(dir, ref);
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) continue;
        const ext = path.extname(resolved).toLowerCase();
        if (ext !== '.js' && ext !== '.css') continue;
        // The manifest is a list of key names, so it contains every key on
        // the site by definition. Following a page reference into it would
        // make every key look written on every page.
        if (path.resolve(resolved) === MANIFEST_PATH) continue;
        sources.push(fs.readFileSync(resolved, 'utf8'));
    }

    const blob = sources.join('\n');
    // Per file, so a constant is resolved in the file that USES it.
    const actual = new Set();
    for (const src of sources) {
        for (const k of writtenKeys(src, sources)) actual.add(k);
    }
    const dbs = indexedDbNames(blob);
    const claimed = claimedKeys(entry);

    // Keys the page writes that the manifest does not mention.
    for (const key of actual) {
        if (SHARED_KEYS.has(key)) continue;
        if (NOTE_ONLY_KEYS.has(key)) continue;
        if (claimed.has(key)) continue;
        problems.push(
            `${route}  ->  writes localStorage key "${key}" but the privacy manifest does not mention it`
        );
    }

    // Keys the manifest mentions that the page does not write.
    //
    // This is an ERROR, not a warning. A manifest that names a key the page
    // does not write is claiming something untrue, and a claim that is
    // wrong in one direction is wrong in both: the reader is being told
    // about storage that does not happen.
    for (const key of claimed) {
        if (SHARED_KEYS.has(key)) continue;
        if (actual.has(key)) continue;
        // It might be an IndexedDB name rather than a storage key.
        if (dbs.has(key)) continue;
        problems.push(
            `${route}  ->  the manifest mentions key "${key}" but the page does not write it`
        );
    }
}

console.log(`Checked the storage claims of ${htmlFiles.length} pages.`);

if (warnings.length) {
    console.warn(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.warn('  ' + w);
    console.warn('');
}

if (problems.length) {
    console.error(`${problems.length} problem(s):\n`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
}

console.log("Every page's storage claims match the keys it actually writes.");
