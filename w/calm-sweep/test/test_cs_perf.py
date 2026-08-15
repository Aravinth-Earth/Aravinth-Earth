"""CS Performance Test Suite — play until failure, measure everything."""
import sys, time, json
from playwright.sync_api import sync_playwright

CDP = "http://localhost:9227"
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8092/w/calm-sweep/index.html"
TARGET = int(sys.argv[2]) if len(sys.argv) > 2 else 40

def get_board_dims(level):
    size = 3 + (level - 1) // 5
    return size, size, size * size

def install_probes(page):
    """Inject frame‑time and layout counters into the page."""
    page.evaluate("""() => {
        if (window.__perfProbes) return;
        window.__perfProbes = {
            frameTimes: [],
            layoutCount: 0,
            longTasks: [],
            lastFrame: performance.now(),
            prevTime: 0,
        };
        // Frame‑time probe via rAF
        function frameLoop(now) {
            if (window.__perfProbes) {
                const dt = now - window.__perfProbes.lastFrame;
                if (dt > 1) window.__perfProbes.frameTimes.push(dt);
                window.__perfProbes.lastFrame = now;
            }
            requestAnimationFrame(frameLoop);
        }
        requestAnimationFrame(frameLoop);
        // Monitor long tasks via PerformanceObserver
        if (typeof PerformanceObserver !== 'undefined') {
            try {
                const obs = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 16 && entry.name !== 'requestAnimationFrame') {
                            window.__perfProbes.longTasks.push({
                                name: entry.name,
                                dur: Math.round(entry.duration * 100) / 100,
                                start: Math.round(entry.startTime),
                            });
                        }
                    }
                });
                obs.observe({ type: 'longtask', buffered: true });
                // Also observe layout shifts
                const layoutObs = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        window.__perfProbes.layoutCount++;
                    }
                });
                layoutObs.observe({ type: 'layout-shift', buffered: true });
            } catch(e) {}
        }
    }""")

