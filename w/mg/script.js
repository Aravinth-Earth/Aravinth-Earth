const state = {
    playerName: '',
    score: 0,
    level: 1,
    attempts: 0,
    currentAnswer: 0
};

// Load saved state
const loadState = () => {
    const saved = localStorage.getItem('mathGame');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(state, data);
        document.getElementById('player-name').value = state.playerName;
        document.getElementById('difficulty').value = state.level;
        document.getElementById('score').textContent = state.score;
    }
};

const saveState = () => {
    localStorage.setItem('mathGame', JSON.stringify(state));
};

const generateName = () => {
    const adjectives = ['Happy', 'Lucky', 'Clever', 'Bright', 'Quick'];
    const nouns = ['Wizard', 'Eagle', 'Tiger', 'Dolphin', 'Star'];
    const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
    document.getElementById('player-name').value = name;
};

const generateQuestion = () => {
    const operations = {
        1: ['+', '-'],
        2: ['*', '/'],
        3: ['+', '-'],
        4: ['*', '/'],
        5: ['+', '-', '*', '/']
    };

    const ops = operations[state.level];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let num1, num2;

    switch(op) {
        case '/':
            num2 = Math.floor(Math.random() * 10) + 1;
            num1 = num2 * (Math.floor(Math.random() * 10) + 1);
            break;
        default:
            num1 = Math.floor(Math.random() * 20) + 1;
            num2 = Math.floor(Math.random() * 20) + 1;
    }

    const question = `${num1} ${op} ${num2}`;
    state.currentAnswer = eval(question);
    document.getElementById('question').textContent = question;
    document.getElementById('answer').value = '';
    document.getElementById('message').textContent = '';
};

const checkAnswer = () => {
    const userAnswer = parseFloat(document.getElementById('answer').value);
    const messageEl = document.getElementById('message');

    if (userAnswer === state.currentAnswer) {
        state.score += 10;
        state.attempts = 0;
        document.getElementById('score').textContent = state.score;
        messageEl.textContent = '🎉 Correct! Keep going!';
        messageEl.className = 'success';
        saveState();
        setTimeout(generateQuestion, 1000);
    } else {
        state.attempts++;
        messageEl.className = 'failure';
        if (state.attempts >= 3) {
            messageEl.textContent = `The correct answer was ${state.currentAnswer}. Click "Next Question" to continue.`;
            state.attempts = 0;
            document.getElementById('next-question').classList.remove('hidden');
        } else {
            messageEl.textContent = `Wrong answer! Try again! (${3 - state.attempts} attempts left)`;
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadState();

    document.getElementById('generate-name').addEventListener('click', generateName);
    document.getElementById('start-game').addEventListener('click', () => {
        state.playerName = document.getElementById('player-name').value;
        state.level = parseInt(document.getElementById('difficulty').value);
        if (!state.playerName) return alert('Please enter a name!');
        
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        saveState();
        generateQuestion();
    });

    document.getElementById('reset-game').addEventListener('click', () => {
        localStorage.removeItem('mathGame');
        location.reload();
    });

    document.getElementById('submit-answer').addEventListener('click', checkAnswer);
    document.getElementById('answer').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });

    document.getElementById('next-question').addEventListener('click', () => {
        generateQuestion();
        document.getElementById('next-question').classList.add('hidden');
    });

    document.getElementById('back-to-menu').addEventListener('click', () => {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('welcome-screen').classList.remove('hidden');
    });
});