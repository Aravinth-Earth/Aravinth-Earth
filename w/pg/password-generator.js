// Constants
const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: {
        basic: '!@#$%^&*',
        extended: '!@#$%^&*{}[]()\\\'"`~,;:.<>',
        advanced: '!@#$%^&*{}[]()\\\'"`~,;:.<>±§`¡¢£¤¥¦¨©ª«¬®¯°±²³´¶·¸¹º»¼½¾¿',
        ascii: (() => {
            let chars = '';
            // Generate ASCII characters from code 33 to 126 (printable characters)
            for (let i = 33; i <= 126; i++) {
                chars += String.fromCharCode(i);
            }
            // Add extended ASCII characters from 161 to 255
            for (let i = 161; i <= 255; i++) {
                chars += String.fromCharCode(i);
            }
            return chars;
        })()
    }
};

const PATTERNS = {
    consonants: 'bcdfghjklmnpqrstvwxyz',
    vowels: 'aeiou'
};

// Core functions
function generatePassword() {
    const isWordMode = document.querySelector('.mode-button[data-mode="words"].active');
    const password = isWordMode ? generateWordPassword() : generateCharacterPassword();
    displayPassword(password);
}

function generateCharacterPassword() {
    const lengthInput = document.getElementById('length');
    const lengthSlider = document.getElementById('lengthSlider');
    
    // Ensure length is within bounds
    let length = parseInt(lengthInput.value) || 12;
    length = Math.max(10, Math.min(512, length));
    
    // Sync the input values
    lengthInput.value = length;
    lengthSlider.value = length;
    
    let chars = '';
    let requirements = [];
    
    // Build character pool and requirements
    if (document.getElementById('uppercase').checked) {
        chars += CHARS.upper;
        requirements.push({ chars: CHARS.upper, needed: true });
    }
    if (document.getElementById('lowercase').checked) {
        chars += CHARS.lower;
        requirements.push({ chars: CHARS.lower, needed: true });
    }
    if (document.getElementById('numbers').checked) {
        chars += CHARS.numbers;
        requirements.push({ chars: CHARS.numbers, needed: true });
    }
    if (document.getElementById('symbols').checked) {
        const level = document.querySelector('input[name="symbolLevel"]:checked')?.value || 'basic';
        
        if (level === 'custom') {
            const customSymbols = document.getElementById('includeSymbols').value;
            // Use custom symbols if provided, otherwise fallback to basic symbols
            const symbolSet = customSymbols || CHARS.symbols.basic;
            chars += symbolSet;
            requirements.push({ chars: symbolSet, needed: true });
        } else {
            chars += CHARS.symbols[level];
            requirements.push({ chars: CHARS.symbols[level], needed: true });
        }
    }

    // Ensure we have at least one character type selected
    if (!chars) {
        chars = CHARS.lower;
        requirements.push({ chars: CHARS.lower, needed: true });
        document.getElementById('lowercase').checked = true;
    }

    // Generate password
    let password = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    // Ensure at least one character from each required set
    requirements.forEach(req => {
        if (req.needed && !new RegExp(`[${req.chars}]`).test(password)) {
            const pos = Math.floor(Math.random() * length);
            const char = req.chars[Math.floor(Math.random() * req.chars.length)];
            password = password.substring(0, pos) + char + password.substring(pos + 1);
        }
    });

    return password;
}

function generateWordPassword() {
    const config = {
        wordCount: parseInt(document.getElementById('wordCount').value) || 4,
        wordLength: parseInt(document.getElementById('wordLength').value) || 5,
        pattern: document.querySelector('input[name="patternType"]:checked')?.value || 'simple',
        separator: document.querySelector('input[name="separator"]:checked')?.value || '-',
        appendNumber: document.getElementById('appendNumber').checked,
        numberLength: parseInt(document.getElementById('numberLength').value) || 2,
        caseType: document.querySelector('input[name="wordCase"]:checked')?.value
    };

    const words = Array.from({ length: config.wordCount }, 
        () => generateWordWithPattern(config.wordLength, config.pattern)
    );
    
    let password = words.join(config.separator);
    
    if (config.appendNumber) {
        password += Math.random().toString().slice(2, 2 + config.numberLength);
    }

    return applyCasing(password, config.caseType);
}

