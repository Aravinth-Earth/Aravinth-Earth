// Decision Maker - Universal Edition with i18n
(function() {
  'use strict';

  // DOM elements
  const els = {
    factors: document.getElementById('factors'),
    scoreNum: document.getElementById('score-num'),
    scoreFill: document.getElementById('score-fill'),
    badge: document.getElementById('result-badge'),
    advice: document.getElementById('result-advice'),
    action: document.getElementById('result-action'),
    helpBtn: document.getElementById('help-btn'),
    infoPanel: document.getElementById('info-panel'),
    langBtn: document.getElementById('lang-btn')
  };

  const CIRCUMFERENCE = 2 * Math.PI * 42;
  let currentLang = LangManager.get();

  // Build factor UI
  function buildFactors() {
    const data = i18n[currentLang];
    els.factors.innerHTML = '';
    
    data.factors.forEach(f => {
      els.factors.insertAdjacentHTML('beforeend', `
        <div class="factor">
          <div class="factor-top">
            <span class="factor-name">${f.name}</span>
            <span class="factor-value" id="${f.id}-val">1</span>
          </div>
          <div class="factor-hint">${f.hint}</div>
          <div class="factor-scale">
            <span>${f.low}</span>
            <span>${f.high}</span>
          </div>
          <div class="choices">
            ${[1,2,3,4,5].map(n => `
              <div class="choice">
                <input type="radio" name="${f.id}" id="${f.id}-${n}" value="${n}" ${n===1?'checked':''}>
                <label for="${f.id}-${n}">${n}</label>
              </div>
            `).join('')}
          </div>
        </div>
      `);
    });

    els.factors.addEventListener('change', onFactorChange);
  }

  function getValue(id) {
    const el = document.querySelector(`input[name="${id}"]:checked`);
    return el ? parseInt(el.value, 10) : 1;
  }

  function onFactorChange(e) {
    if (e.target.type !== 'radio') return;
    const name = e.target.name;
    document.getElementById(`${name}-val`).textContent = getValue(name);
    updateResult();
  }

  function updateResult() {
    const data = i18n[currentLang];
    const factors = data.factors;
    const results = data.results;
    
    const score = factors.reduce((sum, f) => sum + getValue(f.id), 0);
    const minScore = factors.length;
    const maxScore = factors.length * 5;
    const normalized = (score - minScore) / (maxScore - minScore);

    // Update score display
    els.scoreNum.innerHTML = `${score}<small>/${maxScore}</small>`;

    // Update ring
    const offset = CIRCUMFERENCE * (1 - normalized);
    els.scoreFill.style.strokeDashoffset = offset;

    // Determine result
    let result;
    const pct = score / maxScore;
    if (pct <= 0.4) {
      result = results.small;
      els.scoreFill.style.stroke = 'var(--accent)';
      els.badge.className = 'result-badge small';
    } else if (pct <= 0.6) {
      result = results.medium;
      els.scoreFill.style.stroke = 'var(--warn)';
      els.badge.className = 'result-badge medium';
    } else {
      result = results.important;
      els.scoreFill.style.stroke = 'var(--danger)';
      els.badge.className = 'result-badge important';
    }

    els.badge.textContent = result.label;
    els.advice.textContent = result.advice;
    els.action.innerHTML = `<strong>→</strong> ${result.action}`;
  }

  // Help toggle
  function initHelp() {
    els.helpBtn.addEventListener('click', () => {
      const isOpen = els.infoPanel.classList.toggle('show');
      const data = i18n[currentLang];
      els.helpBtn.textContent = isOpen ? data.helpBtnClose : data.helpBtn;
    });
  }

  // Language toggle
  function initLang() {
    els.langBtn.addEventListener('click', () => {
      currentLang = LangManager.toggle();
      updateUI(currentLang);
      buildFactors();
      updateResult();
      
      // Update help button text if panel is open
      if (els.infoPanel.classList.contains('show')) {
        els.helpBtn.textContent = i18n[currentLang].helpBtnClose;
      }
    });
  }

  // Init
  function init() {
    currentLang = LangManager.get();
    updateUI(currentLang);
    buildFactors();
    initHelp();
    initLang();
    els.scoreFill.style.strokeDasharray = CIRCUMFERENCE;
    updateResult();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
