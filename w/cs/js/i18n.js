            function getLang() {
                return LANGUAGES[state.language] || LANGUAGES.en;
            }

            function inferLanguage() {
                const navLang = (navigator.language || navigator.userLanguage || "en")
                    .toLowerCase();
                if (navLang.startsWith("ta")) return "ta";
                return "en";
            }

            function loadPrefs() {
                try {
                    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY));
                    if (parsed && typeof parsed === "object") return parsed;
                } catch (_) {}
                return {
                    difficulty: "easy",
                    mode: "color",
                    language: inferLanguage(),
                };
            }

            function savePrefs() {
                localStorage.setItem(
                    PREFS_KEY,
                    JSON.stringify({
                        difficulty: state.difficulty,
                        mode: state.mode,
                        language: state.language,
                    }),
                );
            }

            function syncModeButtons() {
                const buttons = els.modeButtons?.querySelectorAll(
                    "[data-mode]",
                );
                buttons?.forEach((btn) => {
                    btn.classList.toggle(
                        "active",
                        btn.dataset.mode === state.mode,
                    );
                });
            }

            function syncLanguageButtons() {
                const buttons = els.languageButtons?.querySelectorAll(
                    "[data-language]",
                );
                buttons?.forEach((btn) => {
                    btn.classList.toggle(
                        "active",
                        btn.dataset.language === state.language,
                    );
                });
            }

            function setText(selector, value) {
                const node = document.querySelector(selector);
                if (node) node.textContent = value;
            }

            function applyLanguage() {
                const t = getLang();
                document.title = t.title;
                document.documentElement.lang = state.language === "ta" ? "ta" : "en";
                setText(".eyebrow", t.eyebrow);
                setText("h1", t.title);
                setText("#startBtn .btn-label", t.start);
                setText("#viewStatsBtn .btn-label", t.viewStats);
                setText("#resetStatsBtn .btn-label", t.resetStats);
                setText(".difficulty-row .stat-label", t.difficulty);
                setText(".lang-row .stat-label", t.language);
                setText("#home .hero-grid .panel .stat-label", t.howToPlay);
                setText("#home .hero-grid .panel .subtle", t.howToPlayBody);
                setText("#statsTitle", t.progress);
                setText("#stats .eyebrow", t.localStats);
                setText("#statsBackBtn .btn-label", t.backHome);
                setText("#pauseOverlay .pause-card h3", t.paused);
                setText("#pauseOverlay .pause-card .subtle", t.pausedBody);
                setText("#resultsTitle", t.summary);
                setText("#results .eyebrow", t.roundComplete);
                setText("#results .subtle", t.summaryBody);
                setText("#playAgainBtn .btn-label", t.playAgain);
                setText("#homeBtn .btn-label", t.home);
                syncDifficultyButtons();
                syncLanguageButtons();
                syncModeButtons();
                renderLifetimeStats();
                if (state.target) {
                    renderTarget();
                }
            }

            function setLanguage(language) {
                state.language = language === "ta" ? "ta" : "en";
                savePrefs();
                syncLanguageButtons();
                applyLanguage();
                posthog?.capture('language_changed', { language: state.language });
            }
