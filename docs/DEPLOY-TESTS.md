# Deployment E2E tests

The site's browser tests live in the private repository
[`Aravinth-Earth/test-my-site-cypress`](https://github.com/Aravinth-Earth/test-my-site-cypress).
They are deliberately not part of this public repository's CI: they drive a
real browser against the deployed site, need secrets, and cannot gate a pull
request from a fork.

## Trigger

`E2E after deploy` (`.github/workflows/e2e-after-deploy.yml`) listens for the
successful `github-pages` deployment status:

```
deployment_status  →  state: success, environment: github-pages
```

It then sends a `repository_dispatch` event (`site-deployed`) to the private
test repository. There is no schedule and no push trigger. A manual
`workflow_dispatch` is available for debugging.

The workflow uses `deployment_status` rather than `workflow_run`: the built-in
Pages workflow is a dynamic workflow, and `workflow_run` did not fire for it.
The deployment status carries the deployment SHA, the environment URL, and the
Pages job URL.

The test repository waits for the live site to become ready before starting
Cypress. It polls a cache-busted URL every 10 seconds for up to 10 minutes —
not a fixed sleep.

## Required secret

Create a fine-grained personal access token scoped to
`Aravinth-Earth/test-my-site-cypress` with:

- **Contents: Read and write**

Store it in this repository as:

```
E2E_DISPATCH_TOKEN
```

The private test repository creates and closes its own failure issues with its
own workflow token. It does not need this PAT.

## Cloudflare cache

GitHub Pages serves HTML with `cache-control: max-age=600` and assets with
`max-age=14400`. Without an override, Cloudflare and browsers can keep an old
page after a deploy.

The zone already has these rules in the **Cache settings** ruleset:

- **HTML** — 1 second edge TTL and a browser TTL of 0, plus a Cache Response
  Rule that removes `max-age` and sets `Cache-Control: no-cache,
  must-revalidate`. HTML is effectively always revalidated, so a deploy is
  visible immediately.
- **CSS, JS, JSON** — 60 second edge TTL.
- **`/sw.js`** — bypassed, so service-worker updates are not delayed.
- **`/w/qa-shop/`** — bypassed, because that route is served by a Worker.

The equivalent dashboard setup is:

1. Cloudflare dashboard → select `332321.xyz`
2. **Caching → Cache Rules**
3. HTML rule match:

   ```
   http.request.uri.path.extension eq "html" or
   http.request.uri.path eq "/" or
   ends_with(http.request.uri.path, "/")
   ```

   Settings: **Edge TTL** override to **1 second**, **Browser TTL** override to
   **0 seconds**.

4. In **Caching → Cache Response Rules**, add a rule with the same match and
   action **Modify cache-control**: remove `max-age`, set `no-cache` and
   `must-revalidate`.

The API equivalent is the `http_request_cache_settings` and
`http_response_cache_settings` rulesets.

The deployment workflow can also purge Cloudflare after Pages succeeds. That
is a fallback, not a replacement for the cache rules. To enable it, add:

```
CLOUDFLARE_API_TOKEN   # Zone.Cache Purge
CLOUDFLARE_ZONE_ID
```

If either secret is missing, the purge step is skipped with a warning.

## What runs

The private repository runs the full Cypress suite after each successful
deployment:

- every current page: status, title, one `<h1>`, `lang`, no page errors, no
  failed same-origin requests
- the homepage and every tool's main user flow
- Neithal / Low Tide: landing, motion, language, shelf, toggles, tide, 404,
  mobile
- Timestamp Generator
- 404 page

Cypress Cloud recording is used when `CYPRESS_RECORD_KEY` is present in the
private repository. Deployment runs only; no scheduled runs.
