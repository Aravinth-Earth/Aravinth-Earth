// Internationalization - English & Tamil
const i18n = {
  en: {
    title: "Don't Get Stuck",
    subtitle: "Score any situation in ~1 min • Offline • No tracking",
    helpBtn: "How it works",
    helpBtnClose: "Close",
    infoText: `<strong>What is this?</strong> A quick compass for any decision or worry. Rate 6 factors (1-5 each), get a score (6-30), and see if this deserves your energy or not.<br><br>
<strong>Works for anyone:</strong> These 6 factors are universal—they apply whether you're a student, professional, parent, or retiree, anywhere in the world.<br><br>
<strong>The factors:</strong><br>
• <strong>Impact</strong> – How big is the effect on your life?<br>
• <strong>Duration</strong> – Will it matter tomorrow? Next year?<br>
• <strong>Reversible?</strong> – Can you fix or undo it?<br>
• <strong>Control</strong> – Is this within your power? (If not, why stress?)<br>
• <strong>Urgency</strong> – Must you act now, or can it wait?<br>
• <strong>Values</strong> – Does it touch your health, relationships, goals, or beliefs?`,
    legendSmall: "6-12 Let go",
    legendMedium: "13-18 Handle it",
    legendImportant: "19-30 Focus",
    footer: "A compass for decisions, not a rulebook.",
    factors: [
      { id: 'impact', name: 'Impact', hint: 'How much will this affect your life?', low: 'Tiny', high: 'Huge' },
      { id: 'duration', name: 'Duration', hint: 'How long will this matter?', low: 'Hours', high: 'Years' },
      { id: 'reversibility', name: 'Reversible?', hint: 'Can you undo or fix it later?', low: 'Easy fix', high: 'Permanent' },
      { id: 'control', name: 'Control', hint: 'How much is within your power?', low: 'Not mine', high: 'Fully mine' },
      { id: 'urgency', name: 'Urgency', hint: 'Does it need action right now?', low: 'Can wait', high: 'Now' },
      { id: 'values', name: 'Values', hint: 'Does it touch what matters most to you?', low: 'No link', high: 'Core' }
    ],
    results: {
      small: {
        label: 'Let It Go',
        advice: 'This is a small thing. Note it, learn if needed, release it.',
        action: 'Take a breath and move on. Your energy is better spent elsewhere.'
      },
      medium: {
        label: 'Handle & Move On',
        advice: "Worth addressing, but don't overthink it.",
        action: 'Spend 5-15 minutes on it, make a decision, then let your mind move forward.'
      },
      important: {
        label: 'Give It Focus',
        advice: 'This deserves real attention and thoughtful action.',
        action: 'Write it down, consider options, maybe sleep on it or talk to someone you trust.'
      }
    }
  },
  ta: {
    title: "சிக்கிக் கொள்ளாதே",
    subtitle: "எந்த சூழ்நிலையையும் 1 நிமிடத்தில் அளவிடு • ஆஃப்லைன் • கண்காணிப்பு இல்லை",
    helpBtn: "வேலை செய்பது எப்படி",
    helpBtnClose: "மூடு",
    infoText: `<strong>இது என்ன?</strong> எந்த முடிவு அல்லது மன அழுத்தத்துக்கும் ஒரு விரைவான திசைகாட்டி. 6 காரணிகளை (ஒவ்வொன்றும் 1-5) மதிப்பிட்டால், 6-30 என்ற மதிப்பெண் கிடைக்கும்; இது உண்மையில் உங்களின் ஆற்றலை வேண்டுமா என்று சொல்லிக்கும்.<br><br>
<strong>யாருக்கும் பொருந்தும்:</strong> மாணவர், பெற்றோர், பணியாளர், தொழிலதிபர் – யார் என்றாலும், எங்கு வாழ்ந்தாலும் இந்த 6 காரணிகள் வேலை செய்கின்றன.<br><br>
<strong>காரணிகள்:</strong><br>
• <strong>விளைவு</strong> – இது உங்கள் நாள் / வாழ்க்கையை எவ்வளவு பாதிக்கிறது?<br>
• <strong>காலவளம்</strong> – நாளை இது முக்கியமா? அடுத்த வருடமா?<br>
• <strong>மீட்டெடுக்கலாமா?</strong> – தவறு என்றால் திரும்ப சரி செய்ய முடியுமா?<br>
• <strong>கட்டுப்பாடு</strong> – இது உங்கள் கையில் இருக்கிறதா? (இல்லை என்றால், எவ்வளவு கவலை?)<br>
• <strong>அவசரம்</strong> – இப்போதே செயற்கூடிய காரியமா, இல்லை காத்திருக்கலாமா?<br>
• <strong>மூலியங்கள்</strong> – உங்கள் ஆரோக்கியம், உறவுகள், குறிக்கோள்கள், நம்பிக்கைகளை இது தொடுகிறதா?`,
    legendSmall: "6-12 விடு",
    legendMedium: "13-18 செய்து விடு",
    legendImportant: "19-30 கவனி",
    footer: "முடிவுகளுக்கான திசைகாட்டி; கட்டுப்பாட்டு புத்தகம் அல்ல.",
    factors: [
      { id: 'impact', name: 'விளைவு', hint: 'இது உங்கள் வாழ்க்கையை எவ்வளவு பாதிக்கும்?', low: 'சிறிது', high: 'மிக அதிகம்' },
      { id: 'duration', name: 'காலவளம்', hint: 'இது எவ்வளவு நேரம் முக்கியமாய் இருக்கும்?', low: 'மணி நேரம்', high: 'வருடங்கள்' },
      { id: 'reversibility', name: 'மீட்டெடுக்கலாமா?', hint: 'பின்னர் சரிசெய்ய / திருப்பிக் கொள்ள முடியுமா?', low: 'எளிதாக முடியும்', high: 'முடியாது' },
      { id: 'control', name: 'கட்டுப்பாடு', hint: 'இந்த நிலைமையில் உங்களுக்கு எவ்வளவு அதிகாரம்?', low: 'என்னால் முடியாது', high: 'முழுக்க என்கையில்' },
      { id: 'urgency', name: 'அவசரம்', hint: 'இப்போதே செயல் தேவைமா?', low: 'காத்திருக்கலாம்', high: 'உடனே' },
      { id: 'values', name: 'மூலியங்கள்', hint: 'உங்களுக்கு முக்கியமானதை இது தொடுகிறதா?', low: 'தொடர்பு இல்லை', high: 'மூல தூண்' }
    ],
    results: {
      small: {
        label: 'விடு',
        advice: 'இது ஒரு சிறிய விஷயம். கவனித்துக் கொள், பாடம் இருந்தால் கற்றுக்கொள், பின் விடு.',
        action: 'ஆழமாக மூச்சு விடு, முன்னேறு. உன் ஆற்றலை வேறு முக்கியமானதுக்கு வை.'
      },
      medium: {
        label: 'செய்து முன்னேறு',
        advice: 'இது கவனிக்க வேண்டியது தான், ஆனால் நிறைய சிந்திக்க வேண்டாம்.',
        action: '5-15 நிமிடம் செலவிட்டு முடிவெடு; முடிந்தவுடன் மனதை அடுத்ததுக்கு நகர்த்து.'
      },
      important: {
        label: 'கவனமாக கையாள்',
        advice: 'இது தீவிர கவனம், சிந்தனை, திட்டம் எல்லாம் தேவைப்பாடானது.',
        action: 'எழுதி வைய், விருப்பங்களை கணக்கிடு, தேவையெனில் உறவினர் / நம்பிக்கை உள்ளவரிடம் பேசு அல்லது ஒரு இரவு யோசி.'
      }
    }
  }
};

// Language management
const LangManager = {
  STORAGE_KEY: 'dm-lang',
  
  get() {
    // Check localStorage first
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored && (stored === 'en' || stored === 'ta')) {
      return stored;
    }
    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang && browserLang.toLowerCase().startsWith('ta')) {
      return 'ta';
    }
    return 'en';
  },
  
  set(lang) {
    localStorage.setItem(this.STORAGE_KEY, lang);
  },
  
  toggle() {
    const current = this.get();
    const next = current === 'en' ? 'ta' : 'en';
    this.set(next);
    return next;
  }
};

// Get current language data
function getLang() {
  return i18n[LangManager.get()];
}

// Update all UI text
function updateUI(lang) {
  const data = i18n[lang];
  
  // Update elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (data[key]) {
      if (key === 'infoText') {
        el.innerHTML = data[key];
      } else {
        el.textContent = data[key];
      }
    }
  });
  
  // Update lang button
  document.getElementById('lang-label').textContent = lang === 'en' ? 'த' : 'EN';
  document.getElementById('lang-btn').title = lang === 'en' ? 'தமிழுக்கு மாறு' : 'Switch to English';
  
  // Update HTML lang attribute
  document.documentElement.lang = lang === 'ta' ? 'ta' : 'en';
}
