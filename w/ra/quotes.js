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
    },
    {
        tamil: "வாழ்க்கை என்பது திடீர் விடைபெறுதல்களைப் பற்றியது, அதை அன்புடன் கையாளுங்கள்",
        english: "Life is all about sudden goodbyes, handle it with care",
        source: "Movie: Couple Friendly (2026)"
    },
    {
        tamil: "மிஞ்சி போனால் மரணம் என்றபோது வாழ்க்கை வாழ வெட்கப்படலாமா / பயப்படலாமா ?",
        english: "If the worst that can happen is death, should life be ashamed or afraid to live?",
        source: "Read from a fellow human's Instagram profile"
    }
];

class QuoteManager {
    constructor() {
        this.container = document.getElementById('quoteContainer');
        this.tamilEl = document.getElementById('quoteTamil');
        this.englishEl = document.getElementById('quoteEnglish');
        this.sourceEl = document.getElementById('quoteSource');
        this.displayDuration = 10000;
        this.fadeTime = 1000;
        this.previousQuoteIndex = -1;
    }

    getRandomQuote() {
        let index;
        do {
            index = Math.floor(Math.random() * PHILOSOPHICAL_QUOTES.length);
        } while (index === this.previousQuoteIndex);
        this.previousQuoteIndex = index;
        return PHILOSOPHICAL_QUOTES[index];
    }

    async showQuote(quote) {
        this.tamilEl.textContent = quote.tamil;
        this.englishEl.textContent = quote.english;

        if (quote.source) {
            this.sourceEl.textContent = `— ${quote.source}`;
            this.sourceEl.style.display = 'block';
        } else {
            this.sourceEl.style.display = 'none';
        }

        this.container.classList.remove('fade-out');
        this.container.classList.add('fade-in');

        await new Promise(resolve => setTimeout(resolve, this.displayDuration));

        this.container.classList.remove('fade-in');
        this.container.classList.add('fade-out');

        await new Promise(resolve => setTimeout(resolve, this.fadeTime));
    }

    async start() {
        setTimeout(async () => {
            while (true) {
                const quote = this.getRandomQuote();
                await this.showQuote(quote);
            }
        }, 2500);
    }
}
