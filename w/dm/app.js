// Decision Maker - Universal Edition
(function() {
  'use strict';

  // 6 Universal factors that work across any culture/situation
  const factors = [
    {
      id: 'impact',
      name: 'Impact',
      hint: 'How much will this affect your life?',
      low: 'Tiny',
      high: 'Huge'
    },
    {
      id: 'duration',
      name: 'Duration',
      hint: 'How long will this matter?',
      low: 'Hours',
      high: 'Years'
    },
    {
      id: 'reversibility',
      name: 'Reversible?',
      hint: 'Can you undo or fix it later?',
      low: 'Easy fix',
      high: 'Permanent'
    },
    {
      id: 'control',
      name: 'Control',
      hint: 'How much is within your power?',
      low: 'Not mine',
      high: 'Fully mine'
    },
    {
      id: 'urgency',
      name: 'Urgency',
      hint: 'Does it need action right now?',
      low: 'Can wait',
      high: 'Now'
    },
    {
      id: 'values',
      name: 'Values',
      hint: 'Does it touch what matters most to you?',
      low: 'No link',
      high: 'Core'
    }
  ];

  // Results with actionable guidance
  const results = {
    small: {
      label: 'Let It Go',
      advice: 'This is a small thing. Note it, learn if needed, release it.',
      action: 'Take a breath and move on. Your energy is better spent elsewhere.',
      class: 'small'
    },
    medium: {
      label: 'Handle & Move On',
      advice: 'Worth addressing, but don\'t overthink it.',
      action: 'Spend 5-15 minutes on it, make a decision, then let your mind move forward.',
      class: 'medium'
    },
    important: {
      label: 'Give It Focus',
      advice: 'This deserves real attention and thoughtful action.',
      action: 'Write it down, consider options, maybe sleep on it or talk to someone you trust.',
      class: 'important'
    }
  };

  // DOM elements
  const els = {
    factors: document.getElementById('factors'),
    scoreNum: document.getElementById('score-num'),
    scoreFill: document.getElementById('score-fill'),
    badge: document.getElementById('result-badge'),
    advice: document.getElementById('result-advice'),
    action: document.getElementById('result-action'),
    helpBtn: document.getElementById('help-btn'),
    infoPanel: document.getElementById('info-panel')
  };

  const CIRCUMFERENCE = 2 * Math.PI * 42;
  const MIN_SCORE = factors.length;
  const MAX_SCORE = factors.length * 5;

  // Build factor UI
  function initFactors() {
    factors.forEach(f => {
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
    const score = factors.reduce((sum, f) => sum + getValue(f.id), 0);
    const normalized = (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);

    // Update score display
    els.scoreNum.innerHTML = `${score}<small>/${MAX_SCORE}</small>`;

    // Update ring
    const offset = CIRCUMFERENCE * (1 - normalized);
    els.scoreFill.style.strokeDashoffset = offset;

    // Determine result
    let result;
    const pct = score / MAX_SCORE;
    if (pct <= 0.4) {
      result = results.small;
      els.scoreFill.style.stroke = 'var(--accent)';
    } else if (pct <= 0.6) {
      result = results.medium;
      els.scoreFill.style.stroke = 'var(--warn)';
    } else {
      result = results.important;
      els.scoreFill.style.stroke = 'var(--danger)';
    }

    els.badge.textContent = result.label;
    els.badge.className = `result-badge ${result.class}`;
    els.advice.textContent = result.advice;
    els.action.innerHTML = `<strong>→</strong> ${result.action}`;
  }

  // Help toggle
  function initHelp() {
    els.helpBtn.addEventListener('click', () => {
      els.infoPanel.classList.toggle('show');
      els.helpBtn.textContent = els.infoPanel.classList.contains('show') ? 'Close' : 'How it works';
    });
  }

  // Init
  function init() {
    initFactors();
    initHelp();
    els.scoreFill.style.strokeDasharray = CIRCUMFERENCE;
    updateResult();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
