export class EntropyCalculator {
    static calculate(password) {
        const charCounts = {};
        password.split('').forEach(char => {
            charCounts[char] = (charCounts[char] || 0) + 1;
        });

        const uniqueChars = Object.keys(charCounts).length;
        const frequencies = Object.values(charCounts).map(count => count / password.length);
        const shannonEntropy = -frequencies.reduce((sum, freq) => 
            sum + (freq * Math.log2(freq)), 0);

        // Calculate strength metrics
        const entropy = shannonEntropy * password.length;
        let strength, color, percentage;
        
        if (entropy < 40) {
            strength = "Weak";
            color = "#ff4444";
            percentage = 25;
        } else if (entropy < 60) {
            strength = "Medium";
            color = "#ffbb33";
            percentage = 50;
        } else if (entropy < 80) {
            strength = "Strong";
            color = "#00C851";
            percentage = 75;
        } else {
            strength = "Very Strong";
            color = "#007E33";
            percentage = 100;
        }

        return {
            uniqueChars,
            shannonEntropy,
            entropy,
            strength,
            color,
            percentage,
            password
        };
    }
}
