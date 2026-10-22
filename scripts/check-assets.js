#!/usr/bin/env node
/**
 * Guardrails for the published site:
 *   1. No obvious secrets committed in source.
 *   2. No oversized assets shipped to the browser.
 *
 * Usage:  node scripts/check-assets.js
 * Exit code 1 on any violation.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Anything a browser downloads. Excludes test fixtures and vendored code.
const ASSET_EXT = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.svg',
    '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.mp4', '.webm', '.json', '.csv',
    // HTML too: a page that has been committed with a megabyte of markup
    // would otherwise sail past the budget check.
    '.html',
]);

const EXCLUDED_DIRS = new Set([
    'node_modules', '.git', 'scripts', 'docs', '.github',
]);

// Generous per-extension budgets (bytes).
const SIZE_LIMITS = {
    '.json': 2 * 1024 * 1024,
    '.csv': 1024 * 1024,
    '.mp4': 8 * 1024 * 1024,
    '.mp3': 4 * 1024 * 1024,
    '.webm': 8 * 1024 * 1024,
    '.html': 256 * 1024,
};

const DEFAULT_LIMIT = 1.5 * 1024 * 1024;

// Conservative patterns -- these only fire on values that look like real
// credentials, not on ordinary config keys.
const SECRET_PATTERNS = [
    { re: /AKIA[0-9A-Z]{16}/, label: 'AWS access key id' },
    { re: /ghp_[A-Za-z0-9]{36}/, label: 'GitHub personal access token' },
    { re: /github_pat_[A-Za-z0-9_]{22,}/, label: 'GitHub fine-grained PAT' },
    { re: /sk-[A-Za-z0-9]{32,}/, label: 'OpenAI-style API key' },
    { re: /AIza[0-9A-Za-z_-]{35}/, label: 'Google API key' },
    { re: /xox[baprs]-[A-Za-z0-9-]{10,}/, label: 'Slack token' },
    { re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: 'private key' },
];

const SCAN_EXT = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.html', '.sh', '.yml', '.yaml', '.env', '.txt', '.css']);

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (EXCLUDED_DIRS.has(entry.name)) continue;
            walk(full, out);
        } else if (entry.isFile()) {
            out.push(full);
        }
    }
    return out;
}

const problems = [];
const files = walk(ROOT);

// --- 1. Secret scan -------------------------------------------------------
let scanned = 0;
for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!SCAN_EXT.has(ext)) continue;
    if (file.includes('package-lock.json')) continue;

    const content = fs.readFileSync(file, 'utf8');
    scanned++;
    for (const { re, label } of SECRET_PATTERNS) {
        if (re.test(content)) {
            problems.push(`${path.relative(ROOT, file)}  ->  possible ${label}`);
        }
    }
}

// --- 2. Asset size --------------------------------------------------------
for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!ASSET_EXT.has(ext)) continue;

    const size = fs.statSync(file).size;
    const limit = SIZE_LIMITS[ext] ?? DEFAULT_LIMIT;
    if (size > limit) {
        problems.push(
            `${path.relative(ROOT, file)}  ->  ${(size / 1024 / 1024).toFixed(2)} MB exceeds ${(limit / 1024 / 1024).toFixed(2)} MB limit`
        );
    }
}

console.log(`Scanned ${scanned} source files for secrets; checked asset sizes across ${files.length} files.`);

if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n`);
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
}

console.log('No secrets detected and all assets are within size budgets.');
