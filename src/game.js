(function () {
  'use strict';

  var DIFFICULTY_LABELS = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard'
  };

  var DIFFICULTY_CONFIG = {
    easy: {
      duration: 90,
      ops: ['add', 'sub'],
      ranges: {
        add: { aMin: 1, aMax: 25, bMin: 1, bMax: 25 },
        sub: { aMin: 10, aMax: 50, bMin: 1, bMax: 9 }
      }
    },
    normal: {
      duration: 60,
      ops: ['add', 'sub', 'mul', 'div'],
      ranges: {
        add: { aMin: 10, aMax: 99, bMin: 10, bMax: 99 },
        sub: { aMin: 20, aMax: 99, bMin: 2, bMax: 19 },
        mul: { aMin: 2, aMax: 12, bMin: 2, bMax: 12 },
        div: { bMin: 2, bMax: 12, aMin: 1, aMax: 12 }
      }
    },
    hard: {
      duration: 45,
      ops: ['add', 'sub', 'mul', 'div'],
      ranges: {
        add: { aMin: 100, aMax: 999, bMin: 100, bMax: 999 },
        sub: { aMin: 100, aMax: 999, bMin: 50, bMax: 499 },
        mul: { aMin: 4, aMax: 15, bMin: 4, bMax: 15 },
        div: { bMin: 4, bMax: 15, aMin: 2, aMax: 15 }
      }
    }
  };

  var state = {
    timerInterval: null,
    timeLeft: DIFFICULTY_CONFIG.normal.duration,
    duration: DIFFICULTY_CONFIG.normal.duration,
    difficulty: null,
    score: 0,
    attempted: 0,
    correct: 0,
    wrong: 0,
    currentAnswer: null,
    gameOver: true,
    submitting: false
  };

  var els = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateQuestion() {
    var cfg = DIFFICULTY_CONFIG[state.difficulty];
    var op = cfg.ops[randInt(0, cfg.ops.length - 1)];
    var r, a, b, text, answer;

    switch (op) {
      case 'add':
        r = cfg.ranges.add;
        a = randInt(r.aMin, r.aMax);
        b = randInt(r.bMin, r.bMax);
        text = a + ' + ' + b + ' =';
        answer = a + b;
        break;
      case 'sub':
        r = cfg.ranges.sub;
        a = randInt(r.aMin, r.aMax);
        b = randInt(r.bMin, r.bMax);
        text = a + ' \u2212 ' + b + ' =';
        answer = a - b;
        break;
      case 'mul':
        r = cfg.ranges.mul;
        a = randInt(r.aMin, r.aMax);
        b = randInt(r.bMin, r.bMax);
        text = a + ' \u00d7 ' + b + ' =';
        answer = a * b;
        break;
      case 'div':
        r = cfg.ranges.div;
        b = randInt(r.bMin, r.bMax);
        answer = randInt(r.aMin, r.aMax);
        a = b * answer;
        text = a + ' \u00f7 ' + b + ' =';
        break;
    }

    return { text: text, answer: answer };
  }

  function init() {
    els.timerText = byId('timerText');
    els.timerBar = byId('timerBar');
    els.statScore = byId('statScore');
    els.statAttempted = byId('statAttempted');
    els.statCorrect = byId('statCorrect');
    els.statWrong = byId('statWrong');
    els.question = byId('question');
    els.answerForm = byId('answerForm');
    els.answerInput = byId('answerInput');
    els.submitBtn = byId('submitBtn');
    els.feedback = byId('feedback');
    els.gameScreen = byId('gameScreen');
    els.resultScreen = byId('resultScreen');
    els.finalScore = byId('finalScore');
    els.finalCorrect = byId('finalCorrect');
    els.finalWrong = byId('finalWrong');
    els.finalAttempted = byId('finalAttempted');
    els.finalAccuracy = byId('finalAccuracy');
    els.finalDifficulty = byId('finalDifficulty');
    els.playAgainBtn = byId('playAgainBtn');
    els.changeDifficultyBtn = byId('changeDifficultyBtn');
    els.difficultyScreen = byId('difficultyScreen');
    els.difficultyGroup = byId('difficultyGroup');
    els.difficultyOptions = Array.prototype.slice.call(els.difficultyGroup.querySelectorAll('[data-difficulty]'));
    els.startGameBtn = byId('startGameBtn');
    els.backBtn = byId('backBtn');

    els.difficultyGroup.addEventListener('click', handleDifficultyClick);
    els.difficultyGroup.addEventListener('keydown', handleDifficultyKeydown);
    els.startGameBtn.addEventListener('click', startGame);
    els.backBtn.addEventListener('click', handleBack);
    els.answerForm.addEventListener('submit', handleSubmit);
    els.playAgainBtn.addEventListener('click', startGame);
    els.changeDifficultyBtn.addEventListener('click', function () {
      showDifficultyScreen();
    });

    showDifficultyScreen();
  }

  function handleBack() {
    stopTimer();
    window.history.back();
  }

  function handleDifficultyClick(event) {
    var el = event.target && event.target.closest ? event.target.closest('[data-difficulty]') : null;
    if (el) {
      selectDifficulty(el.getAttribute('data-difficulty'));
    }
  }

  function handleDifficultyKeydown(event) {
    var key = event.key;
    var n = els.difficultyOptions.length;
    var idx = els.difficultyOptions.indexOf(document.activeElement);
    var next = -1;

    if (key === 'ArrowDown' || key === 'ArrowRight') {
      next = idx < 0 ? 0 : (idx + 1) % n;
    } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
      next = idx < 0 ? n - 1 : (idx - 1 + n) % n;
    } else if (key === 'Home') {
      next = 0;
    } else if (key === 'End') {
      next = n - 1;
    }

    if (next !== -1) {
      event.preventDefault();
      els.difficultyOptions[next].focus();
      selectDifficulty(els.difficultyOptions[next].getAttribute('data-difficulty'));
    }
  }

  function selectDifficulty(difficulty) {
    state.difficulty = difficulty;
    for (var i = 0; i < els.difficultyOptions.length; i++) {
      var opt = els.difficultyOptions[i];
      var selected = opt.getAttribute('data-difficulty') === difficulty;
      opt.classList.toggle('border-amber-400', selected);
      opt.classList.toggle('bg-amber-400/15', selected);
      opt.classList.toggle('border-white/15', !selected);
      opt.classList.toggle('bg-white/10', !selected);
      opt.setAttribute('aria-checked', selected ? 'true' : 'false');
      var check = opt.querySelector('.difficulty-check');
      if (check) {
        check.classList.toggle('opacity-100', selected);
        check.classList.toggle('scale-100', selected);
        check.classList.toggle('opacity-0', !selected);
        check.classList.toggle('scale-75', !selected);
      }
    }
    els.startGameBtn.disabled = false;
  }

  function showDifficultyScreen() {
    stopTimer();
    els.gameScreen.classList.add('hidden');
    els.resultScreen.classList.add('hidden');
    els.difficultyScreen.classList.remove('hidden');

    if (state.difficulty) {
      selectDifficulty(state.difficulty);
    }
    focusFirstSelectedOption();
  }

  function focusFirstSelectedOption() {
    var target = els.difficultyOptions[0];
    for (var i = 0; i < els.difficultyOptions.length; i++) {
      if (els.difficultyOptions[i].getAttribute('data-difficulty') === state.difficulty) {
        target = els.difficultyOptions[i];
        break;
      }
    }
    target.focus();
  }

  function stopTimer() {
    if (state.timerInterval !== null) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function startGame() {
    if (!DIFFICULTY_CONFIG[state.difficulty]) {
      showDifficultyScreen();
      return;
    }

    state.duration = DIFFICULTY_CONFIG[state.difficulty].duration;

    stopTimer();
    state.timeLeft = state.duration;
    state.score = 0;
    state.attempted = 0;
    state.correct = 0;
    state.wrong = 0;
    state.gameOver = false;
    state.submitting = false;

    els.difficultyScreen.classList.add('hidden');
    els.resultScreen.classList.add('hidden');
    els.gameScreen.classList.remove('hidden');
    els.answerInput.disabled = false;
    els.submitBtn.disabled = false;

    setFeedback('', '');
    newQuestion();
    updateStats();
    renderTimer();

    state.timerInterval = setInterval(tick, 1000);
    els.answerInput.focus();
  }

  function tick() {
    state.timeLeft -= 1;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      renderTimer();
      endGame();
      return;
    }
    renderTimer();
  }

  function renderTimer() {
    var seconds = Math.max(state.timeLeft, 0);
    var percent = (seconds / state.duration) * 100;
    var low = seconds <= 10;

    els.timerText.textContent = seconds + 's';
    els.timerBar.style.width = percent + '%';
    els.timerText.classList.toggle('text-red-400', low);
    els.timerText.classList.toggle('text-amber-600', !low);
    els.timerBar.classList.toggle('bg-red-500', low);
    els.timerBar.classList.toggle('bg-amber-400', !low);
  }

  function newQuestion() {
    var q = generateQuestion();
    state.currentAnswer = q.answer;
    state.submitting = false;

    els.question.textContent = q.text;
    els.answerInput.value = '';
    els.answerInput.focus();
  }

  function updateStats() {
    els.statScore.textContent = state.score;
    els.statAttempted.textContent = state.attempted;
    els.statCorrect.textContent = state.correct;
    els.statWrong.textContent = state.wrong;
  }

  function setFeedback(msg, type) {
    els.feedback.textContent = msg;
    els.feedback.classList.remove('text-emerald-400', 'text-red-400', 'text-amber-600', 'text-slate-400');
    if (type === 'correct') {
      els.feedback.classList.add('text-emerald-400');
    } else if (type === 'wrong') {
      els.feedback.classList.add('text-red-400');
    } else if (type === 'info') {
      els.feedback.classList.add('text-amber-600');
    } else {
      els.feedback.classList.add('text-slate-400');
    }
  }

  function parseAnswer(value) {
    var trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    if (!/^\d+$/.test(trimmed)) {
      return undefined;
    }
    return parseInt(trimmed, 10);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (state.gameOver || state.submitting) {
      return;
    }

    var value = els.answerInput.value;

    if (value.trim() === '') {
      setFeedback('Type your answer first, then press Enter.', 'info');
      els.answerInput.focus();
      return;
    }

    var parsed = parseAnswer(value);
    if (parsed === undefined) {
      setFeedback('Please enter a whole number only.', 'info');
      els.answerInput.select();
      return;
    }

    state.submitting = true;
    state.attempted += 1;

    if (parsed === state.currentAnswer) {
      state.score += 10;
      state.correct += 1;
      setFeedback('Correct!', 'correct');
    } else {
      state.wrong += 1;
      setFeedback('Wrong! The answer was ' + state.currentAnswer + '.', 'wrong');
    }

    updateStats();
    newQuestion();
  }

  function endGame() {
    stopTimer();
    state.gameOver = true;
    state.submitting = false;

    els.answerInput.disabled = true;
    els.submitBtn.disabled = true;
    els.gameScreen.classList.add('hidden');
    els.resultScreen.classList.remove('hidden');

    var accuracy = state.attempted > 0 ? Math.round((state.correct / state.attempted) * 100) : 0;

    els.finalScore.textContent = state.score;
    els.finalCorrect.textContent = state.correct;
    els.finalWrong.textContent = state.wrong;
    els.finalAttempted.textContent = state.attempted;
    els.finalAccuracy.textContent = accuracy + '%';
    els.finalDifficulty.textContent = 'Difficulty: ' + (DIFFICULTY_LABELS[state.difficulty] || DIFFICULTY_LABELS.normal);

    els.playAgainBtn.focus();
  }

  document.addEventListener('DOMContentLoaded', init);
})();