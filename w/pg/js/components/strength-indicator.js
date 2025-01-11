export class StrengthIndicator {
    constructor() {
        this.progressBar = document.getElementById('strengthProgress');
        this.strengthText = document.getElementById('strengthText');
        this.entropyText = document.getElementById('entropyText');
        this.uniqueChars = document.getElementById('uniqueChars');
        this.shannonEntropy = document.getElementById('shannonEntropy');
        this.charSets = document.getElementById('charSets');
    }

    update(password) {
        if (!password) {
            this.reset();
            return;
        }

        const stats = this.calculateStrength(password);
        this.updateDisplay(stats);
    }

    reset() {
        this.progressBar.style.width = '0%';
        this.entropyText.textContent = '0 bits';
        this.uniqueChars.textContent = '0';
        this.shannonEntropy.textContent = '0.00';
        this.charSets.textContent = 'None';
    }

    updateDisplay(stats) {
        this.progressBar.style.width = `${stats.percentage}%`;
        this.progressBar.style.backgroundColor = stats.color;
        this.strengthText.textContent = `Strength: ${stats.strength}`;
        this.entropyText.textContent = 
            `${Math.round(stats.entropy)} bits (${stats.uniqueChars} unique chars)`;
        
        // Update detailed stats
        this.uniqueChars.textContent = stats.uniqueChars;
        this.shannonEntropy.textContent = stats.shannonEntropy.toFixed(2);
        this.charSets.textContent = stats.characterSets.join(', ') || 'None';
    }

    calculateStrength(password) {
        const stats = this.analyzePassword(password);
        const entropy = stats.shannonEntropy * password.length;
        
        let strength, color, percentage;
        if (entropy < 40) {
            strength = "Weak"; color = "#ff4444"; percentage = 25;
        } else if (entropy < 60) {
            strength = "Medium"; color = "#ffbb33"; percentage = 50;
        } else if (entropy < 80) {
            strength = "Strong"; color = "#00C851"; percentage = 75;
        } else {
            strength = "Very Strong"; color = "#007E33"; percentage = 100;
        }

        return {
            ...stats,
            strength,
            color,
            percentage,
            entropy
        };
    }

    analyzePassword(password) {
        const charCounts = {};
        password.split('').forEach(char => {
            charCounts[char] = (charCounts[char] || 0) + 1;
        });

        const frequencies = Object.values(charCounts)
            .map(count => count / password.length);
        const shannonEntropy = -frequencies.reduce(
            (sum, freq) => sum + (freq * Math.log2(freq)), 0
        );

        return {
            uniqueChars: Object.keys(charCounts).length,
            shannonEntropy,
            characterSets: this.getCharacterSets(password)
        };
    }

    getCharacterSets(password) {
        const sets = [];
        if (/[A-Z]/.test(password)) sets.push('ABC');
        if (/[a-z]/.test(password)) sets.push('abc');
        if (/[0-9]/.test(password)) sets.push('123');
        if (/[^A-Za-z0-9]/.test(password)) sets.push('#@!');
        return sets;
    }
}
