"""Stress test CS game — play until death, find max rounds.
Runs 5 attempts, reports best score. Mode: color+shape or shape-only."""
import sys, time, json
from playwright.sync_api import sync_playwright

CDP = "http://localhost:9227"
URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8100/w/cs/index.html"
MODE = sys.argv[2] if len(sys.argv) > 2 else "color"  # "color" or "shape"

def get_board_dims(level):
    size = 3 + (level - 1) // 5
    return size, size, size * size

def run_attempt(page, attempt):
    page.goto(URL)
    page.wait_for_load_state("networkidle")

    # Set mode
    page.evaluate(f"""() => {{
        const btns = document.querySelectorAll('[data-mode]');
        btns.forEach(b => b.classList.toggle('active', b.dataset.mode === '{MODE}'));
        if (typeof state !== 'undefined') state.mode = '{MODE}';
    }}""")
    time.sleep(0.3)

    page.locator("#startBtn").click()
    time.sleep(0.5)

    rounds_cleared = 0
    round_reached = 0
    start = time.time()
    timeout = 300  # 5 min max per attempt

    for rn in range(1, 200):
        round_reached = rn
        s, s, total = get_board_dims(rn)

        try:
            page.locator("#board").wait_for(timeout=3000)
        except:
            break
        page.wait_for_timeout(100)

        tile_ids = page.evaluate("""() => {
            try {
                if (!state || !state.running || state.ended) return null;
                return state.items.filter(i => i.isTarget && !i.done).map(i => i.id);
            } catch(e) { return null; }
        }""")

        if tile_ids is None:
            break
        if not tile_ids:
            page.wait_for_timeout(500)
            continue

        for tid in tile_ids:
            try:
                page.locator(f'[data-id="{tid}"]').click()
            except:
                pass

        page.wait_for_timeout(200)
        total_r = page.evaluate("() => state?.roundsCleared ?? 0")
        ended = page.evaluate("() => state?.ended ?? false")
        if total_r > rounds_cleared:
            rounds_cleared = total_r

        if ended:
            break

        w0 = time.time()
        while time.time() - w0 < 3:
            r = page.evaluate("() => state?.running ?? false")
            e = page.evaluate("() => state?.ended ?? false")
            if r or e:
                break
            page.wait_for_timeout(50)
        if page.evaluate("() => state?.ended ?? false"):
            break
        if time.time() - start > timeout:
            break

    elapsed = time.time() - start
    score = page.evaluate("() => state?.score ?? 0")
    print(f"  Attempt {attempt}: {rounds_cleared} rounds cleared / r{round_reached} | score={score} | {elapsed:.0f}s")
    return rounds_cleared, round_reached, score


with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp(CDP)
    ctx = browser.contexts[0] if browser.contexts else browser.new_context()
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.set_default_timeout(8000)
    page.set_viewport_size({"width": 390, "height": 844})

    mode_name = "Color+Shape" if MODE == "color" else "Shape-only"
    print(f"\n{'=' * 60}")
    print(f"  STRESS TEST — {mode_name} mode — 5 attempts, best of 5")
    print(f"{'=' * 60}")

    results = []
    for attempt in range(1, 6):
        rc, rr, sc = run_attempt(page, attempt)
        results.append((rc, rr, sc))
        time.sleep(0.5)

    results.sort(key=lambda x: (-x[0], -x[2]))
    best = results[0]

    for i, (rc, rr, sc) in enumerate(results, 1):
        tag = " ★ BEST" if i == 1 else ""
        print(f"  #{i}: {rc} rounds (r{rr}) score={sc}{tag}")

    print(f"\n  BEST OF 5 ({mode_name}): {best[0]} rounds (score={best[2]})")
    print(f"{'=' * 60}\n")
