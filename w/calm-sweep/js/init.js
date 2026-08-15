            els.board.addEventListener("click", (e) => {
                const tile = e.target.closest(".tile");
                if (!tile) return;
                handleTileClick(tile.dataset.id, tile);
            });
            els.startBtn.addEventListener("click", startSession);
            els.viewStatsBtn.addEventListener("click", () => showScreen("stats"));
            els.statsToggleBtn.addEventListener("click", toggleStatsBar);
            els.pauseBtn.addEventListener("click", () => setPaused(!state.paused));
            els.resumeBtn.addEventListener("click", () => setPaused(false));
            els.restartBtn.addEventListener("click", startSession);
            els.playAgainBtn.addEventListener("click", startSession);
            els.backBtn.addEventListener("click", () => {
                clearTimer();
                clearAdvance();
                state.running = false;
                state.ended = true;
                state.paused = false;
                state.bonusSeconds = 0;
                els.statsBar.hidden = true;
                els.pauseOverlay.hidden = true;
                showScreen("home");
            });
            els.homeBtn.addEventListener("click", () => {
                clearTimer();
                clearAdvance();
                state.running = false;
                state.ended = true;
                state.paused = false;
                state.bonusSeconds = 0;
                els.statsBar.hidden = true;
                els.pauseOverlay.hidden = true;
                showScreen("home");
            });
            els.soundBtn.addEventListener("click", toggleSound);
            els.resetStatsBtn.addEventListener("click", resetStats);
            els.statsBackBtn.addEventListener("click", () => showScreen("home"));
            els.difficultyButtons
                ?.querySelectorAll("[data-difficulty]")
                .forEach((button) => {
                    button.addEventListener("click", () => {
                        state.difficulty = button.dataset.difficulty;
                        savePrefs();
                        syncDifficultyButtons();
                        posthog?.capture('difficulty_changed', { difficulty: state.difficulty });
                    });
                });
            els.languageButtons
                ?.querySelectorAll("[data-language]")
                .forEach((button) => {
                    button.addEventListener("click", () => {
                        setLanguage(button.dataset.language);
                    });
                });

            els.modeButtons
                ?.querySelectorAll("[data-mode]")
                .forEach((button) => {
                    button.addEventListener("click", () => {
                        state.mode = button.dataset.mode;
                        savePrefs();
                        syncModeButtons();
                        if (state.target) renderTarget();
                        posthog?.capture('mode_changed', { mode: state.mode });
                    });
                });

            window.addEventListener("resize", () => {
                if (state.running) {
                    // Keep current round stable; do not rebuild board mid-play.
                    return;
                }
                if (state.target) {
                    renderTarget();
                    const { cols } = getBoardDimensions(state.sessionRound);
                    els.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
                }
            });

            const prefs = loadPrefs();
            state.difficulty = prefs.difficulty === "medium" || prefs.difficulty === "hard" || prefs.difficulty === "extraHard"
                ? prefs.difficulty
                : "easy";
            state.mode = prefs.mode === "shape" ? "shape" : "color";
            state.language = prefs.language === "ta" ? "ta" : inferLanguage();
            applyLanguage();
            syncDifficultyButtons();
            syncLanguageButtons();
            syncModeButtons();
            renderLifetimeStats();
            state.target = chooseTarget();
            renderTarget();
