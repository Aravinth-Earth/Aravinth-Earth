            function chooseTarget() {
                const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
                const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                return { color, shape };
            }

            function getBoardDimensions(level) {
                const size = 3 + Math.floor((level - 1) / 5);
                return { cols: size, rows: size, total: size * size };
            }

            function formatLevelChip(level) {
                const { cols } = getBoardDimensions(level);
                return `Lv ${level} · ${cols}x${cols}`;
            }

            function buildItems() {
                const { total } = getBoardDimensions(state.sessionRound);
                const items = [];
                state.target = chooseTarget();

                const minTargets = Math.max(4, Math.floor(total * 0.22));
                const maxTargets = Math.max(
                    minTargets + 1,
                    Math.floor(total * 0.34),
                );
                const targetCount = randomInt(minTargets, maxTargets);
                state.targetCount = targetCount;

                if (isShapeMode()) {
                    for (let i = 0; i < targetCount; i++) {
                        items.push({
                            id: cryptoRandomId(),
                            color: state.target.color,
                            shape: state.target.shape,
                            isTarget: true,
                            done: false,
                        });
                    }

                    while (items.length < total) {
                        const shape = SHAPES[
                            Math.floor(Math.random() * SHAPES.length)
                        ];
                        if (shape.name === state.target.shape.name) continue;

                        const color = COLORS[
                            Math.floor(Math.random() * COLORS.length)
                        ];
                        items.push({
                            id: cryptoRandomId(),
                            color,
                            shape,
                            isTarget: false,
                            done: false,
                        });
                    }
                } else {
                    for (let i = 0; i < targetCount; i++) {
                        items.push({
                            id: cryptoRandomId(),
                            color: state.target.color,
                            shape: state.target.shape,
                            isTarget: true,
                            done: false,
                        });
                    }

                    while (items.length < total) {
                        const color =
                            COLORS[Math.floor(Math.random() * COLORS.length)];
                        const shape =
                            SHAPES[Math.floor(Math.random() * SHAPES.length)];
                        const isTarget =
                            color.name === state.target.color.name &&
                            shape.name === state.target.shape.name;
                        if (isTarget) continue;

                        items.push({
                            id: cryptoRandomId(),
                            color,
                            shape,
                            isTarget: false,
                            done: false,
                        });
                    }
                }

                shuffle(items);
                state.items = items;
                state.itemMap = new Map(items.map((i) => [i.id, i]));
                state.targetsRemaining = targetCount;
            }

