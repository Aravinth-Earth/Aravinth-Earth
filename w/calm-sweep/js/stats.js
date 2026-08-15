            function loadStats() {
                try {
                    const parsed = JSON.parse(
                        localStorage.getItem(STORAGE_KEY),
                    );
                    if (parsed && typeof parsed === "object") {
                        if (Array.isArray(parsed.sessions)) return parsed;
                        return {
                            ...parsed,
                            sessions: [],
                        };
                    }
                } catch (_) {}
                return {
                    plays: 0,
                    bestScore: 0,
                    avgAccuracy: 0,
                    totalHits: 0,
                    bestAccuracy: 0,
                    bestRounds: 0,
                    totalRoundsCleared: 0,
                    lastPlayed: null,
                    sessions: [],
                };
            }

            function saveStats(session) {
                const stats = loadStats();
                const plays = stats.plays + 1;
                const accuracy =
                    session.hits + session.wrong === 0
                        ? 0
                        : session.hits / (session.hits + session.wrong);
                const avgAccuracy =
                    (stats.avgAccuracy * stats.plays + accuracy) / plays;

                const next = {
                    plays,
                    bestScore: Math.max(stats.bestScore, session.score),
                    avgAccuracy,
                    totalHits: stats.totalHits + session.hits,
                    bestAccuracy: Math.max(stats.bestAccuracy, accuracy),
                    bestRounds: Math.max(
                        stats.bestRounds,
                        session.roundsCleared,
                    ),
                    totalRoundsCleared:
                        stats.totalRoundsCleared + session.roundsCleared,
                    lastPlayed: new Date().toISOString(),
                    sessions: [
                        {
                            playedAt: new Date().toISOString(),
                            score: session.score,
                            accuracy,
                            roundsCleared: session.roundsCleared,
                            roundReached: session.roundReached,
                            difficulty: state.difficulty,
                        },
                        ...stats.sessions,
                    ].slice(0, 25),
                };

                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                renderLifetimeStats();
            }

            function resetStats() {
                localStorage.removeItem(STORAGE_KEY);
                renderLifetimeStats();
            }

            function renderLifetimeStats() {
                const stats = loadStats();
                const t = getLang();
                const cards = [
                    [t.totalSessions ?? "Total sessions", stats.plays],
                    [t.bestScore ?? "Best score", stats.bestScore],
                    [t.avgAccuracy ?? "Avg accuracy", `${Math.round(stats.avgAccuracy * 100)}%`],
                    [t.totalHits ?? "Total hits", stats.totalHits],
                    [t.bestRounds ?? "Best rounds", stats.bestRounds],
                    [t.roundsCleared ?? "Rounds cleared", stats.totalRoundsCleared],
                    [t.bestAccuracy ?? "Best accuracy", `${Math.round(stats.bestAccuracy * 100)}%`],
                    [
                        t.lastPlayed ?? "Last played",
                        stats.lastPlayed
                            ? new Date(stats.lastPlayed).toLocaleDateString()
                            : "—",
                    ],
                ];

                const sessionRows = stats.sessions
                    .map(
                        (session, index) => `
        <div class="stat">
          <div class="stat-label">${t.session ?? "Session"} ${stats.sessions.length - index}</div>
          <div class="stat-value">${session.score} <span class="muted" style="font-size:0.78rem;font-weight:600;">${Math.round(session.accuracy * 100)}%</span></div>
           <div class="muted" style="font-size:0.78rem; margin-top:6px;">${session.difficulty} · ${session.mode || "color"} · ${session.roundsCleared} rounds · ${new Date(session.playedAt).toLocaleDateString()}</div>
        </div>
      `,
                    )
                    .join("");

                els.lifetimeStats.innerHTML =
                    cards
                        .map(
                            ([label, value]) => `
        <div class="stat">
          <div class="stat-label">${label}</div>
          <div class="stat-value">${value}</div>
        </div>
      `,
                        )
                        .join("") +
                    sessionRows;
            }