def collect_metrics(page, label=""):
    """Return a dict of performance metrics."""
    data = page.evaluate("""() => {
        const p = window.__perfProbes || {};
        const recentFrames = p.frameTimes ? p.frameTimes.slice(-300) : [];
        const over16 = recentFrames.filter(f => f > 16).length;
        const over50 = recentFrames.filter(f => f > 50).length;
        const longTasks = p.longTasks || [];
        return {
            roundCleared: state?.roundsCleared ?? 0,
            roundReached: state?.sessionRound ?? 0,
            score: state?.score ?? 0,
            tilesOnBoard: state?.items?.length ?? 0,
            targetsRemaining: state?.targetsRemaining ?? 0,
            // Frame timing
            frameSamples: recentFrames.length,
            frameAvg: recentFrames.length ? Math.round(recentFrames.reduce((a,b)=>a+b,0)/recentFrames.length * 100)/100 : 0,
            frameMax: recentFrames.length ? Math.round(Math.max(...recentFrames) * 100)/100 : 0,
            frameP95: recentFrames.length ? (() => { const s=[...recentFrames].sort((a,b)=>a-b); return Math.round(s[Math.floor(s.length*0.95)]*100)/100; })() : 0,
            framesOver16ms: over16,
            framesOver50ms: over50,
            pctOver16: recentFrames.length ? Math.round(over16/recentFrames.length*100) : 0,
            pctOver50: recentFrames.length ? Math.round(over50/recentFrames.length*100) : 0,
            // Layout
            layoutShifts: p.layoutCount ?? 0,
            // Long tasks
            longTaskCount: longTasks.length,
            longTotalMs: longTasks.length ? Math.round(longTasks.reduce((a,t)=>a+t.dur,0)*100)/100 : 0,
        };
    }""")
    if label:
        print(f"  ── {label} ──")
        print(f"  Frames: avg={data['frameAvg']:.2f}ms max={data['frameMax']:.2f}ms p95={data['frameP95']:.2f}ms")
        print(f"  Dropped: >16ms={data['pctOver16']}% >50ms={data['pctOver50']}%")
        print(f"  Long tasks: {data['longTaskCount']} ({data['longTotalMs']}ms total)")
        print(f"  Tiles: {data['tilesOnBoard']} Target remain: {data['targetsRemaining']}")
    return data

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp(CDP)
    ctx = browser.contexts[0] if browser.contexts else browser.new_context()
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.set_default_timeout(10000)

    print("=" * 64)
    print(f"  CS PERFORMANCE TEST — target: {TARGET}+ rounds")
    print("=" * 64)

    page.goto(URL)
    page.wait_for_load_state("networkidle")
    install_probes(page)

    # Start game
    page.locator("#startBtn").click()
    page.wait_for_timeout(600)
    all_metrics = []
    rounds_cleared = 0
    round_reached = 0
    start_time = time.time()
    timeout = 300

    print("\nRounds:")
    for rn in range(1, TARGET + 5):
        round_reached = rn
        cols, rows, total = get_board_dims(rn)
        print(f"  R{rn:>2} ({cols}x{rows}={total}) — ", end="", flush=True)

        try:
            page.locator("#board").wait_for(timeout=3000)
        except:
            print("BOARD LOST"); break

        page.wait_for_timeout(150)

        # Get target tile IDs from game state
        tile_ids = page.evaluate("""() => {
            try {
                if (!state || !state.running || state.ended) return null;
                return state.items.filter(i => i.isTarget && !i.done).map(i => i.id);
            } catch(e) { return null; }
        }""")

        if tile_ids is None:
            print("ENDED"); break

        if not tile_ids:
            print("NO_TARGETS — skip")
            page.wait_for_timeout(1000)
            continue

        # Click all target tiles
        t0 = time.time()
        for tid in tile_ids:
            try:
                page.locator(f'[data-id="{tid}"]').click()
            except:
                pass
        click_time = time.time() - t0

        # Wait for round transition
        page.wait_for_timeout(350)
        total_r = page.evaluate("() => state?.roundsCleared ?? 0")
        ended = page.evaluate("() => state?.ended ?? false")

        # Collect metrics snapshot
        m = collect_metrics(page)
        m["round"] = rn
        m["clickTime"] = round(click_time, 3)
        all_metrics.append(m)
        cleared_this = total_r > rounds_cleared
        if cleared_this:
            rounds_cleared = total_r
        print(f"{'✓' if cleared_this else '✗'} hits={len(tile_ids)} clk={click_time:.2f}s", flush=True)

        if ended:
            print("  -> SESSION ENDED")
            break

        # Wait for next round to start (or timeout)
        w0 = time.time()
        while time.time() - w0 < 3:
            r = page.evaluate("() => state?.running ?? false")
            e = page.evaluate("() => state?.ended ?? false")
            if r or e:
                break
            page.wait_for_timeout(50)
        if page.evaluate("() => state?.ended ?? false"):
            break
        if time.time() - start_time > timeout:
            print("  -> TIMEOUT"); break

    elapsed = time.time() - start_time
    final = page.evaluate("""() => ({
        roundsCleared: state?.roundsCleared ?? 0,
        roundReached: state?.sessionRound ?? 0,
        score: state?.score ?? 0,
        ended: state?.ended ?? false,
    })""")

    # Summary
    print(f"\n{'=' * 64}")
    print(f"  FINAL: {final['roundsCleared']} rounds cleared / {final['roundReached']} reached")
    print(f"  Score: {final['score']}  Time: {elapsed:.0f}s  Ended: {final['ended']}")
    print(f"{'=' * 64}")

    # Aggregate metrics
    if all_metrics:
        all_frames = []
        for m in all_metrics:
            if "frameAvg" in m:
                all_frames.append(m)
        if all_frames:
            avg_frames = sum(m["frameAvg"] for m in all_frames) / len(all_frames)
            max_frames = max(m["frameMax"] for m in all_frames)
            avg_p95 = sum(m["frameP95"] for m in all_frames) / len(all_frames)
            avg_over16 = sum(m["pctOver16"] for m in all_frames) / len(all_frames)
            print(f"\n  Aggregate frame stats:")
            print(f"  Avg frame time: {avg_frames:.2f}ms  Max: {max_frames:.2f}ms  Avg P95: {avg_p95:.2f}ms")
            print(f"  Avg frames >16ms: {avg_over16:.1f}%")
            total_lt = sum(m["longTaskCount"] for m in all_metrics)
            total_lt_ms = sum(m["longTotalMs"] for m in all_metrics)
            print(f"  Long tasks: {total_lt} ({total_lt_ms:.0f}ms cumulative)")

    if final['roundsCleared'] >= TARGET:
        print(f"\n  ✅ PASS: Crossed {TARGET} round target!")
        sys.exit(0)
    else:
        print(f"\n  ❌ FAIL: Only reached {final['roundsCleared']} rounds (need {TARGET})")
        sys.exit(1)
