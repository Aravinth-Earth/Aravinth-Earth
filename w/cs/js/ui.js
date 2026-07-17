            function toggleStatsBar() {
                els.statsBar.hidden = !els.statsBar.hidden;
            }

            function setPaused(paused) {
                if (!state.running || state.ended) return;
                state.paused = paused;
                els.pauseBtn.setAttribute("aria-pressed", String(paused));
                if (paused) {
                    clearTimer();
                    els.pauseOverlay.hidden = false;
                    els.pauseOverlay.classList.add("active");
                } else {
                    els.pauseOverlay.hidden = true;
                    els.pauseOverlay.classList.remove("active");
                    state.startedAt =
                        performance.now() -
                        (state.roundDuration - state.timeLeft) * 1000;
                    tick();
                }
            }

            function shuffle(arr) {
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            }

            function randomInt(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            function cryptoRandomId() {
                if (window.crypto?.randomUUID)
                    return window.crypto.randomUUID();
                return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            }
