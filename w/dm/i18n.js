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
    title: "சிக்கிக்காதே",
    subtitle: "எந்த சூழ்நிலையையும் ~1 நிமிடத்தில் மதிப்பிடு • ஆஃப்லைன் • தடமில்லை",
    helpBtn: "இது எப்படி வேலை செய்கிறது",
    helpBtnClose: "மூடு",
    infoText: `<strong>இது என்ன?</strong> எந்த முடிவு அல்லது கவலைக்கும் ஒரு விரைவான திசைகாட்டி. 6 காரணிகளை மதிப்பிடுங்கள் (ஒவ்வொன்றும் 1-5), மதிப்பெண் (6-30) பெறுங்கள், இது உங்கள் ஆற்றலுக்கு தகுதியானதா இல்லையா என்று பாருங்கள்.<br><br>
<strong>அனைவருக்கும் பொருந்தும்:</strong> இந்த 6 காரணிகள் உலகளாவியவை—நீங்கள் மாணவர், தொழில்முறையாளர், பெற்றோர், அல்லது ஓய்வுபெற்றவர் என யாராக இருந்தாலும், உலகில் எங்கிருந்தாலும் பொருந்தும்.<br><br>
<strong>காரணிகள்:</strong><br>
• <strong>தாக்கம்</strong> – உங்கள் வாழ்க்கையில் இதன் விளைவு எவ்வளவு பெரியது?<br>
• <strong>கால அளவு</strong> – நாளை இது முக்கியமாக இருக்குமா? அடுத்த வருடம்?<br>
• <strong>மீளக்கூடியதா?</strong> – இதை சரிசெய்ய அல்லது மாற்ற முடியுமா?<br>
• <strong>கட்டுப்பாடு</strong> – இது உங்கள் சக்திக்குள் இருக்கிறதா? (இல்லையென்றால், ஏன் கவலை?)<br>
• <strong>அவசரம்</strong> – இப்போதே செயல்பட வேண்டுமா, அல்லது காத்திருக்க முடியுமா?<br>
• <strong>விழுமியங்கள்</strong> – உங்கள் ஆரோக்கியம், உறவுகள், இலக்குகள், அல்லது நம்பிக்கைகளை இது தொடுகிறதா?`,
    legendSmall: "6-12 விடுவி",
    legendMedium: "13-18 கையாளு",
    legendImportant: "19-30 கவனி",
    footer: "முடிவுகளுக்கு ஒரு திசைகாட்டி, விதிகள் அல்ல.",
    factors: [
      { id: 'impact', name: 'தாக்கம்', hint: 'இது உங்கள் வாழ்க்கையை எவ்வளவு பாதிக்கும்?', low: 'சிறிய', high: 'பெரிய' },
      { id: 'duration', name: 'கால அளவு', hint: 'இது எவ்வளவு காலம் முக்கியமாக இருக்கும்?', low: 'மணி', high: 'வருடங்கள்' },
      { id: 'reversibility', name: 'மீளக்கூடியதா?', hint: 'பின்னால் சரிசெய்ய முடியுமா?', low: 'எளிது', high: 'நிரந்தரம்' },
      { id: 'control', name: 'கட்டுப்பாடு', hint: 'உங்கள் சக்திக்குள் எவ்வளவு?', low: 'என்னால் இல்லை', high: 'முழுமையாக' },
      { id: 'urgency', name: 'அவசரம்', hint: 'இப்போதே செயல்பட வேண்டுமா?', low: 'காத்திருக்கலாம்', high: 'இப்போது' },
      { id: 'values', name: 'விழுமியங்கள்', hint: 'உங்களுக்கு முக்கியமானதை தொடுகிறதா?', low: 'தொடர்பில்லை', high: 'முக்கியம்' }
    ],
    results: {
      small: {
        label: 'விட்டுவிடு',
        advice: 'இது சிறிய விஷயம். கவனி, தேவைப்பட்டால் கற்றுக்கொள், விடுவி.',
        action: 'மூச்சு விடு, முன்னேறு. உன் ஆற்றல் வேறு இடத்தில் சிறப்பாக செலவிடப்படும்.'
      },
      medium: {
        label: 'கையாளு & முன்னேறு',
        advice: 'கவனிக்க வேண்டியது, ஆனால் அதிகம் சிந்திக்காதே.',
        action: '5-15 நிமிடம் செலவிடு, முடிவெடு, பின் மனதை முன்னோக்கி நகர்த்து.'
      },
      important: {
        label: 'கவனம் செலுத்து',
        advice: 'இது உண்மையான கவனத்தையும் சிந்தனையையும் தகுதியுடையது.',
        action: 'எழுது, விருப்பங்களை பரிசீலி, ஒரு இரவு யோசி அல்லது நம்பகமானவரிடம் பேசு.'
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
