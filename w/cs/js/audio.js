
            let audioCtx = null;
            function playTone(freq, duration = 0.04, type = "sine") {
                if (!state.soundOn) return;
                try {
                    if (!audioCtx)
                        audioCtx = new (
                            window.AudioContext || window.webkitAudioContext
                        )();
                    const ctx = audioCtx;
                    const now = ctx.currentTime;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = type;
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.001, now);
                    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
                    gain.gain.exponentialRampToValueAtTime(
                        0.001,
                        now + duration,
                    );
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + duration + 0.01);
                } catch (_) {}
            }

            function toggleSound() {
                state.soundOn = !state.soundOn;
                els.soundBtn.setAttribute(
                    "aria-pressed",
                    String(state.soundOn),
                );
                els.soundBtn.textContent = state.soundOn ? "🔊" : "🔈";
            }
