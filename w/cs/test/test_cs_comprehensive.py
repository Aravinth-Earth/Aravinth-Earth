"""CS game — comprehensive headless test suite.
Launches Playwright's own headless Chromium (no CDP needed)."""
import sys, time, random, math
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8103/w/cs/index.html"
PASS, FAIL = 0, 0

def check(label, ok, detail=""):
    global PASS, FAIL
    if ok: PASS += 1
    else: FAIL += 1
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}" + (f" — {detail}" if detail else ""))

def start_game(page, difficulty="easy", mode="color", lang="en"):
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    time.sleep(0.2)
    if lang == "ta":
        page.locator("[data-language='ta']").click()
        time.sleep(0.15)
    if mode == "shape":
        page.locator("[data-mode='shape']").click()
        time.sleep(0.15)
    page.locator(f"[data-difficulty='{difficulty}']").click()
    time.sleep(0.15)
    page.locator("#startBtn").click()
    time.sleep(0.5)

def get_targets(page):
    return page.evaluate("""() => {
        try { if (state?.ended) return null; if (!state?.running) return [];
            return state.items.filter(i => i.isTarget && !i.done).map(i => i.id);
        } catch(e) { return []; }
    }""")

def get_nontargets(page):
    return page.evaluate("""() => {
        try { if (!state?.running || state?.ended) return [];
            return state.items.filter(i => !i.isTarget && !i.done).map(i => i.id);
        } catch(e) { return []; }
    }""")

def wait_round(page):
    """Wait for next round to start."""
    for _ in range(30):
        if page.evaluate("() => state?.ended ?? false"): return "ended"
        if page.evaluate("() => state?.running ?? false"):
            ids = get_targets(page)
            if ids: return "ready"
        time.sleep(0.05)
    return "timeout"

def clear_round(page):
    """Click all targets in current round."""
    for _ in range(30):
        ids = get_targets(page)
        if ids is None: return "ended"
        if not ids:
            r = wait_round(page)
            if r != "ready": return r
            ids = get_targets(page)
            if not ids: continue
        for tid in ids:
            try: page.locator(f'[data-id="{tid}"]').click()
            except: pass
        time.sleep(0.1)
        if page.evaluate("() => state?.ended ?? false"): return "ended"
        cleared = page.evaluate("() => state?.roundsCleared ?? 0")
        if cleared > 0: return "cleared"
    return "timeout"

