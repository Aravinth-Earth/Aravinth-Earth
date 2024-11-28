const state = {
    playerName: '',
    score: 0,
    level: 1,
    attempts: 0,
    currentAnswer: 0,
    correctCount: 0,
    incorrectCount: 0,
    skillRating: 1000, // Base ELO-like rating
    streak: 0,
    difficultyLevel: 1,
    performanceHistory: [], // Track last 10 answers
    lastQuestion: null, // Add this line
};

// Add these constants at the top
const GAME_LIMITS = {
    MAX_SKILL_RATING: 4000,
    MAX_DIFFICULTY: 50,
    MAX_STREAK_MULTIPLIER: 10,
    BASE_SCORES: { 1: 10, 2: 20, 3: 30, 4: 40 },
    STREAK_BONUS_BASE: 5,
    STREAK_INTERVAL: 3
};

// Add after state declaration
const logger = {
    logQuestion: (question, difficulty, numbers, operation) => {
        console.log(
            '%cNew Question Generated', 'color: #4CAF50; font-weight: bold',
            '\nDifficulty Level:', difficulty,
            '\nSkill Rating:', Math.round(state.skillRating),
            '\nStreak:', state.streak,
            '\nQuestion:', question,
            '\nNumbers:', numbers,
            '\nOperation:', operation
        );
    },
    logAnswer: (correct, userAnswer, attempt) => {
        console.log(
            `%cAnswer Attempt ${attempt}`, `color: ${correct ? '#4CAF50' : '#f44336'}; font-weight: bold`,
            '\nCorrect:', correct,
            '\nUser Answer:', userAnswer,
            '\nCorrect Answer:', state.currentAnswer,
            '\nNew Score:', state.score,
            '\nSuccess Rate:', `${Math.round((state.correctCount / (state.correctCount + state.incorrectCount)) * 100)}%`
        );
    },
    logPerformance: () => {
        console.table({
            skillRating: Math.round(state.skillRating),
            streak: state.streak,
            correctCount: state.correctCount,
            incorrectCount: state.incorrectCount,
            successRate: `${Math.round((state.correctCount / (state.correctCount + state.incorrectCount)) * 100)}%`,
            recentPerformance: state.performanceHistory.slice(-5)
        });
    }
};

// Add this function after state declaration
const resetState = () => {
    Object.assign(state, {
        playerName: '',
        score: 0,
        level: 1,
        attempts: 0,
        currentAnswer: 0,
        correctCount: 0,
        incorrectCount: 0,
        skillRating: 1000,
        streak: 0,
        difficultyLevel: 1,
        performanceHistory: [],
        lastQuestion: null // Add this line
    });
    
    // Reset UI elements
    document.getElementById('score').textContent = '0';
    document.getElementById('streak-counter').textContent = '0';
    document.getElementById('complexity-level').textContent = '1';
    document.getElementById('success-rate').textContent = '0%';
    document.getElementById('skill-rating').textContent = '1000';
    document.getElementById('correct-count').textContent = '0';
    document.getElementById('incorrect-count').textContent = '0';

    updateStats(); // Add this line
};

// Load saved state
const loadState = () => {
    const saved = JSON.parse(localStorage.getItem('mathGame')) || {};
    Object.assign(state, saved);
    const { playerName = '', level = 1, score = 0 } = state;
    document.getElementById('player-name').value = playerName;
    document.getElementById('difficulty').value = level;
    document.getElementById('score').textContent = score;
};

const saveState = () => {
    localStorage.setItem('mathGame', JSON.stringify(state));
};

const generateName = () => {
    const adjectives = ['Happy', 'Lucky', 'Clever', 'Bright', 'Quick'];
    const nouns = ['Wizard', 'Eagle', 'Tiger', 'Dolphin', 'Star'];
    const randomElement = arr => arr[Math.floor(Math.random() * arr.length)];
    const name = `${randomElement(adjectives)}${randomElement(nouns)}${Math.floor(Math.random() * 100)}`;
    document.getElementById('player-name').value = name;
};

