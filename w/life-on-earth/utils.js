class MathUtils {
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class ColorGenerator {
    static generate() {
        const hue = MathUtils.random(ART_CONFIG.colors.hue.min, ART_CONFIG.colors.hue.max);
        const saturation = MathUtils.random(ART_CONFIG.colors.saturation.min, ART_CONFIG.colors.saturation.max);
        const lightness = MathUtils.random(ART_CONFIG.colors.lightness.min, ART_CONFIG.colors.lightness.max);
        const opacity = MathUtils.random(ART_CONFIG.colors.opacity.min, ART_CONFIG.colors.opacity.max);
        
        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
    }

    static createGradient() {
        const baseHue = MathUtils.random(ART_CONFIG.colors.hue.min, ART_CONFIG.colors.hue.max);
        const hueVar = ART_CONFIG.colors.hue.variation;
        const sat = ART_CONFIG.colors.saturation.gradient;
        const light = ART_CONFIG.colors.lightness.gradient;
        
        return {
            start: `hsla(${baseHue}, ${sat}%, ${light}%, ${ART_CONFIG.colors.opacity.gradient.start})`,
            end: `hsla(${(baseHue + hueVar) % 360}, ${sat}%, ${light}%, ${ART_CONFIG.colors.opacity.gradient.end})`
        };
    }
}

class AudioManager {
    constructor() {
        this.audio = null;
        
        // Handle page visibility changes — only after audio has started
        document.addEventListener('visibilitychange', () => {
            if (!this.audio) return;
            if (document.hidden) {
                this.fadeOut();
            } else {
                this.fadeIn();
            }
        });
    }

    async fadeIn() {
        // Skip if already fully faded in
        if (this.audio?.volume >= 0.6) return;

        // Create audio lazily on first interaction — no preloading
        if (!this.audio) {
            this.audio = new Audio();
            this.audio.loop = true;
            this.audio.volume = 0;
            this.audio.src = './edge-summer-forest.opus';
        }
        
        this.audio.volume = 0;
        await this.audio.play().catch(() => {
            console.log('Audio autoplay blocked. User interaction required.');
        });
        
        const fadeInterval = setInterval(() => {
            if (this.audio.volume < 0.6) {
                this.audio.volume = Math.min(0.6, this.audio.volume + 0.02);
            } else {
                clearInterval(fadeInterval);
            }
        }, 100);
    }

    fadeOut() {
        if (!this.audio) return;
        const fadeInterval = setInterval(() => {
            if (this.audio.volume > 0.02) {
                this.audio.volume -= 0.02;
            } else {
                this.audio.pause();
                clearInterval(fadeInterval);
            }
        }, 100);
    }
}