with sync_playwright() as p:
    t0 = time.time()
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    ctx = browser.new_context(viewport={"width": 390, "height": 844})
    page = ctx.new_page()
    page.set_default_timeout(8000)

    # ─── 1. HOME SCREEN ───
    print("\n=== 1. HOME SCREEN ===")
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    check("Start button visible", page.locator("#startBtn").is_visible())
    check("4 difficulty buttons", page.locator(".difficulty-btn").count() == 4)
    check("2 mode buttons", page.locator(".mode-btn").count() == 2)
    check("2 language buttons", page.locator(".lang-btn").count() == 2)
    check("View stats button", page.locator("#viewStatsBtn").is_visible())
    check("Easy highlighted by default", page.locator(".difficulty-btn.active").text_content() == "Easy")
    check("Color+Shape highlighted by default", page.locator(".mode-btn.active").text_content() == "Color+Shape")
    check("English highlighted by default", page.locator(".lang-btn.active").text_content() == "English")
    # Click difficulties and verify highlights
    for diff in ["medium", "hard", "extraHard"]:
        page.locator(f"[data-difficulty='{diff}']").click()
        time.sleep(0.1)
        check(f"{diff} highlights on click", page.locator(".difficulty-btn.active").get_attribute("data-difficulty") == diff)
    page.locator("[data-difficulty='easy']").click()

    # ─── 2. TIMING ALL MODES ───
    print("\n=== 2. TIMING ===")
    for diff, expected in [("easy", 11), ("medium", 9), ("hard", 7), ("extraHard", 5)]:
        start_game(page, diff)
        dur = page.evaluate("() => state.roundDuration")
        tl = page.evaluate("() => Math.round(state.timeLeft)")
        check(f"{diff} duration={expected}s", dur == expected and tl <= expected, f"dur={dur} tl={tl}")
        clear_round(page)
        time.sleep(1)

    # ─── 3. CORRECT TAP MECHANICS ───
    print("\n=== 3. CORRECT TAP ===")
    start_game(page)
    ids = get_targets(page)
    first = ids[0]
    bh = page.evaluate("() => state.hits")
    bs = page.evaluate("() => state.score")
    page.locator(f'[data-id="{first}"]').click()
    time.sleep(0.3)
    check("Hits +1", page.evaluate("() => state.hits") == bh + 1)
    check("Score +10", page.evaluate("() => state.score") == bs + 10)
    check("Tile done in state", page.evaluate(f"() => state.items.find(i => i.id === '{first}').done"))
    check("Tile done in DOM", page.locator(f'[data-id="{first}"]').evaluate("el => el.classList.contains('done')"))
    clear_round(page)

    # ─── 4. WRONG TAP ───
    print("\n=== 4. WRONG TAP ===")
    start_game(page)
    nt = get_nontargets(page)
    if nt:
        bw = page.evaluate("() => state.wrong")
        bs = page.evaluate("() => state.score")
        bt = page.evaluate("() => Math.round(state.timeLeft * 10) / 10")
        page.locator(f'[data-id="{nt[0]}"]').click()
        time.sleep(0.15)
        check("Wrong +1", page.evaluate("() => state.wrong") == bw + 1)
        check("Score -3 (min 0)", page.evaluate("() => state.score") == max(0, bs - 3))
        at = page.evaluate("() => Math.round(state.timeLeft * 10) / 10")
        decay = bt - at
        check("Time -1s penalty", 0.8 <= decay <= 1.8, f"decay={decay:.1f}s")
    clear_round(page)

    # ─── 5. MULTIPLE WRONG TAPS ACCUMULATE ───
    print("\n=== 5. MULTIPLE WRONG TAPS ===")
    start_game(page, "easy")
    nt = get_nontargets(page)
    if nt:
        measures = []
        for i in range(3):
            bt = page.evaluate("() => Math.round(state.timeLeft * 10) / 10")
            idx = i % len(nt)
            page.locator(f'[data-id="{nt[idx]}"]').click()
            time.sleep(0.1)
            at = page.evaluate("() => Math.round(state.timeLeft * 10) / 10")
            measures.append(bt - at)
        avg_decay = sum(measures) / len(measures)
        check("Wrong count = 3", page.evaluate("() => state.wrong") >= 3)
        check("Avg time decay ~1s per wrong tap", 0.8 <= avg_decay <= 1.8, f"avg={avg_decay:.2f}s measures={[round(m,1) for m in measures]}")
    clear_round(page)

    # ─── 6. ROUND TRANSITION ───
    print("\n=== 6. ROUND TRANSITION ===")
    start_game(page)
    start_round = page.evaluate("() => state.sessionRound")
    result = clear_round(page)
    time.sleep(1.2)
    check("Round cleared", result == "cleared" or page.evaluate("() => state.roundsCleared") >= 1)
    check("Round advanced", page.evaluate("() => state.sessionRound") > start_round)

    # ─── 7. BONUS CARRY ───
    print("\n=== 7. BONUS CARRY ===")
    start_game(page, "easy")  # 11s base
    time.sleep(1)
    cleared = page.evaluate("() => state.roundsCleared")
    # Clear remaining targets in current round
    result = clear_round(page)
    time.sleep(1.5)
    # Round 2 should have bonus
    dur2 = page.evaluate("() => state.roundDuration")
    check("Round 2 gets bonus time", dur2 > 11, f"dur={dur2}s")

    # ─── 8. PAUSE / RESUME ───
    print("\n=== 8. PAUSE / RESUME ===")
    start_game(page)
    time.sleep(0.5)
    page.locator("#pauseBtn").click()
    time.sleep(0.3)
    check("Pause overlay visible", page.evaluate("() => !document.getElementById('pauseOverlay').hidden"))
    check("Timer paused", page.evaluate("() => state.paused"))
    page.locator("#resumeBtn").click()
    time.sleep(0.3)
    check("Resumed", page.evaluate("() => state.running && !state.paused"))
    clear_round(page)

    # ─── 9. STATS BAR ───
    print("\n=== 9. STATS BAR ===")
    start_game(page)
    check("Stats hidden init", page.locator("#statsBar").evaluate("el => el.hidden"))
    page.locator("#statsToggleBtn").click()
    time.sleep(0.2)
    check("Stats visible after toggle", not page.locator("#statsBar").evaluate("el => el.hidden"))
    check("Round stat populated", len(page.locator("#roundValue").text_content()) > 0)
    check("Score stat populated", len(page.locator("#scoreValue").text_content()) > 0)

    # ─── 10. TARGET DISPLAY ───
    print("\n=== 10. TARGET DISPLAY ===")
    start_game(page)
    remaining = page.evaluate("() => state.targetsRemaining")
    check("Shape box visible", page.locator("#targetShapeBox").is_visible())
    check("Remaining count shows", str(remaining) in page.locator("#targetRemaining").text_content())
    check("Shape SVG exists", page.locator("#targetShape svg").is_visible())
    clear_round(page)

    # ─── 11. MODE SWITCHING ───
    print("\n=== 11. MODE SWITCHING ===")
    start_game(page, mode="shape")
    labels = page.evaluate("""() => Array.from(document.querySelectorAll('.tile')).slice(0,3).map(t => t.getAttribute('aria-label'))""")
    all_single = all(" " not in l for l in labels)
    check("Shape-mode labels single-word", all_single, f"labels={labels}")
    check("State mode=shape", page.evaluate("() => state.mode") == "shape")
    clear_round(page)

    # ─── 12. LANGUAGE ───
    print("\n=== 12. LANGUAGE ===")
    start_game(page, lang="ta")
    check("Language set to ta", page.evaluate("() => state.language") == "ta")
    clear_round(page)

    # Reset to English for remaining tests
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    time.sleep(0.1)
    page.locator("[data-language='en']").click()
    time.sleep(0.15)

    # ─── 13. EXTRA HARD MODE ───
    print("\n=== 13. EXTRA HARD ===")
    start_game(page, "extraHard")
    check("Duration = 5s", page.evaluate("() => state.roundDuration") == 5)
    # Wait for time to expire
    time.sleep(6)
    check("Game ended from timeout", page.evaluate("() => state.ended"))
    check("Results screen", page.locator("#results").evaluate("el => !el.hidden"))
    check("Score shown in results", int(page.locator("#scoreValue").text_content()) >= 0)

    # ─── 14. GAME RESTART ───
    print("\n=== 14. RESTART ===")
    start_game(page)
    time.sleep(0.5)
    page.locator("#restartBtn").click()
    time.sleep(1)
    check("Game restarted (round=1)", page.evaluate("() => state.sessionRound") == 1)
    check("Score reset", page.evaluate("() => state.score") == 0)
    check("Hits reset", page.evaluate("() => state.hits") == 0)
    clear_round(page)

    # ─── 15. HOME BUTTON ───
    print("\n=== 15. HOME BUTTON ===")
    start_game(page)
    time.sleep(0.5)
    page.locator("#backBtn").click()
    time.sleep(0.5)
    check("Home screen visible", page.locator("#home").evaluate("el => !el.hidden"))
    check("Game not running", not page.evaluate("() => state.running"))

    # ─── 16. VIEW STATS ───
    print("\n=== 16. STATS PAGE ===")
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    page.locator("#viewStatsBtn").click()
    time.sleep(0.3)
    check("Stats screen visible", page.locator("#stats").evaluate("el => !el.hidden"))
    page.locator("#statsBackBtn").click()
    time.sleep(0.3)
    check("Back to home", page.locator("#home").evaluate("el => !el.hidden"))

    # ─── 17. EDGE: CLICK DONE TILE ───
    print("\n=== 17. EDGE: CLICK DONE TILE ===")
    start_game(page)
    ids = get_targets(page)
    first = ids[0]
    page.locator(f'[data-id="{first}"]').click()
    time.sleep(0.2)
    hits_before = page.evaluate("() => state.hits")
    # Click same done tile again via JS (test for ignored tap)
    page.evaluate(f"() => document.querySelector('[data-id=\"{first}\"]')?.click()")
    time.sleep(0.2)
    check("Clicking done tile does nothing", page.evaluate("() => state.hits") == hits_before)
    clear_round(page)

    # ─── 18. EDGE: RAPID ALL-CORRECT ───
    print("\n=== 18. EDGE: RAPID ALL-CORRECT ===")
    start_game(page, "easy")
    ids = get_targets(page)
    target_count = len(ids)
    page.evaluate(f"() => {ids}.forEach(id => document.querySelector('[data-id=\"' + id + '\"]')?.click())")
    time.sleep(1.5)
    hits = page.evaluate("() => state.hits")
    check("All targets tapped", hits == target_count, f"hits={hits}/{target_count}")
    check("Round advanced", page.evaluate("() => state.sessionRound") > 1, f"sr={page.evaluate('() => state.sessionRound')}")

    # ─── 19. EDGE: TIME PENALTY ON WRONG TAPS IN HARD MODE ───
    print("\n=== 19. EDGE: WRONG TAP ON HARD (7s) ===")
    start_game(page, "hard")
    nt = get_nontargets(page)
    if nt:
        bt = page.evaluate("() => Math.round(state.timeLeft)")
        for n in nt[:3]:
            try: page.locator(f'[data-id="{n}"]').click()
            except: pass
            time.sleep(0.1)
        at = page.evaluate("() => Math.round(state.timeLeft)")
        check("Time decreased after 3 wrong taps", bt - at >= 3, f"bt={bt} at={at}")
    clear_round(page)

    # ─── 20. EDGE: EMPTY BOARD BEFORE START ───
    print("\n=== 20. EDGE: BOARD BEFORE START ===")
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    tile_count = page.locator(".tile").count()
    check("No tiles before game start", tile_count == 0)

    # ─── RESULTS ───
    elapsed = time.time() - t0
    browser.close()

    total = PASS + FAIL
    print(f"\n{'='*50}")
    print(f"  RESULTS: {PASS}/{total} passed, {FAIL} failed")
    print(f"  Time: {elapsed:.0f}s")
    print(f"{'='*50}")
    sys.exit(0 if FAIL == 0 else 1)