const enableSubmitButton = () => {
    const answerInput = document.getElementById('answer');
    document.getElementById('submit-answer').disabled = !answerInput.value.trim();
};

// Modified updateSkillRating function
const updateSkillRating = (correct) => {
    const K = Math.max(8, 32 - Math.floor(state.correctCount / 100)); // K-factor decreases with experience
    const expectedScore = 1 / (1 + Math.pow(10, (1500 - state.skillRating) / 400));
    const actualScore = correct ? 1 : 0;
    
    state.skillRating = Math.min(
        GAME_LIMITS.MAX_SKILL_RATING,
        state.skillRating + K * (actualScore - expectedScore)
    );
    
    state.streak = correct ? state.streak + 1 : 0;
};

// Modified getDynamicDifficulty function
const getDynamicDifficulty = () => {
    const baseRange = Math.floor(state.skillRating / 100);
    const streakBonus = Math.min(
        Math.floor(state.streak / GAME_LIMITS.STREAK_INTERVAL),
        GAME_LIMITS.MAX_STREAK_MULTIPLIER
    );
    const performanceAdjustment = getPerformanceAdjustment();
    
    return Math.max(1, Math.min(GAME_LIMITS.MAX_DIFFICULTY, 
        baseRange + streakBonus + performanceAdjustment
    ));
};

const getPerformanceAdjustment = () => {
    if (state.performanceHistory.length < 5) return 0;
    const recentPerformance = state.performanceHistory.slice(-5);
    const successRate = recentPerformance.filter(x => x).length / 5;
    return successRate > 0.8 ? 1 : successRate < 0.3 ? -1 : 0;
};

// Add this function to calculate levelup thresholds
const getLevelupThreshold = (level) => {
    return Math.floor(100 * Math.pow(2, level - 1));
};

// Add this function to get logarithmic number ranges
const getNumberRange = (difficulty) => {
    const base = Math.min(10, Math.floor(difficulty / 10) + 1);
    const maxRange = Math.pow(base, 2);
    return {
        min: Math.max(1, Math.floor(maxRange / 10)),
        max: maxRange
    };
};

// Modify generateQuestion function
const generateQuestion = () => {
    const operations = {
        1: ['+', '-'],
        2: ['*', '/'],
        3: ['+', '-', '*', '/'],
        4: ['+', '-', '*', '/']
    };

    const { level } = state;
    const ops = operations[level];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    // Get dynamic difficulty based on skill rating and performance
    const difficulty = getDynamicDifficulty();
    const range = getNumberRange(difficulty);
    
    // Generate numbers with progressive complexity
    let num1, num2;
    switch(op) {
        case '/':
            num2 = Math.max(1, Math.floor(Math.random() * (range.max / 10)));
            num1 = num2 * Math.max(1, Math.floor(Math.random() * (range.max / 10)));
            break;
        case '*':
            num1 = Math.floor(Math.random() * Math.sqrt(range.max));
            num2 = Math.floor(Math.random() * Math.sqrt(range.max));
            break;
        default:
            num1 = Math.floor(Math.random() * range.max) + range.min;
            num2 = Math.floor(Math.random() * range.max) + range.min;
    }

    // Check if question is same as last one
    const question = `${num1} ${op} ${num2}`;
    if (question === state.lastQuestion) {
        // Regenerate question if it's the same
        return generateQuestion();
    }
    
    state.lastQuestion = question;
    state.currentAnswer = eval(question);
    document.getElementById('question').textContent = question;
    document.getElementById('answer').value = '';
    document.getElementById('message').textContent = '';
    document.getElementById('submit-answer').classList.remove('hidden');
    document.getElementById('submit-answer').disabled = true;

    // Add complexity calculation
    const complexity = {
        numbers: [num1, num2],
        operation: op,
        range: range.max,
        difficulty: difficulty
    };

    logger.logQuestion(question, difficulty, [num1, num2], op);
    
    // Update UI stats
    document.getElementById('complexity-level').textContent = Math.round(difficulty);
    document.getElementById('streak-counter').textContent = state.streak;
    const successRate = state.correctCount + state.incorrectCount > 0 
        ? Math.round((state.correctCount / (state.correctCount + state.incorrectCount)) * 100)
        : 0;
    document.getElementById('success-rate').textContent = `${successRate}%`;

    updateStats(); // Add this line at the end

    updateDifficultyIndicator();
    
    // Start timer animation
    const timer = document.querySelector('.timer-bar');
    timer.classList.remove('timer-active');
    void timer.offsetWidth; // Force reflow
    timer.classList.add('timer-active');
};

