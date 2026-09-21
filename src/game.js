(function () {
  'use strict';

  var GAME_DURATION = 60;

  var state = {
    timerInterval: null,
    timeLeft: GAME_DURATION,
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
    var op = randInt(0, 3);
    var a, b, text, answer;

    switch (op) {
      case 0: // addition
        a = randInt(10, 99);
        b = randInt(10, 99);
        text = a + ' + ' + b + ' =';
        answer = a + b;
        break;
      case 1: // subtraction (result always positive)
        a = randInt(20, 99);
        b = randInt(2, 19);
        text = a + ' \u2212 ' + b + ' =';
        answer = a - b;
        break;
      case 2: // multiplication
        a = randInt(2, 12);
        b = randInt(2, 12);
        text = a + ' \u00d7 ' + b + ' =';
        answer = a * b;
        break;
      case 3: // division (always a whole number)
        b = randInt(2, 12);
        answer = randInt(1, 12);
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
    els.playAgainBtn = byId('playAgainBtn');

    els.answerForm.addEventListener('submit', handleSubmit);
    els.playAgainBtn.addEventListener('click', startGame);

    startGame();
  }

  function stopTimer() {
    if (state.timerInterval !== null) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function startGame() {
    stopTimer();
    state.timeLeft = GAME_DURATION;
    state.score = 0;
    state.attempted = 0;
    state.correct = 0;
    state.wrong = 0;
    state.gameOver = false;
    state.submitting = false;

    els.gameScreen.classList.remove('hidden');
    els.resultScreen.classList.add('hidden');
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
    var percent = (seconds / GAME_DURATION) * 100;
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

    els.playAgainBtn.focus();
  }

  document.addEventListener('DOMContentLoaded', init);
})();