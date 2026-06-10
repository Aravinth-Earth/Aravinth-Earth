            const STORAGE_KEY = "calmSweepStats.v1";
            const PREFS_KEY = "calmSweepPrefs.v1";
            const ROUND_SECONDS = 60;
            const RING_RADIUS = 42;
            const CIRC = 2 * Math.PI * RING_RADIUS;
            const DIFFICULTIES = {
                easy: { label: "Easy", baseTime: 11 },
                medium: { label: "Medium", baseTime: 9 },
                hard: { label: "Hard", baseTime: 7 },
                extraHard: { label: "Extra hard", baseTime: 5 },
            };
            const LANGUAGES = {
                en: {
                    title: "Calm Sweep",
                    eyebrow: "Calm attention game",
                    start: "Start session",
                    viewStats: "View stats",
                    resetStats: "Reset local stats",
                    difficulty: "Difficulty",
                    language: "Language",
                    howToPlay: "How to play",
                    howToPlayBody:
                        "Tap only the symbols that match the target shown at the top. Correct taps fade away. Wrong taps add a small penalty.",
                    localStats: "Local stats",
                    progress: "Your device-only progress",
                    backHome: "Back to home",
                    currentTarget: "Current target",
                    secondsLeft: "seconds left",
                    liveStats: "Live stats",
                    pause: "Pause",
                    resume: "Resume",
                    home: "Home",
                    roundComplete: "Round complete",
                    summary: "Your calm sweep summary",
                    summaryBody:
                        "A gentle snapshot of this round, saved only on this device.",
                    playAgain: "Play again",
                    paused: "Paused",
                    pausedBody: "The board is hidden until you resume.",
                    level: "Lv",
                    tapAll: "Tap all",
                    cleared: "Round cleared",
                    left: "left",
                    roundsLeft: "rounds",
                    completed: "Completed",
                    timeExpired: "Time expired",
                },
                ta: {
                    title: "அமைதி Sweep",
                    eyebrow: "அமைதியான கவன விளையாட்டு",
                    start: "விளையாட்டு தொடங்கு",
                    viewStats: "புள்ளிவிவரங்கள்",
                    resetStats: "புள்ளிவிவரங்களை மீட்டு அமை",
                    difficulty: "கடினம்",
                    language: "மொழி",
                    howToPlay: "எப்படி விளையாடுவது",
                    howToPlayBody:
                        "மேலே காட்டப்படும் இலக்குடன் பொருந்தும் குறிகளை மட்டுமே தட்டவும். சரியான தட்டல்கள் மறையும். தவறான தட்டல்கள் சிறிய தண்டனை தரும்.",
                    localStats: "உள்ளூர் புள்ளிவிவரங்கள்",
                    progress: "உங்கள் சாதனத்தில் மட்டும் சேமிப்பு",
                    backHome: "முகப்புக்கு",
                    currentTarget: "தற்போதைய இலக்கு",
                    secondsLeft: "விநாடிகள் மீதம்",
                    liveStats: "நேரடி புள்ளிவிவரங்கள்",
                    pause: "இடைநிறுத்தம்",
                    resume: "தொடரவும்",
                    home: "முகப்பு",
                    roundComplete: "சுற்று முடிந்தது",
                    summary: "உங்கள் அமைதியான சுருக்கம்",
                    summaryBody:
                        "இந்த சுற்றின் சுருக்கம், இந்த சாதனத்தில் மட்டும் சேமிக்கப்பட்டது.",
                    playAgain: "மீண்டும் விளையாடு",
                    paused: "இடைநிறுத்தப்பட்டது",
                    pausedBody: "நீங்கள் தொடரும் வரை பலகை மறைக்கப்பட்டுள்ளது.",
                    level: "நிலை",
                    tapAll: "அனைத்து",
                    cleared: "சுற்று முடிந்தது",
                    left: "மீதம்",
                    roundsLeft: "சுற்றுகள்",
                    completed: "முடிந்தது",
                    timeExpired: "நேரம் முடிந்தது",
                },
            };
            const MOBILE_ITEMS = 30;
            const DESKTOP_ITEMS = 36;

            const COLORS = [
                { name: "red", nameTa: "சிவப்பு", hex: "#ef4444" },
                { name: "orange", nameTa: "ஆரஞ்சு", hex: "#f97316" },
                { name: "yellow", nameTa: "மஞ்சள்", hex: "#fde047" },
                { name: "green", nameTa: "பச்சை", hex: "#22c55e" },
                { name: "blue", nameTa: "நீலம்", hex: "#3b82f6" },
                { name: "purple", nameTa: "ஊதா", hex: "#a855f7" },
                { name: "pink", nameTa: "இளஞ்சிவப்பு", hex: "#ec4899" },
            ];

            const SHAPES = [
                {
                    name: "circle",
                    nameTa: "வட்டம்",
                    svg: '<circle cx="50" cy="50" r="27" fill="currentColor" />',
                },
                {
                    name: "triangle",
                    nameTa: "முக்கோணம்",
                    svg: '<polygon points="50,18 82,78 18,78" fill="currentColor" />',
                },
                {
                    name: "diamond",
                    nameTa: "சாய்சதுரம்",
                    svg: '<polygon points="50,14 84,50 50,86 16,50" fill="currentColor" />',
                },
                {
                    name: "square",
                    nameTa: "சதுரம்",
                    svg: '<rect x="22" y="22" width="56" height="56" rx="10" fill="currentColor" />',
                },
                {
                    name: "star",
                    nameTa: "நட்சத்திரம்",
                    svg: '<polygon points="50,8 62,36 92,38 68,56 76,86 50,68 24,86 32,56 8,38 38,36" fill="currentColor" />',
                },
                {
                    name: "hexagon",
                    nameTa: "அறுகோணம்",
                    svg: '<polygon points="50,12 86,30 86,70 50,88 14,70 14,30" fill="currentColor" />',
                },
                {
                    name: "cross",
                    nameTa: "சிலுவை",
                    svg: '<path d="M60 18 L60 40 L82 40 L82 60 L60 60 L60 82 L40 82 L40 60 L18 60 L18 40 L40 40 L40 18 Z" fill="currentColor" />',
                },
            ];