// Modified checkAnswer function
const checkAnswer = () => {
    const userAnswer = parseFloat(document.getElementById('answer').value);
    const messageEl = document.getElementById('message');
    const submitButton = document.getElementById('submit-answer');
    const correct = userAnswer === state.currentAnswer;
    
    // Update skill rating and performance history
    updateSkillRating(correct);
    state.performanceHistory.push(correct);
    if (state.performanceHistory.length > 10) {
        state.performanceHistory.shift();
    }

    logger.logAnswer(correct, userAnswer, state.attempts);
    logger.logPerformance();

    if (!correct) {
        document.getElementById('answer').classList.add('shake-wrong');
        // Remove class after animation completes
        setTimeout(() => {
            document.getElementById('answer').classList.remove('shake-wrong');
        }, 500);
    }

    if (correct) {
        const baseScore = GAME_LIMITS.BASE_SCORES[state.level];
        const streakMultiplier = Math.min(
            Math.floor(state.streak / GAME_LIMITS.STREAK_INTERVAL),
            GAME_LIMITS.MAX_STREAK_MULTIPLIER
        );
        const streakBonus = GAME_LIMITS.STREAK_BONUS_BASE * streakMultiplier;
        const difficultyBonus = Math.floor(getDynamicDifficulty() / 10);

        // Calculate total score with diminishing returns
        const totalScore = baseScore + 
            Math.floor(streakBonus * (1 - state.correctCount / 10000)) + 
            Math.min(difficultyBonus * baseScore / 2, baseScore);

        state.score += totalScore;
        state.attempts = 0;
        state.correctCount += 1; // Increment correct count
        // Remove this line to prevent incorrectCount from resetting
        // state.incorrectCount = 0; // Optionally reset incorrect count on correct answer
        document.getElementById('score').textContent = state.score;
        
        messageEl.textContent = `🎉 Correct! ${state.streak > 2 ? `Streak bonus: +${streakBonus}!` : ''}`;
        messageEl.className = 'success';
        saveState();
        setTimeout(generateQuestion, 1000);

        // Add floating score animation
        const rect = document.getElementById('score').getBoundingClientRect();
        createFloatingScore(totalScore, rect.left, rect.top);
        
        // Add pulse animation to streak counter
        const streakEl = document.getElementById('streak-counter');
        streakEl.classList.add('pulse-streak');
        setTimeout(() => streakEl.classList.remove('pulse-streak'), 500);
    } else {
        state.attempts++;

        if (state.attempts >= 3) {
            messageEl.textContent = `The correct answer was ${state.currentAnswer}. Click "Next Question" to continue.`;
            messageEl.className = 'failure';

            state.incorrectCount += 1; // Increment incorrect count when failed all attempts

            state.attempts = 0;
            document.getElementById('next-question').classList.remove('hidden');
            submitButton.classList.add('hidden');
            updateStats(); // Update stats after incrementing incorrectCount
        } else {
            messageEl.textContent = `Wrong answer! Try again! (${3 - state.attempts} attempts left)`;
            messageEl.className = 'failure';
        }
    }
    updateStats(); // Ensure stats are updated
};

