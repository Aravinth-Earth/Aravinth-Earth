// Utility Imports
import {
    RandomGenerator,
    Patterns,
    Logger,
    EntropyCalculator
} from './utils/index.js';

// UI Event Handlers
import {
    Events,
    Controls
} from './ui/index.js';

// Component Imports
import {
    PasswordDisplay,
    ThemeSwitcher,
    StrengthIndicator
} from './components/index.js';

// Password Generators
import {
    CharacterPasswordGenerator,
    WordPasswordGenerator
} from './generators/index.js';

// Debug configuration
const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export class PasswordGeneratorApp {
    static debug(...args) {
        if (DEBUG) console.log('[PasswordGenerator]', ...args);
    }

    static init() {
        try {
            this.debug('Initializing application...');
            
            // Make functions globally accessible first
            window.generatePassword = () => this.handleGeneratePassword();
            window.copyPassword = () => this.handleCopyPassword();
            window.toggleTheme = () => ThemeSwitcher.toggle();
            
            // Initialize the app
            window.passwordDisplay = new PasswordDisplay();
            this.display = window.passwordDisplay;
            
            this.setupEventListeners();
            this.initializeUI();

            // Ensure initial password generation
            requestAnimationFrame(() => {
                this.debug('Generating initial password...');
                const password = this.handleGeneratePassword();
                this.debug('Initial password generated:', password);
                
                // Verify password display
                const displayElement = document.getElementById('password');
                this.debug('Password display element content:', displayElement?.textContent);
            });

        } catch (error) {
            console.error('Initialization failed:', error);
            document.body.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h2>Something went wrong</h2>
                    <p>Please try refreshing the page. If the problem persists, check the console for details.</p>
                </div>`;
        }
    }

    static setupEventListeners() {
        this.debug('Setting up event listeners...');
        Events.attachEvents();
        
        // Add click listeners to buttons
        const generateBtn = document.getElementById('generateBtn');
        const copyBtn = document.getElementById('copyBtn');
        const themeBtn = document.getElementById('themeBtn');
        
        if (generateBtn) generateBtn.addEventListener('click', () => this.handleGeneratePassword());
        if (copyBtn) copyBtn.addEventListener('click', () => this.handleCopyPassword());
        if (themeBtn) themeBtn.addEventListener('click', () => ThemeSwitcher.toggle());
        
        // Mode switcher
        document.querySelectorAll('.mode-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                Events.switchMode(mode);
                this.handleGeneratePassword();
            });
        });
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
        this.debug('Generating new password...');
        const isWordMode = document.querySelector('.mode-button[data-mode="words"].active') !== null;
        this.debug('Mode:', isWordMode ? 'words' : 'characters');
        
        const password = isWordMode ? 
            WordPasswordGenerator.generate() : 
            CharacterPasswordGenerator.generate();
            
        this.debug('Generated password:', password);
        this.display.display(password);
        
        // Verify display
        const displayElement = document.getElementById('password');
        this.debug('Password display element content after update:', displayElement?.textContent);
        
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
