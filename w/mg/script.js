// Game Configuration and Constants
const GAME_LIMITS = {
    MAX_SKILL_RATING: 4000,
    MAX_DIFFICULTY: 50,
    MAX_STREAK_MULTIPLIER: 10,
    BASE_SCORES: { 1: 10, 2: 20, 3: 30, 4: 40 },
    STREAK_BONUS_BASE: 5,
    STREAK_INTERVAL: 3,
    THEMES: [
        'blue', 'green', 'red', 'purple', 'orange',
        'yellow', 'pink', 'teal', 'brown', 'gray',
        'cyan', 'lime', 'indigo', 'amber', 'deep-orange'
    ],
    NAME_GENERATOR: {
        ADJECTIVES: ['Happy', 'Lucky', 'Clever', 'Bright', 'Quick'],
        NOUNS: ['Wizard', 'Eagle', 'Tiger', 'Dolphin', 'Star']
    }
};

// Utility Functions
const utils = {
    random: (arr) => arr[Math.floor(Math.random() * arr.length)],
    clamp: (num, min, max) => Math.min(Math.max(num, min), max),
    generateName: () => {
        const adj = utils.random(GAME_LIMITS.NAME_GENERATOR.ADJECTIVES);
        const noun = utils.random(GAME_LIMITS.NAME_GENERATOR.NOUNS);
        return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
    }
};

