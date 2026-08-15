(function () {
    'use strict';

    /* =============================================
       TAMIL CALENDAR DATA
       ============================================= */

    var TAMIL_MONTHS = [
        { en: 'Chithirai',  ta: 'சித்திரை',   zodiac: '♈', zodiacEn: 'Aries' },
        { en: 'Vaikasi',    ta: 'வைகாசி',     zodiac: '♉', zodiacEn: 'Taurus' },
        { en: 'Aani',       ta: 'ஆனி',         zodiac: '♊', zodiacEn: 'Gemini' },
        { en: 'Aadi',       ta: 'ஆடி',         zodiac: '♋', zodiacEn: 'Cancer' },
        { en: 'Aavani',     ta: 'ஆவணி',       zodiac: '♌', zodiacEn: 'Leo' },
        { en: 'Purattasi',  ta: 'புரட்டாசி',  zodiac: '♍', zodiacEn: 'Virgo' },
        { en: 'Aippasi',    ta: 'ஐப்பசி',      zodiac: '♎', zodiacEn: 'Libra' },
        { en: 'Karthigai',  ta: 'கார்த்திகை', zodiac: '♏', zodiacEn: 'Scorpio' },
        { en: 'Margazhi',   ta: 'மார்கழி',     zodiac: '♐', zodiacEn: 'Sagittarius' },
        { en: 'Thai',       ta: 'தை',           zodiac: '♑', zodiacEn: 'Capricorn' },
        { en: 'Maasi',      ta: 'மாசி',        zodiac: '♒', zodiacEn: 'Aquarius' },
        { en: 'Panguni',    ta: 'பங்குனி',     zodiac: '♓', zodiacEn: 'Pisces' }
    ];

    var TAMIL_DAYS = [
        { en: 'Sunday',    ta: 'ஞாயிறு' },
        { en: 'Monday',    ta: 'திங்கள்' },
        { en: 'Tuesday',   ta: 'செவ்வாய்' },
        { en: 'Wednesday', ta: 'புதன்' },
        { en: 'Thursday',  ta: 'வியாழன்' },
        { en: 'Friday',    ta: 'வெள்ளி' },
        { en: 'Saturday',  ta: 'சனி' }
    ];

    var EN_MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    var EN_DAYS = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
    ];

    var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var TAMIL_YEAR_NAMES = [
        'பிரபவ', 'விபவ', 'சுக்ல', 'பிரமோதூத', 'பிரசோற்பத்தி',
        'ஆங்கீரச', 'ஸ்ரீமுக', 'பவ', 'யுவ', 'தாது',
        'ஈஸ்வர', 'வெகுதானிய', 'பிரமாதி', 'விக்ரம', 'விஷு',
        'சித்திரபானு', 'சுபானு', 'தாரண', 'பார்த்திப', 'விய',
        'சர்வஜித்', 'சர்வதாரி', 'விரோதி', 'விக்ருதி', 'கர',
        'நந்தன', 'விஜய', 'ஜய', 'மன்மத', 'துன்முகி',
        'ஹேவிளம்பி', 'விளம்பி', 'விகாரி', 'சார்வரி', 'பிளவ',
        'சுபகிருது', 'சோபகிருது', 'குரோதி', 'விசுவாசுவ', 'பராபவ',
        'பிளவங்க', 'கீலக', 'சௌம்ய', 'சாதாரண', 'விரோதகிருது',
        'பரிதாபி', 'பிரமாதீச', 'ஆனந்த', 'ராட்சச', 'நள',
        'பிங்கள', 'காளயுக்தி', 'சித்தார்த்தி', 'ரௌத்ரி', 'துன்மதி',
        'துந்துபி', 'ருத்ரோத்காரி', 'ரக்தாட்சி', 'குரோதன', 'அட்சய'
    ];

    /* =============================================
       ASTRONOMY
       ============================================= */

    function getAyanamsa(year) {
        return 24.0 + (year - 2024) * 0.05;
    }

    function gregorianToTamil(date) {
        var year = date.getFullYear();
        var ayanamsa = getAyanamsa(year);

        var time = Astro.MakeTime(date);
        var sun = Astro.SunPosition(time);
        var siderealLon = ((sun.elon - ayanamsa) % 360 + 360) % 360;
        var monthIdx = Math.floor(siderealLon / 30);

        var tropicalBoundary = (monthIdx * 30 + ayanamsa) % 360;
        var boundaryDate = null;
        for (var daysBack = 1; daysBack <= 35; daysBack++) {
            var searchStart = new Date(date.getTime() - daysBack * 86400000);
            var result = Astro.SearchSunLongitude(tropicalBoundary, searchStart, daysBack + 1);
            if (result) { boundaryDate = result.date; break; }
        }

        var dayInMonth = 1;
        if (boundaryDate) {
            dayInMonth = Math.floor((date - boundaryDate) / 86400000) + 1;
        }

        var gMonth = date.getMonth();
        var gDay = date.getDate();
        var tYear = (gMonth > 3 || (gMonth === 3 && gDay >= 14)) ? year - 78 : year - 79;

        return {
            year: tYear,
            month: monthIdx,
            day: dayInMonth,
            monthEn: TAMIL_MONTHS[monthIdx].en,
            monthTa: TAMIL_MONTHS[monthIdx].ta,
            dayEn: TAMIL_DAYS[date.getDay()].en,
            dayTa: TAMIL_DAYS[date.getDay()].ta
        };
    }

    /* =============================================
       ENGLISH DATE
       ============================================= */

    function formatEnglish(date) {
        return {
            day: EN_DAYS[date.getDay()],
            month: EN_MONTHS[date.getMonth()],
            dayNum: date.getDate(),
            year: date.getFullYear()
        };
    }

    /* =============================================
       PROGRESS CALCULATIONS
       ============================================= */

    function isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }

    function getDayProgress(date) {
        var secs = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
        return Math.round((secs / 86400) * 100);
    }

    function getGregorianMonthProgress(date) {
        var month = date.getMonth();
        var day = date.getDate();
        var daysInMonth = DAYS_IN_MONTH[month];
        if (month === 1 && isLeapYear(date.getFullYear())) daysInMonth = 29;
        return Math.round((day / daysInMonth) * 100);
    }

    function getGregorianYearProgress(date) {
        var start = new Date(date.getFullYear(), 0, 0);
        var dayOfYear = Math.floor((date - start) / 86400000);
        var totalDays = isLeapYear(date.getFullYear()) ? 366 : 365;
        return Math.round((dayOfYear / totalDays) * 100);
    }

    function getTamilMonthProgress(dayInMonth, monthIdx) {
        var tamilMonthDays = [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30];
        return Math.round((dayInMonth / tamilMonthDays[monthIdx]) * 100);
    }

    function getTamilYearProgress(dayInMonth, monthIdx) {
        var tamilMonthDays = [31, 31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30];
        var totalDays = 0;
        for (var i = 0; i < 12; i++) totalDays += tamilMonthDays[i];
        var daysSoFar = 0;
        for (var j = 0; j < monthIdx; j++) daysSoFar += tamilMonthDays[j];
        daysSoFar += dayInMonth;
        return Math.round((daysSoFar / totalDays) * 100);
    }

    /* =============================================
       DOM ELEMENTS
       ============================================= */

    var els = {
        clock: document.getElementById('clock'),
        clockTz: document.getElementById('clock-tz'),
        dayProgressFill: document.getElementById('day-progress-fill'),
        dayProgressPct: document.getElementById('day-progress-pct'),
        dateEn: document.getElementById('date-en'),
        dayEn: document.getElementById('day-en'),
        monthEn: document.getElementById('month-en'),
        yearEn: document.getElementById('year-en'),
        progressPctMEn: document.getElementById('progress-pct-m-en'),
        progressFillMEn: document.getElementById('progress-fill-m-en'),
        progressPctYEn: document.getElementById('progress-pct-y-en'),
        progressFillYEn: document.getElementById('progress-fill-y-en'),
        dateTa: document.getElementById('date-ta'),
        dayTa: document.getElementById('day-ta'),
        monthTa: document.getElementById('month-ta'),
        yearTa: document.getElementById('year-ta'),
        progressPctMTa: document.getElementById('progress-pct-m-ta'),
        progressFillMTa: document.getElementById('progress-fill-m-ta'),
        progressPctYTa: document.getElementById('progress-pct-y-ta'),
        progressFillYTa: document.getElementById('progress-fill-y-ta')
    };

    // Timezone abbreviation — shown once, doesn't change
    var tzShort = '';
    try {
        tzShort = Intl.DateTimeFormat('en-IN', { timeZoneName: 'short' })
            .formatToParts(new Date())
            .find(function (p) { return p.type === 'timeZoneName'; }).value;
    } catch (e) {
        tzShort = '';
    }

    var lastDateStr = '';

    function pad(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    /* =============================================
       UPDATE LOOP
       ============================================= */

    function updateAll() {
        var now = new Date();

        // 24-hour clock
        var h = now.getHours();
        var m = now.getMinutes();
        var s = now.getSeconds();

        els.clock.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
        els.clockTz.textContent = tzShort;

        // Day progress (updates every second)
        var dayProg = getDayProgress(now);
        els.dayProgressFill.style.width = dayProg + '%';
        els.dayProgressPct.textContent = dayProg + '%';

        // Date string for midnight detection
        var dateStr = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();

        if (dateStr !== lastDateStr) {
            lastDateStr = dateStr;

            // English
            var en = formatEnglish(now);
            els.dateEn.textContent = en.dayNum + ' ' + en.month.substring(0, 3) + ' ' + en.year;
            els.dayEn.textContent = en.day;
            els.monthEn.textContent = en.month;
            els.yearEn.textContent = en.year;

            els.progressPctMEn.textContent = getGregorianMonthProgress(now) + '%';
            els.progressFillMEn.style.width = getGregorianMonthProgress(now) + '%';
            els.progressPctYEn.textContent = getGregorianYearProgress(now) + '%';
            els.progressFillYEn.style.width = getGregorianYearProgress(now) + '%';

            // Tamil
            var ta = gregorianToTamil(now);
            els.dateTa.textContent = ta.day + ' ' + ta.monthTa + ' ' + ta.year;
            els.dayTa.textContent = ta.dayTa + ' (' + ta.dayEn + ')';
            els.monthTa.textContent = ta.monthTa + ' (' + ta.monthEn + ')';
            els.yearTa.textContent = ta.year + ' (' + tamilYearName(ta.year) + ')';
            els.progressPctMTa.textContent = getTamilMonthProgress(ta.day, ta.month) + '%';
            els.progressFillMTa.style.width = getTamilMonthProgress(ta.day, ta.month) + '%';
            els.progressPctYTa.textContent = getTamilYearProgress(ta.day, ta.month) + '%';
            els.progressFillYTa.style.width = getTamilYearProgress(ta.day, ta.month) + '%';
        }
    }

    function tamilYearName(year) {
        return TAMIL_YEAR_NAMES[year % 60];
    }

    /* =============================================
       THEME TOGGLE
       ============================================= */

    var toggleBtn = document.getElementById('theme-toggle');
    var themeIcon = toggleBtn.querySelector('.theme-icon');

    function setTheme(light) {
        if (light) {
            document.body.classList.add('light');
            themeIcon.textContent = '🌙';
            localStorage.setItem('cal-theme', 'light');
        } else {
            document.body.classList.remove('light');
            themeIcon.textContent = '☀️';
            localStorage.setItem('cal-theme', 'dark');
        }
    }

    var savedTheme = localStorage.getItem('cal-theme');
    if (savedTheme === 'light') {
        setTheme(true);
    }

    toggleBtn.addEventListener('click', function () {
        var isLight = document.body.classList.contains('light');
        setTheme(!isLight);
    });

    /* =============================================
       INIT
       ============================================= */

    updateAll();
    setInterval(updateAll, 1000);

})();
