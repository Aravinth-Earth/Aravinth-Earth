export class RandomGenerator {
    static getInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getChar(chars) {
        return chars.charAt(Math.floor(Math.random() * chars.length));
    }

    static getItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static getNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.getInt(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    static ensureAllTypes(password, requirements) {
        const chars = [...password];
        const types = Object.entries(requirements);
        
        // Check if each required type exists
        types.forEach(([type, config]) => {
            if (config.required && !config.regex.test(password)) {
                // Replace a random character with one from the required type
                const pos = this.getInt(0, chars.length - 1);
                chars[pos] = this.getChar(config.chars);
            }
        });

        return chars.join('');
    }
}
