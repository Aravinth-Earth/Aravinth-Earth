            function beginRound() {
                clearTimer();
                clearAdvance();
                state.running = true;
                state.ended = false;
                state.paused = false;
                const difficulty = getDifficultyConfig();
                state.roundDuration = difficulty.baseTime + state.bonusSeconds;
                state.bonusSeconds = 0;
                state.timeLeft = state.roundDuration;
                state.startedAt = performance.now();
                els.statsBar.hidden = true;
                els.pauseOverlay.hidden = true;
                els.pauseOverlay.classList.remove("active");
                els.pauseBtn.setAttribute("aria-pressed", "false");
                buildItems();
                renderTarget();
                renderBoard();
                showScreen("game");
                posthog?.capture('round_started', {
                    session_round: state.sessionRound,
                    round_duration: state.roundDuration
                });
                tick();
            }

            function clearTimer() {
                if (state.timerId) {
                    cancelAnimationFrame(state.timerId);
                    state.timerId = null;
                }
            }

            function clearAdvance() {
                if (state.advanceId) {
                    clearTimeout(state.advanceId);
                    state.advanceId = null;
                }
            }

            function tick() {
                if (!state.running || state.ended || state.paused) return;

                const elapsed = (performance.now() - state.startedAt) / 1000;
                state.timeLeft = Math.max(0, state.roundDuration - elapsed);

                const targetP = Math.max(0, state.timeLeft / state.roundDuration);
                const now = performance.now();
                if (Math.abs(targetP - state._lastP) > 0.015 || now - state._lastHudUpdate > 250) {
                    state._lastP = targetP;
                    state._lastHudUpdate = now;
                    els.timeText.textContent = Math.ceil(state.timeLeft);
                    els.ringProgress.style.strokeDasharray = CIRC;
                    els.ringProgress.style.strokeDashoffset = CIRC * (1 - targetP);
                }

                if (state.timeLeft <= 0) {
                    finishSession();
                    return;
                }

                state.timerId = requestAnimationFrame(tick);
            }

            function completeRound() {
                if (!state.running || state.ended) return;
                state.running = false;
                clearTimer();
                clearAdvance();

                state.bonusSeconds = Math.max(0, Math.floor(state.timeLeft));
                state.roundsCleared += 1;
                state.score += Math.round(state.timeLeft * 2);
                updateHUD();
                playTone(960, 0.07, "sine");
                posthog?.capture('round_completed', {
                    rounds_cleared: state.roundsCleared,
                    time_bonus: state.bonusSeconds,
                    session_round: state.sessionRound
                });

                state.advanceId = setTimeout(() => {
                    state.sessionRound += 1;
                    beginRound();
                }, 850);
            }

            function finishSession() {
                state.running = false;
                state.ended = true;
                state.paused = false;
                state.bonusSeconds = 0;
                clearTimer();
                clearAdvance();
                els.pauseOverlay.hidden = true;
                els.pauseOverlay.classList.remove("active");

                const remaining = state.targetsRemaining;
                const accuracy =
                    state.hits + state.wrong === 0
                        ? 0
                        : state.hits / (state.hits + state.wrong);
                const session = {
                    score: state.score,
                    hits: state.hits,
                    wrong: state.wrong,
                    accuracy,
                    remaining,
                    roundsCleared: state.roundsCleared,
                    roundReached: state.sessionRound,
                    mode: state.mode,
                };

                saveStats(session);
                renderResults(session);
                showScreen("results");
                posthog?.capture('game_ended', {
                    score: session.score,
                    hits: session.hits,
                    wrong: session.wrong,
                    accuracy: session.accuracy,
                    rounds_cleared: session.roundsCleared,
                    round_reached: session.roundReached,
                    difficulty: state.difficulty,
                    mode: state.mode
                });
            }

            function renderResults(session) {
                const compact =
                    window.innerWidth <= 390 || window.innerHeight <= 700;
                const t = getLang();
                const cards = compact
                    ? [
                          [t.finalScore ?? "Final score", session.score],
                          [t.accuracy ?? "Accuracy", `${Math.round(session.accuracy * 100)}%`],
                          [
                              t.finish ?? "Finish",
                              session.remaining === 0
                                  ? t.completed
                                  : t.timeExpired,
                          ],
                      ]
                    : [
                          [t.finalScore ?? "Final score", session.score],
                          [t.accuracy ?? "Accuracy", `${Math.round(session.accuracy * 100)}%`],
                          [t.roundsCleared ?? "Rounds cleared", session.roundsCleared],
                          [t.roundReached ?? "Round reached", session.roundReached],
                          [t.correctTaps ?? "Correct taps", session.hits],
                          [t.wrongTaps ?? "Wrong taps", session.wrong],
                          [t.targetsLeft ?? "Targets left", session.remaining],
                          [
                              t.finish ?? "Finish",
                              session.remaining === 0
                                  ? t.roundCompletedCleanly ?? "Round completed cleanly"
                                  : t.timeExpired,
                          ],
                      ];

                els.resultsGrid.innerHTML = cards
                    .map(
                        ([label, value]) => `
        <div class="stat">
          <div class="stat-label">${label}</div>
          <div class="stat-value">${value}</div>
        </div>
      `,
                    )
                    .join("");

                if (compact) {
                    const summary = els.results.querySelector(".subtle");
                    if (summary) {
                        summary.textContent = t.summaryBody;
                    }
                }
            }

            function showScreen(screen) {
                const screens = [els.home, els.gameWrap, els.results, els.stats];
                for (const el of screens) {
                    el.classList.remove("active");
                    el.hidden = true;
                }

                const next =
                    screen === "home"
                        ? els.home
                        : screen === "game"
                          ? els.gameWrap
                          : screen === "results"
                            ? els.results
                            : els.stats;
                next.hidden = false;
                next.classList.add("active");
                els.soundBtn.hidden = screen === "game" || screen === "results";
            }
