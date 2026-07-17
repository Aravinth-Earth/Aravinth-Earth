            const els = {
                home: document.getElementById("home"),
                gameWrap: document.getElementById("gameWrap"),
                results: document.getElementById("results"),
                stats: document.getElementById("stats"),
                board: document.getElementById("board"),
                targetRemaining: document.getElementById("targetRemaining"),
                targetShape: document.getElementById("targetShape"),
                targetShapeBox: document.getElementById("targetShapeBox"),
                ringProgress: document.getElementById("ringProgress"),
                timeText: document.getElementById("timeText"),
                roundValue: document.getElementById("roundValue"),
                scoreValue: document.getElementById("scoreValue"),
                hitsValue: document.getElementById("hitsValue"),
                wrongValue: document.getElementById("wrongValue"),
                remainingValue: document.getElementById("remainingValue"),
                statsBar: document.getElementById("statsBar"),
                statsToggleBtn: document.getElementById("statsToggleBtn"),
                pauseBtn: document.getElementById("pauseBtn"),
                pauseOverlay: document.getElementById("pauseOverlay"),
                resumeBtn: document.getElementById("resumeBtn"),
                lifetimeStats: document.getElementById("lifetimeStats"),
                resultsGrid: document.getElementById("resultsGrid"),
                soundBtn: document.getElementById("soundBtn"),
                startBtn: document.getElementById("startBtn"),
                viewStatsBtn: document.getElementById("viewStatsBtn"),
                restartBtn: document.getElementById("restartBtn"),
                backBtn: document.getElementById("backBtn"),
                homeBtn: document.getElementById("homeBtn"),
                playAgainBtn: document.getElementById("playAgainBtn"),
                resetStatsBtn: document.getElementById("resetStatsBtn"),
                statsBackBtn: document.getElementById("statsBackBtn"),
                difficultyButtons: document.getElementById("difficultyButtons"),
                languageButtons: document.getElementById("languageButtons"),
                modeButtons: document.getElementById("modeButtons"),
            };

            const state = {
                soundOn: false,
                running: false,
                ended: false,
                paused: false,
                timerId: null,
                advanceId: null,
                startedAt: 0,
                timeLeft: ROUND_SECONDS,
                score: 0,
                hits: 0,
                wrong: 0,
                targetCount: 0,
                sessionRound: 1,
                roundsCleared: 0,
                bonusSeconds: 0,
                roundDuration: ROUND_SECONDS,
                difficulty: "easy",
                mode: "color",
                language: 'en',
                items: [],
                itemMap: new Map(),
                targetsRemaining: 0,
                _lastP: 1,
                _lastHudUpdate: 0,
                target: null,
            };

            function shapeName(shape) {
                return state.language === "ta" ? shape.nameTa : shape.name;
            }

            function colorName(color) {
                return state.language === "ta" ? color.nameTa : color.name;
            }

            function isShapeMode() {
                return state.mode === "shape";
            }

            function createShapeSVG(shape, colorHex) {
                return `
        <svg class="symbol" viewBox="0 0 100 100" aria-hidden="true" style="color: ${colorHex};">
          ${shape.svg}
        </svg>
      `;
            }

            function renderMiniShape(el, shape, colorHex) {
                el.innerHTML = `<svg viewBox="0 0 100 100" width="24" height="24" aria-hidden="true" style="color:${colorHex};">${shape.svg}</svg>`;
            }

            function setSwatch(el, colorHex) {
                el.innerHTML = `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${colorHex};box-shadow:0 0 0 2px rgba(255,255,255,0.08) inset, 0 0 18px ${colorHex}22;"></span>`;
            }

            function getDifficultyConfig() {
                return DIFFICULTIES[state.difficulty] || DIFFICULTIES.easy;
            }

