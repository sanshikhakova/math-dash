import { loadSettings, saveSettings, getBestScore, updateBestScore } from './storage.js';
import { playTone } from './audio.js';
import { createGame } from './game.js';
import { showScreen, renderHome, renderQuestion, updateHud, updateTimerBar, showAnswerFeedback, triggerConfetti, renderResults } from './ui.js';

let settings = loadSettings();
let game = null;
let rafId = null;
let lockInput = false;
let lastResults = null;

/** Refreshes home screen controls and persisted best score. */
function syncHome() {
  saveSettings(settings);
  renderHome(settings, getBestScore(settings.mode, settings.difficulty));
}

/** Starts a new quiz session and launches the animation frame loop. */
function startSession() {
  if (!settings.topics.length) return;
  playTone('click', settings.sound);
  game = createGame(settings);
  lockInput = false;
  const q = game.start(performance.now());
  renderQuestion(q, settings.difficulty);
  updateHud({ ...game.state, multiplier: 1 });
  updateTimerBar(1);
  showScreen('screen-game');
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(gameLoop);
}

/** Ends the session, records any personal best, and renders post-game analytics. */
function finishSession() {
  cancelAnimationFrame(rafId);
  playTone('gameover', settings.sound);
  lastResults = game.getResults();
  const isNewBest = updateBestScore(settings.mode, settings.difficulty, lastResults.score);
  renderResults(lastResults, isNewBest);
  showScreen('screen-results');
}

/** Runs the per-frame countdown check without timer drift. */
function gameLoop(now) {
  if (!game || game.state.isOver) return;
  const status = game.tick(now);
  updateTimerBar(status.ratio);
  if (status.timedOut) {
    playTone('wrong', settings.sound);
    updateHud({ ...game.state, multiplier: game.getMultiplier() });
    showAnswerFeedback({ isCorrect: false, correctAnswer: status.correctAnswer, pointsEarned: 0, selectedIdx: -1 });
    lockInput = true;
    setTimeout(() => status.isOver ? finishSession() : advanceQuestion(), 650);
  } else if (status.isOver) {
    finishSession();
    return;
  }
  rafId = requestAnimationFrame(gameLoop);
}

/** Deals the next question after brief visual feedback. */
function advanceQuestion() {
  if (!game || game.state.isOver) return;
  lockInput = false;
  renderQuestion(game.nextQuestion(performance.now()), settings.difficulty);
}

/** Processes an option click or 1-4 keypress during active play. */
function handleChoice(idx) {
  if (!game || lockInput || game.state.isPaused || game.state.isOver) return;
  const btn = document.querySelectorAll('#options-grid .option-btn')[idx];
  if (!btn) return;
  lockInput = true;
  const res = game.submitAnswer(btn.querySelector('.option-text').textContent, performance.now());
  playTone(res.isMilestone ? 'streak' : res.isCorrect ? 'correct' : 'wrong', settings.sound);
  if (res.isMilestone) triggerConfetti();
  updateHud({ ...game.state, multiplier: res.multiplier });
  showAnswerFeedback({ ...res, selectedIdx: idx });
  setTimeout(() => (res.isOver ? finishSession() : advanceQuestion()), 550);
}

/** Binds all static UI and keyboard listeners once at startup. */
function bindEvents() {
  document.getElementById('topic-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const t = chip.dataset.topic;
    settings.topics = settings.topics.includes(t) ? settings.topics.filter((x) => x !== t) : [...settings.topics, t];
    playTone('click', settings.sound);
    syncHome();
  });
  document.getElementById('difficulty-group').addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (btn) { settings.difficulty = btn.dataset.difficulty; playTone('click', settings.sound); syncHome(); }
  });
  document.getElementById('mode-group').addEventListener('click', (e) => {
    const btn = e.target.closest('.seg-btn');
    if (btn) { settings.mode = btn.dataset.mode; playTone('click', settings.sound); syncHome(); }
  });
  document.getElementById('btn-theme').addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    syncHome();
  });
  document.getElementById('btn-sound').addEventListener('click', () => {
    settings.sound = !settings.sound;
    playTone('click', settings.sound);
    syncHome();
  });
  document.getElementById('btn-start').addEventListener('click', startSession);
  document.getElementById('btn-again').addEventListener('click', startSession);
  document.getElementById('btn-settings').addEventListener('click', () => { syncHome(); showScreen('screen-home'); });
  document.getElementById('options-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.option-btn');
    if (btn) handleChoice(Number(btn.dataset.index));
  });
  const togglePauseModal = () => {
    if (!game || game.state.isOver) return;
    document.getElementById('pause-modal').hidden = !game.togglePause(performance.now());
  };
  document.getElementById('btn-pause').addEventListener('click', togglePauseModal);
  document.getElementById('btn-resume').addEventListener('click', togglePauseModal);
  document.getElementById('btn-quit').addEventListener('click', () => {
    cancelAnimationFrame(rafId);
    document.getElementById('pause-modal').hidden = true;
    syncHome();
    showScreen('screen-home');
  });
  document.getElementById('btn-share').addEventListener('click', async () => {
    if (!lastResults) return;
    const text = `Math Dash (${settings.mode}/${settings.difficulty}): ${lastResults.score} pts | Grade ${lastResults.grade} | ${lastResults.accuracy}% accuracy | Mean ${lastResults.mean.toFixed(2)}s`;
    try { await navigator.clipboard.writeText(text); document.getElementById('share-feedback').textContent = 'Summary copied to clipboard!'; }
    catch { document.getElementById('share-feedback').textContent = text; }
  });
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('screen-home').hidden && e.key === 'Enter') startSession();
    if (!document.getElementById('screen-game').hidden) {
      if (['1', '2', '3', '4'].includes(e.key)) handleChoice(Number(e.key) - 1);
      if (e.key === 'Escape') togglePauseModal();
    }
  });
}

syncHome();
bindEvents();