function generateWordWithPattern(length, pattern) {
    let word = '';
    let patternTemplate;
    
    switch(pattern) {
        case 'complex':
            // CCVC or CVCC patterns
            patternTemplate = Math.random() < 0.5 ? 'ccvc' : 'cvcc';
            break;
        case 'random':
            // Random mix of consonants and vowels, but avoid consecutive vowels
            return generateRandomWord(length);
        default: // 'simple'
            // CVCV pattern
            patternTemplate = 'cvcv';
    }

    // Adjust pattern to match desired length
    while (patternTemplate.length < length) {
        patternTemplate += patternTemplate.slice(-2);
    }
    patternTemplate = patternTemplate.slice(0, length);

    // Generate word based on pattern
    for (let i = 0; i < length; i++) {
        const isConsonant = patternTemplate[i] === 'c';
        const chars = isConsonant ? PATTERNS.consonants : PATTERNS.vowels;
        
        // Avoid same consecutive consonants
        if (isConsonant && word && PATTERNS.consonants.includes(word[word.length - 1])) {
            // Filter out the last used consonant
            const filtered = chars.replace(word[word.length - 1], '');
            word += filtered[Math.floor(Math.random() * filtered.length)];
        } else {
            word += chars[Math.floor(Math.random() * chars.length)];
        }
    }

    return word;
}

function generateRandomWord(length) {
    let word = '';
    let lastWasVowel = false;
    let vowelCount = 0;
    
    for (let i = 0; i < length; i++) {
        // Force consonant if we have two consecutive vowels
        const needsConsonant = lastWasVowel && vowelCount >= 2;
        // Avoid consonant if we haven't seen a vowel in 3 chars
        const needsVowel = !lastWasVowel && word.length >= 3 && 
            !word.slice(-3).split('').some(c => PATTERNS.vowels.includes(c));
        
        let chars;
        if (needsConsonant) {
            chars = PATTERNS.consonants;
        } else if (needsVowel) {
            chars = PATTERNS.vowels;
        } else {
            chars = Math.random() < 0.65 ? PATTERNS.consonants : PATTERNS.vowels;
        }
        
        const char = chars[Math.floor(Math.random() * chars.length)];
        word += char;
        
        lastWasVowel = PATTERNS.vowels.includes(char);
        if (lastWasVowel) {
            vowelCount++;
        } else {
            vowelCount = 0;
        }
    }
    
    return word;
}

function applyCasing(text, caseType) {
    switch(caseType) {
        case 'UPPERCASE': return text.toUpperCase();
        case 'Capitalize': return text.replace(/\b\w/g, c => c.toUpperCase());
        case 'aLtErNaTe': return text.split('').map((c, i) => 
            i % 2 ? c.toUpperCase() : c.toLowerCase()).join('');
        default: return text.toLowerCase();
    }
}

function copyPassword() {
    const password = document.getElementById('password')?.textContent;
    if (!password) return;
    
    navigator.clipboard.writeText(password)
        .then(() => alert('Password copied!'))
        .catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = password;
    const wordCountInput = document.getElementById('wordCount');
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Password copied!');
        });
}

function displayPassword(password) {
    if (!password) return;

    // Color-code the password
    const display = document.getElementById('password');
    display.innerHTML = password.split('').map(char => {
        let type = 'symbol';
        if (/[A-Z]/.test(char)) type = 'upper';
        else if (/[a-z]/.test(char)) type = 'lower';
        else if (/[0-9]/.test(char)) type = 'number';
        return `<span class="char-${type}">${char}</span>`;
    }).join('');

    // Update strength indicators
    updateStrength(password);
}

