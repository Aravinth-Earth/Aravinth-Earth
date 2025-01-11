import { RandomGenerator } from '../utils/random.js';
import { Logger } from '../utils/logger.js';

export class CharacterPasswordGenerator {
    static characterSets = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: {
            basic: '!@#$%^&*',
            extended: '{}[]()\\\'"`~,;:.<>',
            advanced: '±§`¡¢£¤¥¦¨©ª«¬®¯°±²³´¶·¸¹º»¼½¾¿',
            ascii: (() => {
                let chars = '';
                for (let i = 32; i <= 255; i++) {
                    if (i !== 127) chars += String.fromCharCode(i);
                }
                return chars;
            })()
        }
    };

    static generate() {
        try {
            Logger.log('CharPasswordGenerator', 'Starting password generation');
            const config = this.getConfiguration();
            Logger.log('CharPasswordGenerator', 'Configuration loaded', config);

            if (!this.validateConfig(config)) {
                Logger.log('CharPasswordGenerator', 'Invalid config, using default');
                return this.generateDefault();
            }

            const chars = this.getCharacterPool(config);
            const password = this.generateFromPool(chars, config.length);
            
            Logger.log('CharPasswordGenerator', 'Password generated', { 
                length: password.length,
                config: config 
            });
            
            return password;
        } catch (error) {
            Logger.error('CharPasswordGenerator', 'Error generating password', error);
            return this.generateDefault();
        }
    }

    static getConfiguration() {
        return {
            length: parseInt(document.getElementById('length').value) || 12,
            hasUpper: document.getElementById('uppercase').checked,
            hasLower: document.getElementById('lowercase').checked,
            hasNumbers: document.getElementById('numbers').checked,
            hasSymbols: document.getElementById('symbols').checked,
            symbolLevel: document.querySelector('input[name="symbolLevel"]:checked')?.value
        };
    }

    static getCharacterPool(config) {
        let pool = '';
        if (config.hasUpper) pool += this.characterSets.upper;
        if (config.hasLower) pool += this.characterSets.lower;
        if (config.hasNumbers) pool += this.characterSets.numbers;
        if (config.hasSymbols) pool += this.getSymbols(config.symbolLevel);
        return pool;
    }

    static getSymbols(level) {
        if (level === 'custom') {
            return this.getCustomSymbols();
        }
        return Object.entries(this.characterSets.symbols)
            .filter(([key]) => key === level)
            .map(([_, value]) => value)
            .join('');
    }

    static getCustomSymbols() {
        const includeSymbols = document.getElementById('includeSymbols').value;
        const excludeSymbols = document.getElementById('excludeSymbols').value;
        let symbols = this.characterSets.symbols.basic; // Start with basic symbols
        
        if (includeSymbols) {
            symbols += includeSymbols;
        }
        
        if (excludeSymbols) {
            symbols = symbols
                .split('')
                .filter(char => !excludeSymbols.includes(char))
                .join('');
        }
        
        return symbols;
    }

    static generateFromPool(chars, length) {
        let password = '';
        for (let i = 0; i < length; i++) {
            password += RandomGenerator.getChar(chars);
        }
        return password;
    }

    static generateDefault() {
        return this.generateFromPool(
            this.characterSets.upper + 
            this.characterSets.lower + 
            this.characterSets.numbers + 
            this.characterSets.symbols.basic,
            12
        );
    }

    static validateConfig(config) {
        // Ensure at least one character set is selected
        if (!config.hasUpper && !config.hasLower && !config.hasNumbers && !config.hasSymbols) {
            // If none selected, default to lowercase
            document.getElementById('lowercase').checked = true;
            config.hasLower = true;
        }
        
        // Validate length
        if (config.length < 10 || config.length > 512) {
            return false;
        }
        
        return true;
    }
}
