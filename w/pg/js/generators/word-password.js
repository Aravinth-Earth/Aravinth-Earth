import { RandomGenerator } from '../utils/random.js';
import { Logger } from '../utils/logger.js';

export class WordPasswordGenerator {
    static patterns = {
        simple: ['cvcv', 'vcvc', 'cvccv', 'cvcvc'],
        complex: ['ccvc', 'cvcc', 'ccvcc', 'cvccc', 'ccvcv'],
        random: ['cvcv', 'vcvc', 'cvccv', 'ccvc', 'cvcc', 'ccvcc', 'cvcvc']
    };

    static consonants = 'bcdfghjklmnpqrstvwxyz'.split('');
    static vowels = 'aeiou'.split('');

    static generate() {
        Logger.log('WordPasswordGenerator', 'Starting password generation');
        const config = this.getConfiguration();
        Logger.log('WordPasswordGenerator', 'Configuration loaded', config);
        
        const words = this.generateWords(config);
        Logger.log('WordPasswordGenerator', 'Words generated', { words });
        
        const password = this.assemblePassword(words, config);
        Logger.log('WordPasswordGenerator', 'Password assembled', { password });
        
        return password;
    }

    static assemblePassword(words, config) {
        const separator = config.separator || '-';
        let password = words.join(separator);
        
        if (config.appendNumber) {
            const number = Math.floor(Math.random() * Math.pow(10, config.numberLength))
                .toString().padStart(config.numberLength, '0');
            password += number;
            Logger.log('WordPasswordGenerator', 'Number appended', { number });
        }

        if (config.appendChar && config.appendCharValue) {
            password += config.appendCharValue;
        }
        
        password = this.applyCase(password, config.wordCase);
        return password;
    }

    static generateWords(config) {
        return Array.from(
            { length: config.wordCount }, 
            () => this.generateWord(config.wordLength, config.patternType)
        );
    }

    static generateWord(length, patternType) {
        const pattern = this.getPattern(patternType);
        const wordLength = Math.max(length, pattern.length);
        let word = '';
        let patternIndex = 0;

        for (let i = 0; i < wordLength; i++) {
            const charType = pattern[patternIndex % pattern.length];
            word += charType === 'c' 
                ? RandomGenerator.getItem(this.consonants)
                : RandomGenerator.getItem(this.vowels);
            patternIndex++;
        }
        
        return word;
    }

    static getPattern(type, length) {
        const patterns = this.patterns[type] || this.patterns.simple;
        return RandomGenerator.getItem(patterns);
    }

    static applyCase(word, caseType) {
        switch(caseType) {
            case 'UPPERCASE': return word.toUpperCase();
            case 'Capitalize': return word.replace(/\b\w/g, c => c.toUpperCase());
            case 'aLtErNaTe': return word.split('').map((c, i) => 
                i % 2 ? c.toUpperCase() : c.toLowerCase()).join('');
            case 'random': return word.split('').map(c => 
                Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join('');
            default: return word.toLowerCase();
        }
    }

    static getAppendChars(config) {
        let chars = '';
        const count = parseInt(config.appendCharCount) || 1;
        const defaultChars = '!@#$%^&*';
        
        const charSet = config.charSetType === 'custom' && config.customCharSet
            ? config.customCharSet
            : defaultChars;

        for (let i = 0; i < count; i++) {
            chars += RandomGenerator.getChar(charSet);
        }
        
        return chars;
    }

    static getConfiguration() {
        return {
            wordCount: parseInt(document.getElementById('wordCount').value) || 4,
            wordLength: parseInt(document.getElementById('wordLength').value) || 5,
            wordCase: document.querySelector('input[name="wordCase"]:checked')?.value || 'Capitalize',
            separator: this.getSeparator(),
            appendNumber: document.getElementById('appendNumber').checked,
            numberLength: parseInt(document.getElementById('numberLength').value) || 2,
            charSetType: document.querySelector('input[name="charSetType"]:checked')?.value || 'default',
            customCharSet: document.getElementById('customCharSet').value,
            appendCharCount: parseInt(document.getElementById('appendCharCount').value) || 1,
            patternType: document.querySelector('input[name="patternType"]:checked')?.value || 'simple'
        };
    }

    static getSeparator() {
        const selected = document.querySelector('input[name="separator"]:checked');
        if (selected?.value === 'custom') {
            return document.getElementById('customSeparator').value;
        }
        return selected?.value || '-';
    }
}
