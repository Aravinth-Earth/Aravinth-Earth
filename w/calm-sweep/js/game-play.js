            function renderTarget() {
                const { color, shape } = state.target;
                if (isShapeMode()) {
                    els.targetShapeBox.style.background = "rgba(255, 255, 255, 0.06)";
                    renderMiniShape(els.targetShape, shape, "#e8eef8");
                } else {
                    els.targetShapeBox.style.background = color.hex + "22";
                    renderMiniShape(els.targetShape, shape, color.hex);
                }
            }

            function syncDifficultyButtons() {
                const buttons = els.difficultyButtons?.querySelectorAll(
                    "[data-difficulty]",
                );
                buttons?.forEach((btn) => {
                    btn.classList.toggle(
                        "active",
                        btn.dataset.difficulty === state.difficulty,
                    );
                });
            }

            function renderBoard() {
                els.board.innerHTML = "";
                const { cols } = getBoardDimensions(state.sessionRound);
                els.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
                const tileColor = isShapeMode() ? "#e8eef8" : null;
                const frag = document.createDocumentFragment();
                state.items.forEach((item) => {
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "tile";
                    button.setAttribute("role", "gridcell");
                    button.setAttribute(
                        "aria-label",
                        isShapeMode()
                            ? `${shapeName(item.shape)}`
                            : `${colorName(item.color)} ${shapeName(item.shape)}`,
                    );
                    button.dataset.id = item.id;
                    button.innerHTML = createShapeSVG(
                        item.shape,
                        tileColor || item.color.hex,
                    );
                    frag.appendChild(button);
                });
                els.board.appendChild(frag);
                updateHUD();
            }

            function handleTileClick(id, tileEl) {
                if (!state.running || state.ended || state.paused) return;

                const item = state.itemMap.get(id);
                if (!item || item.done) return;

                if (item.isTarget) {
                    item.done = true;
                    state.hits += 1;
                    state.targetsRemaining -= 1;
                    state.score += 10;
                    tileEl.classList.add("correct", "done");
                    setTimeout(() => tileEl.classList.remove("correct"), 280);
                    playTone(720, 0.03, "sine");
                    posthog?.capture('tile_tap', { correct: true });
                } else {
                    state.wrong += 1;
                    state.score = Math.max(0, state.score - 3);
                    state.timeLeft = Math.max(0, state.timeLeft - 1);
                    state.startedAt -= 1000;
                    tileEl.classList.remove("wrong");
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            tileEl.classList.add("wrong");
                        });
                    });
                    setTimeout(() => tileEl.classList.remove("wrong"), 260);
                    playTone(220, 0.04, "triangle");
                    posthog?.capture('tile_tap', { correct: false });
                }

                updateHUD();

                if (state.targetsRemaining === 0) {
                    completeRound();
                }
            }

            function updateHUD() {
                const remaining = state.targetsRemaining;
                els.roundValue.textContent = formatLevelChip(state.sessionRound);
                els.scoreValue.textContent = state.score;
                els.hitsValue.textContent = state.hits;
                els.wrongValue.textContent = state.wrong;
                els.remainingValue.textContent = remaining;
                els.targetRemaining.textContent = `${remaining} ${getLang().left}`;
                els.timeText.textContent = Math.ceil(state.timeLeft);
                const p = Math.max(0, state.timeLeft / state.roundDuration);
                els.ringProgress.style.strokeDasharray = CIRC;
                els.ringProgress.style.strokeDashoffset = CIRC * (1 - p);
                state._lastP = p;
                state._lastHudUpdate = performance.now();
            }

            function startSession() {
                clearTimer();
                clearAdvance();
                state.running = false;
                state.ended = false;
                state.sessionRound = 1;
                state.roundsCleared = 0;
                state.score = 0;
                state.hits = 0;
                state.wrong = 0;
                state.bonusSeconds = 0;
                syncDifficultyButtons();
                posthog?.capture('game_started', {
                    difficulty: state.difficulty,
                    mode: state.mode,
                    language: state.language
                });
                beginRound();
            }

