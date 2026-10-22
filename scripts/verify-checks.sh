#!/usr/bin/env bash
# Prove that each check FAILS when it should.
#
# The previous review found that apply-shell.js --check passed for six
# different defects, because it applied its repairs before checking. This
# script breaks each thing in a COPY of the repo and confirms the relevant
# check catches it.
#
# Usage: bash scripts/verify-checks.sh

set -u

# Derive the repository from this script, so the check is not tied to one
# machine's checkout path.
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/check-proof.XXXXXXXX")"
trap 'rm -rf "$WORK"' EXIT
PASS=0
FAIL=0

setup() {
  rm -rf "$WORK"
  mkdir -p "$WORK"
  # .git and node_modules are not needed by these checks, and copying them
  # makes each of the 21 cases slower for no benefit.
  tar -C "$SRC" --exclude=.git --exclude=node_modules -cf - . | tar -C "$WORK" -xf -
  cd "$WORK" || exit 1
}

# expect_fail <label> <check-command>
expect_fail() {
  local label="$1"; shift
  if "$@" > /dev/null 2>&1; then
    echo "  VACUOUS  $label  (the check passed when it should have failed)"
    FAIL=$((FAIL + 1))
  else
    echo "  ok       $label  (the check caught it)"
    PASS=$((PASS + 1))
  fi
}

expect_pass() {
  local label="$1"; shift
  if "$@" > /dev/null 2>&1; then
    echo "  ok       $label  (still passes)"
    PASS=$((PASS + 1))
  else
    echo "  BROKEN   $label  (should pass but did not)"
    FAIL=$((FAIL + 1))
  fi
}

echo "Proving the checks fail when they should"
echo

# --- apply-shell --check ---------------------------------------------------
echo "apply-shell.js --check"

setup
python3 - <<'PY'
import re
p='index.html'; s=open(p,encoding='utf-8').read()
s=re.sub(r'<script>\s*/\* site-theme:applies-before-paint \*/.*?</script>', '', s, flags=re.S)
open(p,'w',encoding='utf-8').write(s)
PY
expect_fail "a missing theme snippet" node scripts/apply-shell.js --check

setup
sed -i 's|<link rel="stylesheet" href="/css/themes.css" />||' index.html
expect_fail "a missing themes.css link" node scripts/apply-shell.js --check

setup
sed -i 's|<script src="/js/theme-switcher.js" defer></script>||' index.html
expect_fail "a missing theme-switcher script" node scripts/apply-shell.js --check

setup
sed -i 's|content="https://www.332321.xyz/og-image.png"|content="/og-image.png"|' index.html
expect_fail "a relative og:image" node scripts/apply-shell.js --check

setup
sed -i 's|<link rel="canonical" href="https://www.332321.xyz/" />||' index.html
expect_fail "a missing canonical link" node scripts/apply-shell.js --check

setup
python3 - <<'PY'
p='index.html'; s=open(p,encoding='utf-8').read()
i=s.find('/* site-theme:applies-before-paint */')
j=s.rfind('<script>', 0, i)
block=s[j:s.find('</script>', i)+9]
s=s[:j] + block + s[j:]
open(p,'w',encoding='utf-8').write(s)
PY
expect_fail "two theme snippets on one page" node scripts/apply-shell.js --check

setup
python3 - <<'PY'
p='index.html'; s=open(p,encoding='utf-8').read()
s=s.replace('<link rel="stylesheet" href="/css/themes.css" />',
            '<link rel="stylesheet" href="/css/themes.css" />\n    <link rel="stylesheet" href="/css/style.css" />')
open(p,'w',encoding='utf-8').write(s)
PY
expect_fail "a stylesheet after themes.css" node scripts/apply-shell.js --check

setup
expect_pass "an intact page" node scripts/apply-shell.js --check

# --- the other checks ------------------------------------------------------
echo
echo "the other checks"

setup
sed -i 's|href="w/secret-share/index.html"|href="w/nonexistent/index.html"|' index.html
expect_fail "a broken internal link" node scripts/check-links.js

setup
python3 - <<'PY'
p='w/secret-share/index.html'; s=open(p,encoding='utf-8').read()
s=s.replace('<h1>Secret Share</h1>','<h2>Secret Share</h2>',1)
open(p,'w',encoding='utf-8').write(s)
PY
expect_fail "a page with no h1" node scripts/check-headings.js

setup
python3 - <<'PY'
p='w/clock/clock.html'; s=open(p,encoding='utf-8').read()
s=s.replace('<select id="color-mode" aria-label="Colour mode">','<select id="color-mode">',1)
open(p,'w',encoding='utf-8').write(s)
PY
expect_fail "an unlabelled control" node scripts/check-labels.js

setup
python3 - <<'PY'
p='w/clock/script.js'; s=open(p,encoding='utf-8').read()
s=s.replace("localStorage.setItem('clock.fontSize'","localStorage.setItem('fontSize'")
open(p,'w',encoding='utf-8').write(s)
PY
expect_fail "a renamed storage key" node scripts/check-privacy-storage.js

setup
python3 - <<'PY'
p='w/clock/script.js'; s=open(p,encoding='utf-8').read()
s=s.replace("// ", "// https://cdn.jsdelivr.net/npm/tracker@1.0.0/tracker.js\n// ",1)
open(p,'w',encoding='utf-8').write(s)
PY
expect_fail "a third party the manifest omits" node scripts/check-privacy.js

setup
sed -i 's|content="https://www.332321.xyz/og-image.png"|content="/og-image.png"|' index.html
expect_fail "a relative og:image" node scripts/check-social.js

setup
python3 - <<'PY'
p='js/privacy-manifest.js'; s=open(p,encoding='utf-8').read()
s=s.replace('"clock.fontSize"','"clock.totallyFakeKey"')
open(p,'w',encoding='utf-8').write(s)
PY
expect_fail "a manifest that over-claims a key" node scripts/check-privacy-storage.js

setup
expect_pass "an intact repo (storage claims)" node scripts/check-privacy-storage.js

setup
python3 - <<'PY2'
p='w/secret-share/index.html'; s=open(p,encoding='utf-8').read()
s=s.replace('href="#main-content"','href="#does-not-exist"',1)
open(p,'w',encoding='utf-8').write(s)
PY2
expect_fail "a broken in-page fragment" node scripts/check-links.js

setup
python3 - <<'PY2'
p='w/math-game/index.html'; s=open(p,encoding='utf-8').read()
s=s.replace('<h2 id="question"','<h4 id="question"',1)
open(p,'w',encoding='utf-8').write(s)
PY2
expect_fail "a heading level skip" node scripts/check-structure.js

setup
python3 - <<'PY2'
p='w/math-game/index.html'; s=open(p,encoding='utf-8').read()
s=s.replace('<button id="back-to-menu" class="icon-button" aria-label="Back to menu">','<button id="back-to-menu" class="icon-button">',1)
open(p,'w',encoding='utf-8').write(s)
PY2
expect_fail "a button with no accessible name" node scripts/check-structure.js

setup
python3 - <<'PY2'
p='w/secret-share/index.html'; s=open(p,encoding='utf-8').read()
s=s.replace('<div class="container" id="main-content"','<div class="container" id="main-content" id="main-content"',1)
open(p,'w',encoding='utf-8').write(s)
PY2
expect_fail "a duplicate id" node scripts/check-structure.js

setup
expect_pass "an intact repo (structure)" node scripts/check-structure.js

cd / || true
echo
echo "$PASS passed, $FAIL vacuous or broken"
[ "$FAIL" -eq 0 ]