function updateStrength(password) {
    // Calculate entropy
    const counts = {};
    password.split('').forEach(c => counts[c] = (counts[c] || 0) + 1);
    const frequencies = Object.values(counts).map(count => count / password.length);
    const entropy = -frequencies.reduce((sum, freq) => sum + freq * Math.log2(freq), 0) * password.length;
    
    // Update display
    const uniqueChars = Object.keys(counts).length;
    const strength = entropy < 40 ? 'Weak' : entropy < 60 ? 'Medium' : entropy < 80 ? 'Strong' : 'Very Strong';
    const color = entropy < 40 ? '#ff4444' : entropy < 60 ? '#ffbb33' : entropy < 80 ? '#00C851' : '#007E33';
    
    document.getElementById('strengthText').textContent = `Strength: ${strength}`;
    document.getElementById('entropyText').textContent = `${Math.round(entropy)} bits`;
    document.getElementById('uniqueCharsText').textContent = `${uniqueChars} unique`;
    document.getElementById('shannonEntropyText').textContent = `${entropy.toFixed(2)} entropy`;
    
    const progressBar = document.getElementById('strengthProgress');
    progressBar.style.width = `${Math.min(100, entropy)}%`;
    progressBar.style.backgroundColor = color;
}

function switchMode(mode) {
    document.querySelectorAll('.mode-button')
        .forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    
    document.getElementById('charControls').style.display = mode === 'chars' ? 'block' : 'none';
    document.getElementById('wordControls').style.display = mode === 'words' ? 'block' : 'none';
    
    generatePassword();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    
    const icon = document.querySelector('.theme-switch i');
    if (icon) icon.className = next === 'light' ? 'fas fa-sun' : 'fas fa-moon';
}

function initializeEventListeners() {
    // Symbol section visibility
    const symbolsCheckbox = document.getElementById('symbols');
    const symbolLevels = document.getElementById('symbolLevels');
    
    symbolsCheckbox?.addEventListener('change', (e) => {
        symbolLevels.style.display = e.target.checked ? 'block' : 'none';
        generatePassword();
    });

    // Custom symbols visibility
    const customSymbolsSection = document.getElementById('customSymbolsSection');
    document.querySelectorAll('input[name="symbolLevel"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            customSymbolsSection.style.display = e.target.value === 'custom' ? 'block' : 'none';
            generatePassword();
        });
    });

    // Initialize visibility states
    symbolLevels.style.display = symbolsCheckbox?.checked ? 'block' : 'none';
    customSymbolsSection.style.display = 
        document.querySelector('input[name="symbolLevel"]:checked')?.value === 'custom' 
            ? 'block' 
            : 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set theme
    document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'dark');
    
    // Setup word control sliders
    const wordCountSlider = document.getElementById('wordCountSlider');
    const wordCountInput = document.getElementById('wordCount');
    const wordLengthSlider = document.getElementById('wordLengthSlider');
    const wordLengthInput = document.getElementById('wordLength');

    // Sync word count controls
    wordCountSlider?.addEventListener('input', () => {
        wordCountInput.value = wordCountSlider.value;
        generatePassword();
    });

    wordCountInput?.addEventListener('input', () => {
        wordCountSlider.value = wordCountInput.value;
        generatePassword();
    });

    // Sync word length controls
    wordLengthSlider?.addEventListener('input', () => {
        wordLengthInput.value = wordLengthSlider.value;
        generatePassword();
    });

    wordLengthInput?.addEventListener('input', () => {
        wordLengthSlider.value = wordLengthInput.value;
        generatePassword();
    });

    // Setup character length controls
    const lengthSlider = document.getElementById('lengthSlider');
    const lengthInput = document.getElementById('length');

    lengthSlider?.addEventListener('input', (e) => {
        lengthInput.value = e.target.value;
        generatePassword();
    });

    lengthInput?.addEventListener('input', (e) => {
        let value = parseInt(e.target.value) || 12;
        value = Math.max(10, Math.min(512, value));
        e.target.value = value;
        lengthSlider.value = value;
        generatePassword();
    });

    // Add the new initialization
    initializeEventListeners();

    // Generate initial password
    generatePassword();
});

// Make functions available globally
window.generatePassword = generatePassword;
window.copyPassword = copyPassword;
window.switchMode = switchMode;
window.toggleTheme = toggleTheme;
