const state = {
    playerName: '',
    score: 0,
    level: 1,
    attempts: 0,
    currentAnswer: 0,
    correctCount: 0,
    incorrectCount: 0
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

const generateQuestion = () => {
    const operations = {
        1: ['+', '-'],
        2: ['*', '/'],
        3: ['+', '-', '*', '/'],
        4: ['+', '-', '*', '/']
    };

    const { level, correctCount, incorrectCount } = state;
    const ops = operations[level];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1, num2;

    // Adjust number range based on correct and incorrect counts
    let numberRange;
    if (correctCount < 15) {
        numberRange = 10; // Single digits
    } else if (correctCount < 45) {
        numberRange = 100; // Double digits
    } else {
        numberRange = 1000; // Triple digits
    }

    // Decrease complexity if incorrect answers exceed a threshold
    if (incorrectCount > 5 && numberRange > 10) {
        numberRange = Math.floor(numberRange / 10);
        state.incorrectCount = 0; // Reset counter after adjustment
    }

    // Generate numbers based on adjusted range
    switch(op) {
        case '/':
            num2 = Math.floor(Math.random() * (numberRange / 10)) + 1;
            num1 = num2 * (Math.floor(Math.random() * (numberRange / 10)) + 1);
            break;
        default:
            num1 = Math.floor(Math.random() * numberRange) + 1;
            num2 = Math.floor(Math.random() * numberRange) + 1;
    }

    const question = `${num1} ${op} ${num2}`;
    state.currentAnswer = eval(question);
    document.getElementById('question').textContent = question;
    document.getElementById('answer').value = '';
    document.getElementById('message').textContent = '';
    document.getElementById('submit-answer').classList.remove('hidden');
    document.getElementById('submit-answer').disabled = true;
};

const checkAnswer = () => {
    const userAnswer = parseFloat(document.getElementById('answer').value);
    const messageEl = document.getElementById('message');
    const submitButton = document.getElementById('submit-answer');

    if (userAnswer === state.currentAnswer) {
        const scoreMap = { 1: 10, 2: 20, 3: 30, 4: 40 };
        state.score += scoreMap[state.level];
        state.attempts = 0;
        state.correctCount += 1; // Increment correct count
        state.incorrectCount = 0; // Optionally reset incorrect count on correct answer
        document.getElementById('score').textContent = state.score;
        messageEl.textContent = '🎉 Correct! Keep going!';
        messageEl.className = 'success';
        saveState();
        setTimeout(generateQuestion, 1000);
    } else {
        state.attempts++;
        state.incorrectCount += 1; // Increment incorrect count
        messageEl.className = 'failure';
        if (state.attempts >= 3) {
            messageEl.textContent = `The correct answer was ${state.currentAnswer}. Click "Next Question" to continue.`;
            state.attempts = 0;
            document.getElementById('next-question').classList.remove('hidden');
            submitButton.classList.add('hidden');
        } else {
            messageEl.textContent = `Wrong answer! Try again! (${3 - state.attempts} attempts left)`;
        }
    }
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

    document.getElementById('reset-game').addEventListener('click', () => {
        localStorage.removeItem('mathGame');
        generateName();
        Object.assign(state, { score: 0, level: 1, attempts: 0, currentAnswer: 0 });
        document.getElementById('score').textContent = state.score;
        document.getElementById('difficulty').value = state.level;
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
});