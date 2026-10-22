/**
 * Small, linear HTML helpers for the static checks.
 *
 * These are not a parser and not a sanitiser. They run at build time over
 * this repository's own files and never see user input, so their job is
 * only to answer "what markup does this page contain".
 *
 * They are hand-written scanners rather than chains of regular-expression
 * replacements for two reasons:
 *
 *   1. A chain like `.replace(/<!--...-->/g, '').replace(/<script...>/g, '')`
 *      is incomplete: a script tag inside a comment, a nested style block,
 *      or a tag split across lines can survive it and then be counted as
 *      markup. That produced false results in both directions.
 *   2. The same pattern reads to a security scanner as an attempt to
 *      sanitise HTML, which this is not. Scanning once, with an index and a
 *      slice, says what is actually meant: skip this region of the file.
 */

/**
 * Remove HTML comments.
 *
 * An unterminated `<!--` runs to the end of the document, which is how a
 * browser treats it, so the rest of the file is dropped rather than left in.
 */
function stripComments(html) {
    let out = '';
    let i = 0;
    while (i < html.length) {
        const start = html.indexOf('<!--', i);
        if (start === -1) {
            out += html.slice(i);
            break;
        }
        out += html.slice(i, start);
        const end = html.indexOf('-->', start + 4);
        i = end === -1 ? html.length : end + 3;
    }
    return out;
}

/** True when `ch` ends a tag name (`<script>`, `<script src>`, `<script/>`). */
function endsTagName(ch) {
    return ch === undefined || ch === '>' || ch === '/' || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

/**
 * Remove every `<tag>...</tag>` block, case-insensitively.
 *
 * Element names are matched exactly (`<script` does not match `<scripture`)
 * and the closing tag is found by name, so a `</script>` inside a string in
 * a script block still ends the block -- which is what the browser does.
 */
function stripElement(html, tag) {
    const lower = html.toLowerCase();
    const open = '<' + tag;
    const close = '</' + tag;
    let out = '';
    let i = 0;

    while (i < html.length) {
        const start = lower.indexOf(open, i);
        if (start === -1) {
            out += html.slice(i);
            break;
        }
        if (!endsTagName(lower[start + open.length])) {
            // <scripture> is not a script element.
            out += html.slice(i, start + open.length);
            i = start + open.length;
            continue;
        }

        out += html.slice(i, start);

        const openEnd = lower.indexOf('>', start);
        if (openEnd === -1) {
            i = html.length;
            break;
        }

        const closeStart = lower.indexOf(close, openEnd);
        if (closeStart === -1) {
            // Never closed. Browsers treat the remainder as element content.
            i = html.length;
            break;
        }

        const closeEnd = lower.indexOf('>', closeStart);
        i = closeEnd === -1 ? html.length : closeEnd + 1;
    }

    return out;
}

/** Remove comments and the contents of `<script>` and `<style>` blocks. */
function stripNonMarkup(html) {
    return stripElement(stripElement(stripComments(html), 'script'), 'style');
}

/**
 * The text a reader would see: every tag removed, text left in place.
 *
 * Used to decide whether a heading or a button has any text at all. It does
 * not decode entities, because "does this have a name" only needs to know
 * whether anything visible remains.
 */
function textOf(html) {
    let out = '';
    let i = 0;
    while (i < html.length) {
        const lt = html.indexOf('<', i);
        if (lt === -1) {
            out += html.slice(i);
            break;
        }
        out += html.slice(i, lt);
        const gt = html.indexOf('>', lt);
        if (gt === -1) {
            i = html.length;
            break;
        }
        i = gt + 1;
    }
    return out;
}

const ENTITIES = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    '#39': "'",
    apos: "'",
    nbsp: ' ',
};

/**
 * Decode the entities that appear in titles and meta tags, once.
 *
 * Single pass on purpose: decoding `&amp;` and then decoding the result
 * again would turn `&amp;lt;` into `<`, which is not what the page says.
 * Everything this site writes is encoded once.
 */
function decodeEntities(text) {
    if (!text) return text;
    return text.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (match, name) => ENTITIES[name]);
}

module.exports = { stripComments, stripNonMarkup, textOf, decodeEntities };
