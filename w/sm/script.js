(function() {
  'use strict';

  var tiles, startBtn, roundDisplay, bestDisplay, stepsDisplay, statusText;
  var overlay, finalRound, finalBest, restartBtn, infoBtn, infoOverlay, infoCloseBtn;
  var sequence = [], playerStep = 0, round = 0, highScore = 0, timeoutIds = [];
  var isShowing = false, isPlayerTurn = false, isGameOver = false, isLocked = false;

  function setStatus(state) {
    statusText._state = state;
    updateStatusText();
  }

  function updateStatusText() {
    if (statusText._state === 'idle') {
      statusText.textContent = 'Press Start to begin';
    } else if (statusText._state === 'showing') {
      statusText.textContent = '\u{1F440} Watch the pattern...';
      statusText.className = 'status-text waiting';
    } else if (statusText._state === 'input') {
      statusText.textContent = '\u{1F3AF} Your turn! Repeat the sequence';
      statusText.className = 'status-text input';
    } else if (statusText._state === 'correct') {
      statusText.textContent = '\u2705 Correct!';
    } else if (statusText._state === 'wrong') {
      statusText.textContent = '\u274C Wrong!';
    } else if (statusText._state === 'gameover') {
      statusText.textContent = 'Game Over \u2014 Round ' + Math.max(0, round - 1);
    }
  }

  function updateStepsDisplay() {
    if (isShowing) {
      stepsDisplay.textContent = '\u2026 / ' + sequence.length;
    } else if (isPlayerTurn) {
      stepsDisplay.textContent = playerStep + ' / ' + sequence.length;
    } else if (isGameOver || (round === 0 && !isPlayerTurn)) {
      stepsDisplay.textContent = '0 / 0';
    } else {
      stepsDisplay.textContent = '0 / ' + sequence.length;
    }
  }

  function clearTimeouts() {
    timeoutIds.forEach(function(id) { clearTimeout(id); });
    timeoutIds = [];
  }

  function flashTile(index) {
    tiles[index].classList.add('active');
    var id = setTimeout(function() { tiles[index].classList.remove('active'); }, 300);
    timeoutIds.push(id);
  }

  function showSequence() {
    isShowing = true;
    isPlayerTurn = false;
    startBtn.disabled = true;
    startBtn.textContent = 'Round ' + round;
    updateStepsDisplay();
    setStatus('showing');

    var i = 0;
    var speed = Math.max(200, 800 - round * 30);
    function showNext() {
      if (i >= sequence.length) {
        isShowing = false;
        isPlayerTurn = true;
        updateStepsDisplay();
        setStatus('input');
        return;
      }
      flashTile(sequence[i]);
      i++;
      var id = setTimeout(showNext, 300 + speed);
      timeoutIds.push(id);
    }
    var id = setTimeout(showNext, 500);
    timeoutIds.push(id);
  }

  function addStep() {
    sequence.push(Math.floor(Math.random() * 4));
    round++;
    roundDisplay.textContent = round;
    startBtn.textContent = 'Round ' + round;
    playerStep = 0;
    updateStepsDisplay();
    showSequence();
  }

  function handleTileClick(e) {
    if (isShowing || !isPlayerTurn || isGameOver || isLocked) return;
    var tile = e.currentTarget;
    var index = parseInt(tile.dataset.index, 10);
    flashTile(index);
    if (index === sequence[playerStep]) {
      playerStep++;
      updateStepsDisplay();
      if (playerStep >= sequence.length) {
        setStatus('correct');
        playerStep = 0;
        isPlayerTurn = false;
        var id = setTimeout(addStep, 600);
        timeoutIds.push(id);
      }
    } else {
      setStatus('wrong');
      endGame();
    }
  }

  function endGame() {
    isGameOver = true;
    isPlayerTurn = false;
    isLocked = true;
    startBtn.disabled = true;
    updateStepsDisplay();
    setStatus('gameover');
    var finalRoundNum = round - 1;
    if (finalRoundNum < 0) finalRoundNum = 0;
    if (finalRoundNum > highScore) {
      highScore = finalRoundNum;
      bestDisplay.textContent = highScore;
      saveHighScore();
    }
    finalRound.textContent = finalRoundNum;
    finalBest.textContent = highScore;
    tiles.forEach(function(t) { t.classList.add('wrong'); });
    var id = setTimeout(function() {
      tiles.forEach(function(t) { t.classList.remove('wrong'); });
      overlay.classList.add('show');
      isLocked = false;
    }, 500);
    timeoutIds.push(id);
  }

  function loadHighScore() {
    try {
      var saved = localStorage.getItem('simon-high');
      highScore = saved ? parseInt(saved, 10) : 0;
      if (isNaN(highScore)) highScore = 0;
    } catch(e) { highScore = 0; }
    bestDisplay.textContent = highScore;
  }

  function saveHighScore() {
    try { localStorage.setItem('simon-high', String(highScore)); } catch(e) {}
  }

  function startGame() {
    clearTimeouts();
    overlay.classList.remove('show');
    sequence = []; playerStep = 0; round = 0;
    isGameOver = false; isLocked = false;
    roundDisplay.textContent = '0';
    stepsDisplay.textContent = '0 / 0';
    startBtn.textContent = '...';
    startBtn.disabled = true;
    addStep();
  }

  function handleKeydown(e) {
    var keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
    var idx = keyMap[e.key];
    if (idx !== undefined) {
      e.preventDefault();
      handleTileClick({ currentTarget: tiles[idx] });
    }
  }

  function init() {
    tiles = document.querySelectorAll('.tile');
    startBtn = document.getElementById('start-btn');
    roundDisplay = document.getElementById('round-display');
    bestDisplay = document.getElementById('best-display');
    stepsDisplay = document.getElementById('steps-display');
    statusText = document.getElementById('status-text');
    overlay = document.getElementById('game-over-overlay');
    finalRound = document.getElementById('final-round');
    finalBest = document.getElementById('final-best');
    restartBtn = document.getElementById('restart-btn');
    infoBtn = document.getElementById('info-btn');
    infoOverlay = document.getElementById('info-overlay');
    infoCloseBtn = document.getElementById('info-close-btn');

    loadHighScore();
    setStatus('idle');

    tiles.forEach(function(t) { t.addEventListener('click', handleTileClick); });
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeydown);

    infoBtn.addEventListener('click', function() { infoOverlay.classList.add('show'); });
    infoCloseBtn.addEventListener('click', function() { infoOverlay.classList.remove('show'); });
    infoOverlay.addEventListener('click', function(e) {
      if (e.target === infoOverlay) infoOverlay.classList.remove('show');
    });
  }

  init();
})();
