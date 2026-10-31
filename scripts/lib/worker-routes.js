/**
 * Paths answered by a Worker route instead of by this repository's asset tree.
 *
 * The site is a static tree, so "does this link resolve?" normally means "is
 * there a file?" -- which is the check that catches a renamed page or a card
 * pointing at a typo. A path served by a Worker has no file here and is still
 * correct, so it has to be named explicitly rather than guessed from the URL
 * shape: a rule like "no extension, so it must be a route" would silently
 * excuse every genuinely broken directory link on the site.
 *
 * Keep this list to paths a Worker really owns, and keep it short. Verifying
 * that the route is live is the deployment check's job, not this file's.
 */

/** Path prefixes, with the trailing slash, exactly as the site links to them. */
const WORKER_ROUTES = ['/w/expense-splitter/'];

/**
 * True when a site path is served by a Worker route.
 *
 * Accepts the slash-less form too, because the Worker also answers it (with a
 * redirect to the slashed form).
 *
 * @param {string} urlPath A site path such as "/w/expense-splitter/".
 * @returns {boolean}
 */
function isWorkerRoute(urlPath) {
    if (!urlPath) return false;
    const withSlash = urlPath.startsWith('/') ? urlPath : '/' + urlPath;
    const normalised = withSlash.endsWith('/') ? withSlash : withSlash + '/';
    return WORKER_ROUTES.some((route) => normalised === route || normalised.startsWith(route));
}

module.exports = { WORKER_ROUTES, isWorkerRoute };
