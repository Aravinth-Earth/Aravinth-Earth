# Deployment E2E tests

The site's browser tests live in the private repository
[`Aravinth-Earth/test-my-site-cypress`](https://github.com/Aravinth-Earth/test-my-site-cypress).
They are deliberately not part of this public repository's CI: they drive a
real browser against the deployed site, need secrets, and cannot gate a pull
request from a fork.

## Trigger

`E2E after deploy` (`.github/workflows/e2e-after-deploy.yml`) listens for the
successful completion of the GitHub Pages workflow:

```
pages build and deployment
```

It then sends a `repository_dispatch` event (`site-deployed`) to the private
test repository. There is no schedule and no push trigger. A manual
`workflow_dispatch` is available for debugging.

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

GitHub Pages sends `cache-control: max-age=14400` for HTML. Cloudflare honors
that, so `/` and `/404.html` can be four hours stale after a deploy.

The correct fix is a **Cloudflare Cache Rule**:

1. Cloudflare dashboard → select `332321.xyz`
2. **Caching → Cache Rules → Create rule**
3. Name: `Always fresh HTML`
4. Match:

   ```
   http.request.method eq "GET" and (
     http.request.uri.path eq "/" or
     http.request.uri.path eq "/404.html" or
     ends_with(http.request.uri.path, ".html")
   )
   ```

5. Action: **Bypass cache**
6. Save and deploy.

HTML then always comes from GitHub Pages; CSS, JS, and images remain cached.

The deployment workflow can also purge Cloudflare after Pages succeeds. That
is a fallback, not a replacement for the cache rule. To enable it, add:

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
