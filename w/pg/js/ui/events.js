import { CharacterPasswordGenerator } from '../generators/char-password.js';
import { WordPasswordGenerator } from '../generators/word-password.js';
import { Logger } from '../utils/logger.js';

class EventHandler {
    static attachEvents() {
        Logger.log('EventHandler', 'Initializing event attachments');
        try {
            this.attachLengthControls();
            this.attachCharacterSetControls();
            this.attachWordControls();
            this.attachModeSwitch();
            Logger.log('EventHandler', 'All events attached successfully');
        } catch (error) {
            Logger.error('EventHandler', 'Failed to attach events', error);
        }
    }

    static attachLengthControls() {
        Logger.log('EventHandler', 'Attaching length controls');
        const slider = document.getElementById('lengthSlider');
        const input = document.getElementById('length');

        if (slider && input) {
            // For slider
            slider.addEventListener('input', (e) => {
                Logger.log('EventHandler', 'Length slider changed', { value: e.target.value });
                input.value = e.target.value;
                const password = CharacterPasswordGenerator.generate();
                window.passwordDisplay.display(password);
            });

            // For number input
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                Logger.log('EventHandler', 'Length input changed', { value });
                if (value >= 10 && value <= 512) {
                    slider.value = value;
                    const password = CharacterPasswordGenerator.generate();
                    window.passwordDisplay.display(password);
                }
            });
        } else {
            Logger.error('EventHandler', 'Length controls not found');
        }
    }

    static attachCharacterSetControls() {
        Logger.log('EventHandler', 'Attaching character set controls');
        
        // Character set checkboxes with direct binding
        ['uppercase', 'lowercase', 'numbers', 'symbols'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    Logger.log('EventHandler', `Character set ${id} changed`);
                    const password = CharacterPasswordGenerator.generate();
                    window.passwordDisplay.display(password);
                });
            }
        });

        // Symbol controls
        const symbolsCheckbox = document.getElementById('symbols');
        if (symbolsCheckbox) {
            symbolsCheckbox.addEventListener('change', () => {
                const symbolLevels = document.getElementById('symbolLevels');
                symbolLevels.style.display = symbolsCheckbox.checked ? 'block' : 'none';
                const password = CharacterPasswordGenerator.generate();
                window.passwordDisplay.display(password);
            });
        }
    }

    static attachWordControls() {
        try {
            // Word count and length controls
            ['wordCount', 'wordLength'].forEach(id => {
                const slider = document.getElementById(`${id}Slider`);
                const input = document.getElementById(id);
                
                if (slider && input) {
                    slider.addEventListener('input', (e) => {
                        input.value = e.target.value;
                        const password = WordPasswordGenerator.generate();
                        window.passwordDisplay.display(password);
                    });

                    input.addEventListener('input', (e) => {
                        slider.value = e.target.value;
                        const password = WordPasswordGenerator.generate();
                        window.passwordDisplay.display(password);
                    });
                }
            });

            // Pattern type
            const patternInputs = document.querySelectorAll('input[name="patternType"]');
            if (patternInputs.length) {
                patternInputs.forEach(radio => {
                    radio.addEventListener('change', () => {
                        const password = WordPasswordGenerator.generate();
                        window.passwordDisplay.display(password);
                    });
                });
            }

            // Word case
            const wordCaseInputs = document.querySelectorAll('input[name="wordCase"]');
            if (wordCaseInputs.length) {
                wordCaseInputs.forEach(input => {
                    input.addEventListener('change', () => {
                        const password = WordPasswordGenerator.generate();
                        window.passwordDisplay.display(password);
                    });
                });
            }

            // Separator controls
            const separatorInputs = document.querySelectorAll('input[name="separator"]');
            if (separatorInputs.length) {
                separatorInputs.forEach(radio => {
                    radio.addEventListener('change', () => {
                        const customSeparator = document.getElementById('customSeparator');
                        if (customSeparator) {
                            customSeparator.style.display = radio.value === 'custom' ? 'block' : 'none';
                        }
                        const password = WordPasswordGenerator.generate();
                        window.passwordDisplay.display(password);
                    });
                });
            }

            // Custom separator input
            const customSeparator = document.getElementById('customSeparator');
            if (customSeparator) {
                customSeparator.addEventListener('input', () => {
                    const password = WordPasswordGenerator.generate();
                    window.passwordDisplay.display(password);
                });
            }

            // Append options
            ['appendNumber', 'appendChar'].forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('change', () => {
                        const password = WordPasswordGenerator.generate();
                        window.passwordDisplay.display(password);
                    });
                }
            });

            ['numberLength', 'appendCharCount'].forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.addEventListener('input', () => {
                        const password = WordPasswordGenerator.generate();
                        window.passwordDisplay.display(password);
                    });
                }
            });
        } catch (error) {
            console.warn('Error attaching word controls:', error);
        }
    }

    static attachModeSwitch() {
        document.querySelectorAll('.mode-button').forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                this.switchMode(mode);
            });
        });
    }

    static switchMode(mode) {
        Logger.log('EventHandler', 'Switching mode', { mode });
        // Update button states
        document.querySelectorAll('.mode-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update visibility of controls
        const wordControls = document.getElementById('wordControls');
        const charControls = document.getElementById('charControls');
        
        if (mode === 'words') {
            wordControls.style.display = 'block';
            charControls.style.display = 'none';
            const password = WordPasswordGenerator.generate();
            window.passwordDisplay.display(password);
        } else {
            wordControls.style.display = 'none';
            charControls.style.display = 'block';
            const password = CharacterPasswordGenerator.generate();
            window.passwordDisplay.display(password);
        }
    }
}

export const Events = EventHandler;
