const PHILOSOPHICAL_QUOTES = [
    {
        tamil: "வாழ்க்கை என்பது நீரோட்டம் போன்றது - எப்போதும் நகர்ந்து கொண்டே இருக்கிறது",
        english: "Life flows like water - ever-moving, ever-changing"
    },
    {
        tamil: "ஒவ்வொரு துகளும் பிரபஞ்சத்தின் நடனமாடும் வெளிப்பாடு",
        english: "Each particle is a dancing expression of the cosmos"
    },
    {
        tamil: "நாம் அனைவரும் ஒரே ஆற்றில் பயணிக்கும் அலைகள்",
        english: "We are all waves in the same cosmic river"
    },
    {
        tamil: "மாற்றம் ஒன்றே மாறாதது",
        english: "Change is the only Constant"
    },
    {
        tamil: "எல்லா உயிர்களும் ஒன்றோடொன்று பின்னிப் பிணைந்தவை",
        english: "All beings are intricately woven together"
    },
    {
        tamil: "வேர்களை மறக்காதே - அடிப்படை எளிமையே வாழ்வின் அழகு",
        english: "Never forget your roots - simplicity is life's beauty"
    },
    {
        tamil: "இன்று செய்யாவிடில் நாளை இல்லை",
        english: "If not today, tomorrow may never come"
    },
    {
        tamil: "மாற்றத்திற்கு ஏற்ப மாறுபவனே வெற்றி பெறுவான்",
        english: "Those who adapt to change shall prevail"
    },
    {
        tamil: "நாம் எங்கள் முன்னோர்களிடமிருந்து பூமியை பரம்பரை வழியாக பெறவில்லை; நம் குழந்தைகளிடமிருந்து கடன் வாங்குகிறோம்",
        english: "We do not inherit the Earth from our ancestors; we borrow it from our children"
    }
];

class QuoteManager {
    constructor() {
        this.container = document.getElementById('quoteContainer');
        this.quoteElement = document.getElementById('quote');
        this.updateInterval = 8000;
        this.fadeTime = 1000;
        this.gapTime = 2000; // 2 seconds gap between Tamil and English
        this.longGapTime = 5000; // 5 seconds gap before next quote
        this.previousQuoteIndex = -1; // Track previous quote index
        // Start with container hidden
        this.container.style.opacity = '0';
    }

    getRandomQuote() {
        let index;
        do {
            index = Math.floor(Math.random() * PHILOSOPHICAL_QUOTES.length);
        } while (index === this.previousQuoteIndex);
        this.previousQuoteIndex = index;
        return PHILOSOPHICAL_QUOTES[index];
    }

    async showQuote(quote, language) {
        // Set quote text and styling
        this.quoteElement.textContent = quote[language];
        this.quoteElement.classList.toggle('tamil', language === 'tamil');
        this.quoteElement.classList.toggle('english', language === 'english');

        // Fade in
        this.quoteElement.classList.remove('fade-out');
        this.quoteElement.classList.add('fade-in');

        // Wait for display duration
        await new Promise(resolve => setTimeout(resolve, this.updateInterval));

        // Fade out
        this.quoteElement.classList.remove('fade-in');
        this.quoteElement.classList.add('fade-out');

        await new Promise(resolve => setTimeout(resolve, this.fadeTime));
    }

    async start() {
        // Wait for loading screen to disappear + extra gap
        setTimeout(async () => {
            // Show container with transition
            this.container.style.opacity = '1';

            // Start the quote cycle
            while (true) {
                const quote = this.getRandomQuote();

                // Show Tamil variant
                await this.showQuote(quote, 'tamil');

                // 2 seconds gap
                this.container.style.opacity = '0'; // Hide container during gap
                await new Promise(resolve => setTimeout(resolve, this.gapTime));
                this.container.style.opacity = '1'; // Show container before next quote

                // Show English variant
                await this.showQuote(quote, 'english');

                // 5 seconds gap
                this.container.style.opacity = '0'; // Hide container during gap
                await new Promise(resolve => setTimeout(resolve, this.longGapTime));
                this.container.style.opacity = '1'; // Show container before next quote
            }
        }, 2500); // 1500ms loading screen + 1000ms gap
    }
}
