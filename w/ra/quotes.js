const PHILOSOPHICAL_QUOTES = {
    tamil: [
        "வாழ்க்கை என்பது நீரோட்டம் போன்றது - எப்போதும் நகர்ந்து கொண்டே இருக்கிறது",
        // ...existing Tamil quotes...
    ],
    english: [
        "Life flows like water - ever-moving, ever-changing",
        // ...existing English quotes...
    ]
};

class QuoteManager {
    constructor() {
        this.container = document.getElementById('quoteContainer');
        this.quoteElement = document.getElementById('quote');
        this.currentLanguage = 'tamil'; // Changed default to Tamil
        this.updateInterval = 8000;
        this.fadeTime = 2000;
        this.container.style.opacity = '1';
    }

    getRandomQuote() {
        const quotes = PHILOSOPHICAL_QUOTES[this.currentLanguage];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    async changeQuote() {
        this.quoteElement.classList.add('fade-out');
        
        await new Promise(resolve => setTimeout(resolve, this.fadeTime));
        
        this.currentLanguage = this.currentLanguage === 'english' ? 'tamil' : 'english';
        this.quoteElement.textContent = this.getRandomQuote();
        
        this.quoteElement.classList.remove('fade-out');
    }

    start() {
        this.quoteElement.textContent = this.getRandomQuote();
        
        setTimeout(() => {
            this.changeQuote();
            setInterval(() => this.changeQuote(), this.updateInterval);
        }, this.updateInterval);
    }
}
