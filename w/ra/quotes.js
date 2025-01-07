const PHILOSOPHICAL_QUOTES = {
    tamil: [
        "வாழ்க்கை என்பது நீரோட்டம் போன்றது - எப்போதும் நகர்ந்து கொண்டே இருக்கிறது",
        "ஒவ்வொரு துகளும் பிரபஞ்சத்தின் நடனமாடும் வெளிப்பாடு",
        "நாம் அனைவரும் ஒரே ஆற்றில் பயணிக்கும் அலைகள்",
        "மாற்றமே மாறாத சத்தியம்",
        "எல்லா உயிர்களும் ஒன்றோடொன்று பின்னிப் பிணைந்தவை",
        "வேர்களை மறக்காதே - அடிப்படை எளிமையே வாழ்வின் அழகு",
        "இன்று செய்யாவிடில் நாளை இல்லை",
        "தன்னை அறிந்தவனே தன்னை வெல்பவன்",
        "மாற்றத்திற்கு ஏற்ப மாறுபவனே வெற்றி பெறுவான்"
    ],
    english: [
        "Life flows like water - ever-moving, ever-changing",
        "Each particle is a dancing expression of the cosmos",
        "We are all waves in the same cosmic river",
        "Change is the only unchanging truth",
        "All beings are intricately woven together",
        "Never forget your roots - simplicity is life's beauty",
        "If not today, tomorrow may never come",
        "One who understands self becomes self's master",
        "Those who adapt to change shall prevail",
        "We do not inherit the Earth from our ancestors; we borrow it from our children",
        "Those who commit to nothing are distracted by everything",
        "Live a life worthy of remembrance, like stars in the night sky",
        "Be who you dream to be, for tomorrow is not promised",
        "If not you, then who? If not now, then when?"
    ]
};

class QuoteManager {
    constructor() {
        this.container = document.getElementById('quoteContainer');
        this.quoteElement = document.getElementById('quote');
        this.currentLanguage = 'tamil';
        this.updateInterval = 8000;
        this.fadeTime = 1000;
        // Start with container hidden
        this.container.style.opacity = '0';
    }

    async changeQuote() {
        // Fade out
        this.quoteElement.classList.remove('fade-in');
        this.quoteElement.classList.add('fade-out');
        
        await new Promise(resolve => setTimeout(resolve, this.fadeTime));
        
        // Switch language and update text
        this.currentLanguage = this.currentLanguage === 'english' ? 'tamil' : 'english';
        this.quoteElement.textContent = this.getRandomQuote();
        
        // Update language-specific styling
        this.quoteElement.classList.toggle('tamil', this.currentLanguage === 'tamil');
        
        // Trigger reflow for smooth transition
        void this.quoteElement.offsetWidth;
        
        // Fade in
        this.quoteElement.classList.remove('fade-out');
        this.quoteElement.classList.add('fade-in');
    }

    start() {
        // Wait for loading screen to disappear + extra gap
        setTimeout(() => {
            // Set initial quote with proper styling before showing
            this.quoteElement.classList.add('tamil');
            this.quoteElement.textContent = this.getRandomQuote();
            
            // Show container with transition
            this.container.style.opacity = '1';
            
            // Start the quote cycle
            setTimeout(() => {
                this.changeQuote();
                setInterval(() => this.changeQuote(), this.updateInterval);
            }, this.updateInterval);
        }, 2500); // 1500ms loading screen + 1000ms gap
    }

    getRandomQuote() {
        const quotes = PHILOSOPHICAL_QUOTES[this.currentLanguage];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
}
