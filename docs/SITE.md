<!--
  Deliberately NOT named README.md and NOT in the repository root.

  This repository is named after the account (Aravinth-Earth/Aravinth-Earth),
  and GitHub renders that repository's README as the GitHub profile README.
  Its README resolver looks in the root, .github/ and docs/, so a README.md
  anywhere in that chain ends up on the profile. This file is the site's
  documentation instead.
-->

# Aravinth's Site

Personal site and tool collection for [Aravinth](https://www.332321.xyz) — a builder of tools, games, and privacy-first software.

Live site: **https://www.332321.xyz** · Source: [Aravinth-Earth/Aravinth-Earth](https://github.com/Aravinth-Earth/Aravinth-Earth)

---

## What this is

A collection of small, self-contained web tools — a calculator, a secret-sharing tool, a QR generator, a Tamil Nadu assembly map, a QA playground for practising test automation, and more. Each tool lives in its own folder under `w/` and is a plain, dependency-free HTML page.

There is **no build step**. No bundler, no framework, no npm runtime dependencies. The repository *is* the deployable artifact: push to the `site` branch and GitHub Pages serves it.

That constraint is deliberate. It keeps the whole site auditable in a few thousand lines of readable HTML/CSS/JS, keeps it fast, and means each tool can be copied out of the repo and used on its own.

## Repository layout

```
index.html              Home page — the tool directory
404.html                Single error entry (also the offline fallback)
sw.js                   Service worker: caching + offline strategy
manifest.json           PWA manifest
robots.txt              Crawler policy
sitemap.xml             Generated — do not hand-edit

css/
  tokens.css            Design tokens: the single source of truth
  base.css              Shared primitives (buttons, cards, forms, focus rings)
  style.css             Home page styles
  themes.css            Theme definitions (9 themes, token remapping)
  about-privacy.css     About/Privacy modal styles

js/
  pwa.js                Service worker registration + update flow
  theme-switcher.js     Theme picker
  about-privacy.js      About/Privacy modal

scripts/                Static checks for this repository (not shipped to users)
  gen-sitemap.js        Regenerates sitemap.xml from the file tree
  apply-shell.js        Applies the shared page shell to every page
  check-links.js        Verifies every internal link resolves
  check-headings.js     Verifies one <h1> per page
  check-privacy.js      Verifies the privacy manifest matches page behaviour
  check-privacy-storage.js
                        Verifies the manifest's storage key names match
  check-social.js       Verifies the social preview tags on every page
  check-labels.js       Verifies every form control has an accessible name
  check-structure.js    Verifies headings, ids, alt text and named buttons
  check-assets.js       Secret scan + asset size budgets
  sw-logic-test.js      Tests the worker's logic in a Node VM (no browser)
  verify-checks.sh      Proves each check fails when it should

w/                      The tools
  qa-playground/        Test-automation practice pages
  daily-planner/        Local-first task planner
  tn-assembly-map/      Tamil Nadu government timeline map
  ...

.github/workflows/ci.yml
                        CI: static checks
```

## Development

There is nothing to build. One thing to know:

> **Open the site through a server, not by double-clicking `index.html`.**
> The pages use root-relative paths (`/css/tokens.css`) so that the service
> worker can control the whole origin and every page can live at a different
> depth. Under the `file://` protocol those paths resolve to the *filesystem
> root*, so every stylesheet and script 404s and the page renders unstyled.
> The service worker and the PWA manifest cannot work over `file://` at all.

Use any static server. There is nothing to install and nothing to build:

```bash
python3 -m http.server 8081     # then open http://localhost:8081
npx http-server . -p 8081       # equivalently
```

Local servers do not always reproduce the deployed site's missing-path
behaviour: production serves `404.html` for unknown URLs.

> **Service worker note:** it only registers over `http://localhost` or
> HTTPS. When you want to test fresh content rather than the cached copy,
> use the site's refresh button (↻), which asks the service worker to
> activate the newest version.

## Quality checks

The same checks CI runs, available locally:

```bash
npm run check           # all static checks
```

Individually:

```bash
node scripts/gen-sitemap.js --check   # sitemap is current
node scripts/check-links.js           # internal links and in-page fragments resolve
node scripts/check-headings.js        # one <h1> per page
node scripts/check-structure.js       # heading outline, unique ids, alt text, named buttons
node scripts/check-labels.js          # every form control has an accessible name
node scripts/check-privacy.js         # privacy manifest matches reality
node scripts/check-privacy-storage.js # the manifest's storage key names match the code
node scripts/check-social.js          # social preview tags are complete and absolute
node scripts/check-assets.js          # no secrets, assets within budget
node scripts/sw-logic-test.js         # the worker's logic, in a Node VM
node scripts/apply-shell.js --check   # every page has the shared shell
```

`scripts/verify-checks.sh` proves those checks work: it breaks each one in a
copy of the repository and confirms the check catches it. Run it after
changing a check — a check that cannot fail is worse than no check at all.

```bash
bash scripts/verify-checks.sh
```

To regenerate the sitemap after adding or removing a page:

```bash
node scripts/gen-sitemap.js
```

`lastmod` values are read from git history, so they stay accurate automatically.

### Browser and end-to-end tests

Tests that drive a browser, a device, or the deployed site live in the
separate test repository, **test-my-site-cypress**. That includes the Cypress
functional suites, the headless-browser checks (modal, service worker, theme,
overlap), and the Maestro flows.

They are not part of this repository's CI on purpose: they test the deployed
artifact rather than this source tree, they need browsers and secrets, and a
private check cannot gate a pull request from a fork. Everything that *can* be
verified statically is in `npm run check` above and runs before merge.

### The shared page shell

Every page gets the same four things from `scripts/apply-shell.js`: the three
shared stylesheets in the right order, the anti-flash theme snippet, the
shared scripts, and the icon links. The script is idempotent and it is
enforced in CI:

```bash
node scripts/apply-shell.js            # apply (idempotent)
node scripts/apply-shell.js --check    # verify, exit 1 on drift
```

Running it by hand is rarely needed, but it is the fastest way to bring a new
page in line with the rest of the site.

## Design conventions

**Tokens over literals.** Colors, spacing, radii, and type scale live in `css/tokens.css`. Components reference `var(--accent)`, never a hex value. This is what lets a single theme switch repaint the entire site, and what stops 20 near-duplicate dark palettes from drifting apart.

**Themes remap tokens, not components.** `css/themes.css` only reassigns semantic tokens per theme. A theme never restyles a component directly — it changes what the component reads. Adding a theme is a new token block, not a new set of overrides.

**Per-page privacy statements.** Each tool says what *it* does. Some tools are purely local, some call an API, some embed third-party media. A blanket "we don't track you" banner would be false on the pages that do make network requests, so the privacy details are page-specific instead.

**Accessibility is a requirement, not a polish pass.** Every page has exactly one `<h1>`, a `<title>`, and a `lang` attribute. Focus is visible on every interactive element. The CI heading check enforces the first of these.

## Deployment

GitHub Pages, served from the `site` branch at the domain in `CNAME`.

Merges to `site` publish automatically. The service worker uses a versioned cache and asks the browser to activate a new version on the next load, so deploys land without a manual refresh.

## Contributing

Issues and pull requests are welcome — there is an issue link in the About modal on every page.

## License

Source for the site is public. Individual tools may carry their own license; check the tool's folder for details.
