import { EntropyCalculator } from '../utils/entropy.js';

export class PasswordDisplay {
    constructor(elementId = 'password') {
        this.element = document.getElementById(elementId);
        this.colorMap = {
            upper: 'char-upper',
            lower: 'char-lower',
            number: 'char-number',
            symbol: 'char-symbol'
        };
        this.strengthBar = document.getElementById('strengthProgress');
        this.strengthText = document.getElementById('strengthText');
        this.entropyText = document.getElementById('entropyText');
    }

    display(password) {
        if (!password) {
            this.element.innerHTML = '';
            this.element.dataset.password = '';
            this.resetStrengthIndicator();
            return;
        }

        let coloredHtml = '';
        for (const char of password) {
            let charClass = '';
            if (/[A-Z]/.test(char)) charClass = 'char-upper';
            else if (/[a-z]/.test(char)) charClass = 'char-lower';
            else if (/[0-9]/.test(char)) charClass = 'char-number';
            else charClass = 'char-symbol';
            
            coloredHtml += `<span class="${charClass}">${char}</span>`;
        }
        
        this.element.innerHTML = coloredHtml;
        this.element.dataset.password = password;
        this.updateStrengthIndicator(password);
    }

    getCharacterType(char) {
        if (/[A-Z]/.test(char)) return 'upper';
        if (/[a-z]/.test(char)) return 'lower';
        if (/[0-9]/.test(char)) return 'number';
        return 'symbol';
    }

    getPassword() {
        return this.element.dataset.password || '';
    }

    clear() {
        this.display('');
    }

    setSelectable(selectable) {
        this.element.style.userSelect = selectable ? 'all' : 'none';
    }

    updateStrengthIndicator(password) {
        if (!password) {
            this.resetStrengthIndicator();
            return;
        }

        const stats = EntropyCalculator.calculate(password);
        this.updateStatsDisplay(stats);
    }

    resetStrengthIndicator() {
        this.strengthBar.style.width = '0%';
        this.entropyText.textContent = '0 bits';
        document.getElementById('uniqueChars').textContent = '0';
        document.getElementById('shannonEntropy').textContent = '0.00';
        document.getElementById('charSets').textContent = 'None';
    }

    updateStatsDisplay(stats) {
        // Update strength indicators
        const progressBar = document.getElementById('strengthProgress');
        progressBar.style.width = `${stats.percentage}%`;
        progressBar.style.backgroundColor = stats.color;
        
        this.strengthText.textContent = `Strength: ${stats.strength}`;
        document.getElementById('entropyText').textContent = `${Math.round(stats.entropy)} bits`;
        document.getElementById('uniqueCharsText').textContent = `${stats.uniqueChars} unique`;
        document.getElementById('shannonEntropyText').textContent = `${stats.shannonEntropy.toFixed(2)} entropy`;
    }

    copy() {
        const password = this.getPassword();
        if (!password) return false;
        
        navigator.clipboard.writeText(password)
            .then(() => alert('Password copied to clipboard!'))
            .catch(() => {
                // Fallback copy method
                const textarea = document.createElement('textarea');
                textarea.value = password;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert('Password copied to clipboard!');
            });
        
        return true;
    }
}