const toggleTheme = () => {
    const body = document.body;
    const container = document.querySelector('.container');
    const buttons = document.querySelectorAll('button');
    const scoreDisplay = document.getElementById('score-display');
    const isDark = body.classList.toggle('dark-theme');
    body.classList.toggle('light-theme', !isDark);
    container.classList.toggle('dark-theme', isDark);
    container.classList.toggle('light-theme', !isDark);
    scoreDisplay.classList.toggle('dark-theme', isDark);
    scoreDisplay.classList.toggle('light-theme', !isDark);
    buttons.forEach(button => {
        button.classList.toggle('dark-theme', isDark);
        button.classList.toggle('light-theme', !isDark);
    });
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

const themes = [
    'blue', 'green', 'red', 'purple', 'orange',
    'yellow', 'pink', 'teal', 'brown', 'gray',
    'cyan', 'lime', 'indigo', 'amber', 'deep-orange'
];

const toggleColorTheme = () => {
    const body = document.body;
    const buttons = document.querySelectorAll('button');
    let currentTheme = null; // Remove retrieval from localStorage
    let randomTheme = themes[Math.floor(Math.random() * themes.length)];

    // Ensure a new random theme is selected
    body.classList.forEach(cls => {
        if (cls.startsWith('theme-')) {
            body.classList.remove(cls);
            buttons.forEach(button => button.classList.remove(cls));
        }
    });

    body.classList.add(`theme-${randomTheme}`);
    buttons.forEach(button => {
        button.classList.add(`theme-${randomTheme}`);
    });

    // Do not store colorTheme in localStorage
};

// Add stats toggle function
const toggleStats = () => {
    const statsPanel = document.querySelector('.stats-panel');
    const isCollapsed = statsPanel.classList.toggle('collapsed');
    localStorage.setItem('statsCollapsed', isCollapsed);
    
    // Update toggle button icon
    const toggleIcon = document.querySelector('#toggle-stats i');
    toggleIcon.className = isCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
};

// Add updateStats function
const updateStats = () => {
    const total = state.correctCount + state.incorrectCount;
    const successRate = total > 0 ? ((state.correctCount / total) * 100).toFixed(3) : '0.0';
    
    // Update all stats
    document.getElementById('streak-counter').textContent = state.streak;
    document.getElementById('complexity-level').textContent = Math.round(getDynamicDifficulty());
    document.getElementById('success-rate').textContent = `${successRate}%`;
    document.getElementById('skill-rating').textContent = Math.round(state.skillRating);
    document.getElementById('correct-count').textContent = state.correctCount;
    document.getElementById('incorrect-count').textContent = state.incorrectCount;

    logger.logPerformance();
    updateThresholdIndicators();
};

const createFloatingScore = (score, x, y) => {
    const el = document.createElement('div');
    el.className = 'floating-score';
    el.textContent = `+${score}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
};

const updateDifficultyIndicator = () => {
    const indicator = document.querySelector('.difficulty-indicator');
    const difficulty = getDynamicDifficulty();
    const classes = {
        easy: difficulty <= 25,
        medium: difficulty > 25 && difficulty <= 50,
        hard: difficulty > 50 && difficulty <= 75,
        expert: difficulty > 75
    };
    
    indicator.className = 'difficulty-indicator ' + 
        Object.keys(classes).find(key => classes[key]);
};

const createThresholdIndicators = () => {
    const statsItems = document.querySelectorAll('.stat-item');
    
    statsItems.forEach(item => {
        const value = item.querySelector('.value');
        const type = value.id;
        
        if (['skill-rating', 'streak-counter'].includes(type)) {
            const indicator = document.createElement('div');
            indicator.className = 'threshold-indicator';
            
            const fill = document.createElement('div');
            fill.className = 'threshold-fill';
            
            const cap = type === 'skill-rating' ? 
                GAME_LIMITS.MAX_SKILL_RATING : 
                GAME_LIMITS.MAX_STREAK_MULTIPLIER * GAME_LIMITS.STREAK_INTERVAL;
            
            indicator.appendChild(fill);
            item.appendChild(indicator);
            
            // Add cap marker
            const marker = document.createElement('div');
            marker.className = 'threshold-marker';
            marker.style.left = '100%';
            const label = document.createElement('span');
            label.className = 'threshold-label';
            label.textContent = `Max: ${cap}`;
            marker.appendChild(label);
            indicator.appendChild(marker);
        }
    });
};

const updateThresholdIndicators = () => {
    const skillFill = document.querySelector('#skill-rating')
        .parentElement.querySelector('.threshold-fill');
    const streakFill = document.querySelector('#streak-counter')
        .parentElement.querySelector('.threshold-fill');
    
    if (skillFill) {
        const skillPercent = (state.skillRating / GAME_LIMITS.MAX_SKILL_RATING) * 100;
        skillFill.style.width = `${Math.min(100, skillPercent)}%`;
        if (skillPercent >= 95) skillFill.classList.add('cap-warning');
    }
    
    if (streakFill) {
        const maxStreak = GAME_LIMITS.MAX_STREAK_MULTIPLIER * GAME_LIMITS.STREAK_INTERVAL;
        const streakPercent = (state.streak / maxStreak) * 100;
        streakFill.style.width = `${Math.min(100, streakPercent)}%`;
        if (streakPercent >= 95) streakFill.classList.add('cap-warning');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadState();

    // Auto-generate a random name if none is saved
    if (!state.playerName) {
        generateName();
    }

    document.getElementById('generate-name').addEventListener('click', generateName);
    document.getElementById('start-game').addEventListener('click', () => {
        state.playerName = document.getElementById('player-name').value;
        state.level = parseInt(document.getElementById('difficulty').value);
        if (!state.playerName) return alert('Please enter a name!');
        
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('user-name').textContent = state.playerName;
        document.getElementById('current-difficulty').textContent = document.getElementById('difficulty').selectedOptions[0].text;
        saveState();
        generateQuestion();
    });

    // Modify the reset-game click handler
    document.getElementById('reset-game').addEventListener('click', () => {
        localStorage.removeItem('mathGame');
        resetState();
        generateName();
        document.getElementById('difficulty').value = '1';
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
    });

    document.getElementById('submit-answer').addEventListener('click', checkAnswer);
    document.getElementById('answer').addEventListener('input', enableSubmitButton);
    document.getElementById('answer').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !document.getElementById('submit-answer').disabled) checkAnswer();
    });

    document.getElementById('next-question').addEventListener('click', () => {
        generateQuestion();
        document.getElementById('next-question').classList.add('hidden');
    });

    document.getElementById('back-to-menu').addEventListener('click', () => {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('welcome-screen').classList.remove('hidden');
    });

    // Apply a random color theme on load
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    document.body.classList.add(`theme-${randomTheme}`);
    document.querySelectorAll('button').forEach(button => {
        button.classList.add(`theme-${randomTheme}`);
    });

    // Attach event listeners for theme toggles
    document.querySelectorAll('.toggle-theme').forEach(button => {
        button.addEventListener('click', toggleTheme);
    });

    document.querySelectorAll('.toggle-color-theme').forEach(button => {
        button.addEventListener('click', toggleColorTheme);
    });

    // Set initial stats panel state
    const statsCollapsed = localStorage.getItem('statsCollapsed') === 'true';
    if (statsCollapsed) {
        document.querySelector('.stats-panel').classList.add('collapsed');
        document.querySelector('#toggle-stats i').className = 'fas fa-chevron-down';
    }

    // Add stats toggle listener
    document.getElementById('toggle-stats').addEventListener('click', toggleStats);
    
    createThresholdIndicators();
    
    // Add info overlay handlers
    document.getElementById('show-info').addEventListener('click', () => {
        document.querySelector('.info-overlay').classList.add('visible');
    });
    
    document.querySelector('.info-close').addEventListener('click', () => {
        document.querySelector('.info-overlay').classList.remove('visible');
    });
    
    // Close overlay on outside click
    document.querySelector('.info-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.target.classList.remove('visible');
        }
    });
});