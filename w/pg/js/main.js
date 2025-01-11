import { Events } from './ui/events.js';
import { PasswordDisplay } from './components/password-display.js';
import { ThemeSwitcher } from './components/theme-switcher.js';
import { CharacterPasswordGenerator } from './generators/char-password.js';
import { WordPasswordGenerator } from './generators/word-password.js';

export class PasswordGeneratorApp {
    static init() {
        // Make passwordDisplay globally accessible
        window.passwordDisplay = new PasswordDisplay();
        this.display = window.passwordDisplay;
        this.setupEventListeners();
        this.initializeUI();
        // Generate password immediately
        this.handleGeneratePassword();
    }

    static setupEventListeners() {
        Events.attachEvents();
        window.generatePassword = this.handleGeneratePassword.bind(this);
        window.copyPassword = this.handleCopyPassword.bind(this);
        window.toggleTheme = ThemeSwitcher.toggle.bind(ThemeSwitcher);
        window.switchMode = (mode) => {
            Events.switchMode(mode);
            this.handleGeneratePassword();
        };
    }

    static initializeUI() {
        ThemeSwitcher.init();
        // Set character mode as active by default
        const charButton = document.querySelector('.mode-button[data-mode="chars"]');
        charButton.classList.add('active');
        document.getElementById('charControls').style.display = 'block';
        document.getElementById('wordControls').style.display = 'none';
        
        // Ensure symbol levels are visible by default since symbols checkbox is checked
        document.getElementById('symbolLevels').style.display = 'block';
    }

    static generateInitialPassword() {
        // Force character mode password generation on load
        CharacterPasswordGenerator.generate();
    }

    static handleGeneratePassword() {
        const isWordMode = document.querySelector('.mode-button[data-mode="words"].active') !== null;
        const password = isWordMode ? 
            WordPasswordGenerator.generate() : 
            CharacterPasswordGenerator.generate();
            
        this.display.display(password);
        return password;
    }

    static handleCopyPassword() {
        const password = this.display.getPassword();
        if (!password) {
            alert('No password to copy');
            return;
        }

        navigator.clipboard.writeText(password)
            .then(() => alert('Password copied to clipboard!'))
            .catch(err => {
                console.error('Failed to copy:', err);
                this.fallbackCopy(password);
            });
    }

    static fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Password copied to clipboard!');
    }
}
