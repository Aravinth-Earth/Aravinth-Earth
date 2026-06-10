"""Human-like gameplay simulation — random delays, random wrong taps.
Tests how time accumulation plays out in realistic play."""
import sys, time, random
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8102/w/cs/index.html"

def human_play(page, mode, wrong_chance=0.2, min_delay=0.3, max_delay=1.2):
    """Simulate human play: random delays between taps, occasional wrong taps."""
    page.goto(URL, timeout=10000)
    page.wait_for_load_state("networkidle")
    time.sleep(0.2)
    page.locator(f"[data-difficulty='{mode}']").click()
    time.sleep(0.15)
    page.locator("#startBtn").click()
    time.sleep(0.4)

    cleared = 0
    scores = [0]
    time_bank = []
    total_wrong = 0
    rounds = 0
    all_targets = page.evaluate("() => state.targetsRemaining")

    for rn in range(500):
        try:
            page.locator("#board").wait_for(timeout=2000)
        except:
            break

        # Get target IDs and non-target IDs for this round
        info = page.evaluate("""() => {
            try {
                if (state?.ended) return null;
                if (!state?.running) return {waiting: true};
                return {
                    targets: state.items.filter(i => i.isTarget && !i.done).map(i => i.id),
                    nontargets: state.items.filter(i => !i.isTarget && !i.done).map(i => i.id),
                };
            } catch(e) { return null; }
        }""")
        if info is None:
            break
        if info.get("waiting"):
            for _ in range(25):
                if page.evaluate("() => state?.ended ?? false"):
                    info = None
                    break
                r = page.evaluate("() => state?.running ?? false")
                if r:
                    info2 = page.evaluate("""() => {
                        try {
                            if (state?.ended) return null;
                            return {
                                targets: state.items.filter(i => i.isTarget && !i.done).map(i => i.id),
                                nontargets: state.items.filter(i => !i.isTarget && !i.done).map(i => i.id),
                            };
                        } catch(e) { return null; }
                    }""")
                    if info2 and info2.get("targets"):
                        info = info2
                        break
                time.sleep(0.05)
            if info is None:
                break
            if isinstance(info, dict) and info.get("waiting"):
                continue

        targets = info["targets"]
        nontargets = info.get("nontargets", [])

        if not targets and not nontargets:
            continue

        # Human: scan and tap with delays, occasional wrong taps
        tapped_correct = 0
        tapped_wrong = 0
        for tid in targets.copy():
            # Human delay: look, think, move finger
            time.sleep(random.uniform(min_delay, max_delay))

            # Maybe hit a wrong tile before this correct one
            if nontargets and random.random() < wrong_chance:
                nt = random.choice(nontargets)
                try:
                    page.locator(f'[data-id="{nt}"]').click()
                    tapped_wrong += 1
                    total_wrong += 1
                except:
                    pass
                time.sleep(random.uniform(0.1, 0.3))

            # Tap the correct tile
            try:
                page.locator(f'[data-id="{tid}"]').click()
                tapped_correct += 1
            except:
                pass

        if tapped_correct == 0:
            time.sleep(0.5)
            continue

        score = page.evaluate("() => state?.score ?? 0")
        time_left = page.evaluate("() => state?.timeLeft ?? 0")

        cr = page.evaluate("() => state?.roundsCleared ?? 0")
        if cr > cleared:
            cleared = cr
            rounds = page.evaluate("() => state?.sessionRound ?? 0")
            bonus = page.evaluate("() => state?.bonusSeconds ?? 0")
            time_bank.append({
                "round": rounds,
                "cleared": cleared,
                "bonus": bonus,
                "score": score,
                "time_left": round(time_left, 1),
                "wrong": tapped_wrong,
            })

        scores.append(score)
        if page.evaluate("() => state?.ended ?? false"):
            break

    total_score = page.evaluate("() => state?.score ?? 0")
    return {
        "score": total_score,
        "rounds_cleared": cleared,
        "rounds_reached": rounds,
        "total_wrong": total_wrong,
        "time_bank": time_bank,
    }

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp("http://localhost:9227")
    page = browser.new_page()
    page.set_viewport_size({"width": 390, "height": 844})
    page.set_default_timeout(10000)

    for mode, label in [("easy", "Easy 20s"), ("medium", "Medium 15s"),
                         ("hard", "Hard 10s"), ("extraHard", "Extra hard 5s")]:
        print(f"\n{'='*50}")
        print(f"  {label} — human play (20% wrong, 0.3-1.2s delay)")
        print(f"{'='*50}")

        # 3 attempts per mode
        best = {"score": 0}
        for att in range(3):
            result = human_play(page, mode)
            print(f"  #{att+1}: score={result['score']}, {result['rounds_cleared']} rounds, {result['total_wrong']} wrong taps")
            if result["score"] > best["score"]:
                best = result
            # Show time bank progression
            bank = result["time_bank"]
            if bank:
                timeline = " → ".join([f"r{b['round']}:{b['bonus']}s" for b in bank[:6]])
                if len(bank) > 6:
                    timeline += f" … r{bank[-1]['round']}:{bank[-1]['bonus']}s"
                print(f"     Time bank: {timeline}")

        print(f"  >> BEST: score={best['score']}, {best['rounds_cleared']} rounds, {best['total_wrong']} wrong")

    page.close()