// Update logger to only log when game is active
const logger = {
    enabled: false,
    logQuestion: (question, difficulty, numbers, operation) => {
        if (!logger.enabled) return;
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
        if (!logger.enabled) return;
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
        if (!logger.enabled) return;
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

// Game State
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
    correctFirstAttempt: 0,
    correctSecondAttempt: 0,
    correctThirdAttempt: 0,
    questionCounter: 0,
    selectedDifficulty: '',
};

// Core Game Logic
const game = {
    init() {
        this.loadState();
        this.setupEventListeners();
        this.applyInitialTheme();
        logger.enabled = true; // Enable logging after init
    },

    loadState() {
        const saved = JSON.parse(localStorage.getItem('mathGame')) || {};
        Object.assign(state, saved);
        this.updateUI();
    },

    saveState() {
        localStorage.setItem('mathGame', JSON.stringify(state));
    },

    resetState() {
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
            lastQuestion: null,
            correctFirstAttempt: 0,
            correctSecondAttempt: 0,
            correctThirdAttempt: 0,
            questionCounter: 0,
            selectedDifficulty: '',
        });
        this.updateUI();
    },

    updateUI() {
        const total = state.correctCount + state.incorrectCount;
        const successRate = total > 0 ? ((state.correctCount / total) * 100).toFixed(3) : '0.0';
        
        // Update all stats
        document.getElementById('streak-counter').textContent = state.streak;
        document.getElementById('success-rate').textContent = `${successRate}%`;
        document.getElementById('skill-rating').textContent = Math.round(state.skillRating);
        document.getElementById('correct-count').textContent = state.correctCount;
        document.getElementById('incorrect-count').textContent = state.incorrectCount;
        document.getElementById('first-attempt-count').textContent = state.correctFirstAttempt;
        document.getElementById('second-attempt-count').textContent = state.correctSecondAttempt;
        document.getElementById('third-attempt-count').textContent = state.correctThirdAttempt;
    
        logger.logPerformance();
        ui.updateThresholdIndicators();
    },

    generateQuestion() {
        // Hide the next question button whenever generating a new question
        document.getElementById('next-question').classList.add('hidden');
        
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
        const difficulty = this.getDynamicDifficulty();
        const range = this.getNumberRange(difficulty);
        
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
            return this.generateQuestion();
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
    
        this.updateUI(); // Add this line at the end
    
        ui.updateDifficultyIndicator();
        
        // Start timer animation
        const timer = document.querySelector('.timer-bar');
        timer.classList.remove('timer-active');
        void timer.offsetWidth; // Force reflow
        timer.classList.add('timer-active');

        const submitButton = document.getElementById('submit-answer');
        submitButton.disabled = false; // Re-enable the submit button for the new question

        state.questionCounter++;
        document.getElementById('question-counter').textContent = state.questionCounter;
    },

    checkAnswer() {
        const userAnswer = parseFloat(document.getElementById('answer').value);
        const messageEl = document.getElementById('message');
        const submitButton = document.getElementById('submit-answer');
        const correct = userAnswer === state.currentAnswer;
        
        // Update skill rating and performance history
        this.updateSkillRating(correct);
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
            // Update attempt counters based on current attempt number
            // attempts start from 0, so add 1 for correct counting
            const currentAttemptNumber = state.attempts + 1;
            if (currentAttemptNumber === 1) {
                state.correctFirstAttempt++;
            } else if (currentAttemptNumber === 2) {
                state.correctSecondAttempt++;
            } else if (currentAttemptNumber === 3) {
                state.correctThirdAttempt++;
            }
    
            const baseScore = GAME_LIMITS.BASE_SCORES[state.level];
            const streakMultiplier = Math.min(
                Math.floor(state.streak / GAME_LIMITS.STREAK_INTERVAL),
                GAME_LIMITS.MAX_STREAK_MULTIPLIER
            );
            const streakBonus = GAME_LIMITS.STREAK_BONUS_BASE * streakMultiplier;
            const difficultyBonus = Math.floor(this.getDynamicDifficulty() / 10);
    
            // Calculate total score with diminishing returns
            const totalScore = baseScore + 
                Math.floor(streakBonus * (1 - state.correctCount / 10000)) + 
                Math.min(difficultyBonus * baseScore / 2, baseScore);
    
            state.score += totalScore;
            state.correctCount += 1;
            state.attempts = 0; // Reset attempts
            document.getElementById('score').textContent = state.score;
            
            messageEl.textContent = `🎉 Correct! ${state.streak > 2 ? `Streak bonus: +${streakBonus}!` : ''}`;
            messageEl.className = 'success';
            this.saveState();
            setTimeout(this.generateQuestion.bind(this), 1000);
    
            // Add floating score animation
            const rect = document.getElementById('score').getBoundingClientRect();
            ui.createFloatingScore(totalScore, rect.left, rect.top);
            
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
            } else {
                messageEl.textContent = `Wrong answer! Try again! (${3 - state.attempts} attempts left)`;
                messageEl.className = 'failure';
            }
        }
        this.updateUI(); // Ensure stats are updated

        submitButton.disabled = true; // Disable the submit button after clicking
    },

    setupEventListeners() {
        document.getElementById('generate-name').addEventListener('click', handlers.onGenerateName);
        document.getElementById('start-game').addEventListener('click', handlers.onStartGame);
        document.getElementById('reset-game').addEventListener('click', handlers.onResetGame);
        document.getElementById('submit-answer').addEventListener('click', this.checkAnswer.bind(this));
        document.getElementById('answer').addEventListener('input', () => this.enableSubmitButton());
        document.getElementById('answer').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !document.getElementById('submit-answer').disabled) this.checkAnswer();
        });
        document.getElementById('next-question').addEventListener('click', () => {
            this.generateQuestion();
            document.getElementById('next-question').classList.add('hidden');
        });
        document.getElementById('back-to-menu').addEventListener('click', () => {
            document.getElementById('game-screen').classList.add('hidden');
            document.getElementById('welcome-screen').classList.remove('hidden');
        });
        document.querySelectorAll('.toggle-theme').forEach(button => {
            button.addEventListener('click', ui.toggleTheme);
        });
        document.querySelectorAll('.toggle-color-theme').forEach(button => {
            button.addEventListener('click', ui.toggleColorTheme);
        });
        document.getElementById('toggle-stats').addEventListener('click', ui.toggleStats);
        document.getElementById('show-info').addEventListener('click', () => {
            document.querySelector('.info-overlay').classList.add('visible');
        });
        document.querySelector('.info-close').addEventListener('click', () => {
            document.querySelector('.info-overlay').classList.remove('visible');
        });
        document.querySelector('.info-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.target.classList.remove('visible');
            }
        });
        document.getElementById('answer').addEventListener('focus', () => {
            setTimeout(() => {
                document.getElementById('answer').scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
        document.getElementById('show-version-history').addEventListener('click', () => {
            document.querySelector('.version-overlay').classList.add('visible');
        });
        document.querySelector('.version-overlay .info-close').addEventListener('click', () => {
            document.querySelector('.version-overlay').classList.remove('visible');
        });
    },

    applyInitialTheme() {
        // Start with dark theme
        document.body.classList.add('dark-theme');
        document.querySelector('.container').classList.add('dark-theme');
        
        // Apply random color theme
        const randomTheme = GAME_LIMITS.THEMES[Math.floor(Math.random() * GAME_LIMITS.THEMES.length)];
        document.body.classList.add(`theme-${randomTheme}`);
        document.querySelectorAll('button').forEach(button => {
            button.classList.add(`theme-${randomTheme}`);
        });
        
        const statsCollapsed = localStorage.getItem('statsCollapsed') === 'true';
        if (statsCollapsed) {
            document.querySelector('.stats-panel').classList.add('collapsed');
            document.querySelector('#toggle-stats i').className = 'fas fa-chevron-down';
        }
        ui.createThresholdIndicators();
    },

    enableSubmitButton() {
        const answerInput = document.getElementById('answer');
        document.getElementById('submit-answer').disabled = !answerInput.value.trim();
    },

    updateSkillRating(correct) {
        const K = Math.max(8, 32 - Math.floor(state.correctCount / 100)); // K-factor decreases with experience
        const expectedScore = 1 / (1 + Math.pow(10, (1500 - state.skillRating) / 400));
        const actualScore = correct ? 1 : 0;
        
        state.skillRating = Math.min(
            GAME_LIMITS.MAX_SKILL_RATING,
            state.skillRating + K * (actualScore - expectedScore)
        );
        
        state.streak = correct ? state.streak + 1 : 0;
    },

    getDynamicDifficulty() {
        const baseRange = Math.floor(state.skillRating / 100);
        const streakBonus = Math.min(
            Math.floor(state.streak / GAME_LIMITS.STREAK_INTERVAL),
            GAME_LIMITS.MAX_STREAK_MULTIPLIER
        );
        const performanceAdjustment = this.getPerformanceAdjustment();
        
        return Math.max(1, Math.min(GAME_LIMITS.MAX_DIFFICULTY, 
            baseRange + streakBonus + performanceAdjustment
        ));
    },

    getPerformanceAdjustment() {
        if (state.performanceHistory.length < 5) return 0;
        const recentPerformance = state.performanceHistory.slice(-5);
        const successRate = recentPerformance.filter(x => x).length / 5;
        return successRate > 0.8 ? 1 : successRate < 0.3 ? -1 : 0;
    },

    getNumberRange(difficulty) {
        // Update number range calculation to be more diverse from start
        const minBase = Math.max(2, Math.floor(difficulty / 5));
        const maxBase = Math.min(20, Math.floor(difficulty / 2) + 5);
        
        return {
            min: minBase,
            max: Math.max(maxBase * 2, 10) // Ensure minimum range of 10
        };
    },

    generateQuestion() {
        // Hide the next question button whenever generating a new question
        document.getElementById('next-question').classList.add('hidden');
        
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
        const difficulty = this.getDynamicDifficulty();
        const range = this.getNumberRange(difficulty);
        
        // Enhanced number generation logic
        let num1, num2;
        const trivialNumbers = [0, 1];
        
        switch(op) {
            case '/':
                do {
                    num2 = Math.max(2, Math.floor(Math.random() * (range.max / 4)));
                    num1 = num2 * Math.floor(Math.random() * (range.max / 4) + 2);
                } while (trivialNumbers.includes(num1) || trivialNumbers.includes(num2));
                break;
                
            case '*':
                do {
                    num1 = Math.floor(Math.random() * (Math.sqrt(range.max)) + 2);
                    num2 = Math.floor(Math.random() * (Math.sqrt(range.max)) + 2);
                } while (trivialNumbers.includes(num1) || trivialNumbers.includes(num2));
                break;
                
            case '-':
                // New specific logic for subtraction
                do {
                    // Make first number larger 80% of the time
                    if (Math.random() < 0.8) {
                        num1 = Math.floor(Math.random() * (range.max - range.min)) + range.min + Math.floor(range.max / 4);
                        num2 = Math.floor(Math.random() * (num1 - range.min)) + range.min;
                    } else {
                        // Sometimes allow smaller first number for variety
                        num1 = Math.floor(Math.random() * (range.max - range.min)) + range.min;
                        num2 = Math.floor(Math.random() * (range.max - range.min)) + range.min;
                    }
                    
                    // Prevent trivial calculations
                    if (num1 === num2 || trivialNumbers.includes(num2)) continue;
                    break;
                } while (true);
                break;
                
            default: // Addition
                do {
                    num1 = Math.floor(Math.random() * (range.max - range.min)) + range.min;
                    num2 = Math.floor(Math.random() * (range.max - range.min)) + range.min;
                    if (trivialNumbers.includes(num2)) continue;
                    break;
                } while (true);
        }

        // Check if this exact question was asked in last 5 questions
        const question = `${num1} ${op} ${num2}`;
        if (!state.lastQuestions) state.lastQuestions = [];
        
        if (state.lastQuestions.includes(question)) {
            return this.generateQuestion(); // Try again if question was recent
        }
        
        // Keep track of last 5 questions
        state.lastQuestions.push(question);
        if (state.lastQuestions.length > 5) {
            state.lastQuestions.shift();
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
    
        this.updateUI(); // Add this line at the end
    
        ui.updateDifficultyIndicator();
        
        // Start timer animation
        const timer = document.querySelector('.timer-bar');
        timer.classList.remove('timer-active');
        void timer.offsetWidth; // Force reflow
        timer.classList.add('timer-active');

        const submitButton = document.getElementById('submit-answer');
        submitButton.disabled = false; // Re-enable the submit button for the new question

        state.questionCounter++;
        document.getElementById('question-counter').textContent = state.questionCounter;
    }
};

// UI Management
const ui = {
    elements: {
        playerName: document.getElementById('player-name'),
        score: document.getElementById('score'),
        // ... cache other frequently used elements
    },

    createFloatingScore(score, x, y) {
        const el = document.createElement('div');
        el.className = 'floating-score';
        el.textContent = `+${score}`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    },

    createThresholdIndicators() {
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
    },

    updateThresholdIndicators() {
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
    },

    updateDifficultyIndicator() {
        const indicator = document.querySelector('.difficulty-indicator');
        if (!indicator) return; // Safety check
        
        const difficulty = game.getDynamicDifficulty();
        let difficultyClass = 'easy';
        
        if (difficulty > 75) difficultyClass = 'expert';
        else if (difficulty > 50) difficultyClass = 'hard';
        else if (difficulty > 25) difficultyClass = 'medium';
        
        indicator.className = `difficulty-indicator difficulty-${difficultyClass}`;
    },

    toggleTheme() {
        const body = document.body;
        const container = document.querySelector('.container');
        const buttons = document.querySelectorAll('button');
        const scoreDisplay = document.getElementById('score-display');
        const infoContent = document.querySelector('.info-content');
        const gameControls = document.querySelector('.game-controls');
        const isDark = body.classList.toggle('dark-theme');
        
        body.classList.toggle('light-theme', !isDark);
        container.classList.toggle('dark-theme', isDark);
        container.classList.toggle('light-theme', !isDark);
        
        // Apply theme to info content
        if (infoContent) {
            infoContent.style.background = isDark ? '#333' : '#fff';
            infoContent.style.color = isDark ? '#fff' : '#000';
        }
        
        // Only toggle score-display if it exists
        if (scoreDisplay) {
            scoreDisplay.classList.toggle('dark-theme', isDark);
            scoreDisplay.classList.toggle('light-theme', !isDark);
        }

        // Toggle theme for game controls
        if (gameControls) {
            gameControls.classList.toggle('dark-theme', isDark);
            gameControls.classList.toggle('light-theme', !isDark);
        }

        buttons.forEach(button => {
            button.classList.toggle('dark-theme', isDark);
            button.classList.toggle('light-theme', !isDark);
        });
        
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    },

    toggleColorTheme() {
        const body = document.body;
        const buttons = document.querySelectorAll('button');
        const randomTheme = GAME_LIMITS.THEMES[Math.floor(Math.random() * GAME_LIMITS.THEMES.length)];
    
        body.classList.forEach(cls => {
            if (cls.startsWith('theme-')) {
                body.classList.remove(cls);
                buttons.forEach(button => button.classList.remove(cls));
            }
        });
    
        body.classList.add(`theme-${randomTheme}`);
        buttons.forEach(button => button.classList.add(`theme-${randomTheme}`));
    },

    toggleStats() {
        const statsPanel = document.querySelector('.stats-panel');
        const isCollapsed = statsPanel.classList.toggle('collapsed');
        localStorage.setItem('statsCollapsed', isCollapsed);
        
        // Update toggle button icon
        const toggleIcon = document.querySelector('#toggle-stats i');
        toggleIcon.className = isCollapsed ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    }
};

// Event Handlers
const handlers = {
    onGenerateName() {
        ui.elements.playerName.value = utils.generateName();
    },

    onStartGame() {
        const playerName = document.getElementById('player-name').value;
        if (!playerName) return alert('Please enter a name!');
        
        // Set initial game state
        state.playerName = playerName;
        state.level = parseInt(document.getElementById('difficulty').value) || 1;
        
        // Update UI elements
        document.getElementById('user-name').textContent = state.playerName;
        
        // Add these lines to properly update the selected difficulty
        const difficultySelect = document.getElementById('difficulty');
        state.selectedDifficulty = difficultySelect.options[difficultySelect.selectedIndex].text;
        document.getElementById('selected-difficulty').textContent = state.selectedDifficulty;
        
        // Reset question counter when starting new game
        state.questionCounter = 0;
        document.getElementById('question-counter').textContent = '0';
        
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        // Start the game
        game.generateQuestion();
    },

    onResetGame() {
        localStorage.removeItem('mathGame');
        game.resetState();
        handlers.onGenerateName();
        // ...rest of reset logic...
    },

    // ... other event handlers
};

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    game.init();
    // Setup event listeners
    document.getElementById('generate-name').addEventListener('click', handlers.onGenerateName);
    document.getElementById('start-game').addEventListener('click', handlers.onStartGame);
    document.getElementById('reset-game').addEventListener('click', handlers.onResetGame);
    // ... other event listeners...
    initializeNumberPad();
});

// Add this to your initialization code
function initializeNumberPad() {
    const numKeys = document.querySelectorAll('.num-key');
    const answerInput = document.getElementById('answer');
    const toggleKeyboard = document.getElementById('toggle-keyboard');
    const backspace = document.getElementById('backspace');
    const clear = document.getElementById('clear');

    numKeys.forEach(key => {
        if (!['toggle-keyboard', 'backspace', 'clear', 'submit-answer'].includes(key.id)) {
            key.addEventListener('click', () => {
                const currentValue = answerInput.value;
                const keyValue = key.textContent;
                answerInput.value = currentValue + keyValue;
                game.enableSubmitButton();
            });
        }
    });

    // Add backspace functionality
    backspace.addEventListener('click', () => {
        const currentValue = answerInput.value;
        answerInput.value = currentValue.slice(0, -1);
        game.enableSubmitButton();
    });

    // Add clear functionality
    clear.addEventListener('click', () => {
        answerInput.value = '';
        game.enableSubmitButton();
    });

    toggleKeyboard.addEventListener('click', () => {
        answerInput.focus();
    });
}