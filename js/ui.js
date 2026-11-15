const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Switches visible screen using View Transitions API with a clean CSS fallback. */
export function showScreen(screenId) {
  const apply = () => {
    document.querySelectorAll('.screen').forEach((el) => {
      const active = el.id === screenId;
      el.hidden = !active;
      el.classList.toggle('is-active', active);
    });
  };
  if (document.startViewTransition && !reducedMotion()) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

/** Syncs home screen chips, segmented buttons, theme, sound icon, and personal best. */
export function renderHome(settings, bestScore) {
  document.documentElement.dataset.theme = settings.theme;
  document.getElementById('theme-icon').textContent = settings.theme === 'dark' ? '☀️' : '🌙';
  document.getElementById('sound-icon').textContent = settings.sound ? '🔊' : '🔇';
  document.getElementById('btn-sound').setAttribute('aria-pressed', String(settings.sound));

  document.querySelectorAll('#topic-chips .chip').forEach((btn) => {
    const on = settings.topics.includes(btn.dataset.topic);
    btn.classList.toggle('is-selected', on);
    btn.setAttribute('aria-pressed', String(on));
  });
  document.querySelectorAll('#difficulty-group .seg-btn').forEach((btn) => {
    const on = btn.dataset.difficulty === settings.difficulty;
    btn.classList.toggle('is-selected', on);
    btn.setAttribute('aria-checked', String(on));
  });
  document.querySelectorAll('#mode-group .seg-btn').forEach((btn) => {
    const on = btn.dataset.mode === settings.mode;
    btn.classList.toggle('is-selected', on);
    btn.setAttribute('aria-checked', String(on));
  });

  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  document.getElementById('pb-context').textContent = `${cap(settings.mode)} · ${cap(settings.difficulty)}`;
  document.getElementById('pb-value').textContent = bestScore.toLocaleString();

  const valid = settings.topics.length > 0;
  document.getElementById('btn-start').disabled = !valid;
  document.getElementById('topic-hint').classList.toggle('is-visible', !valid);
}

/** Renders the active question card, badges, and 4 answer buttons. */
export function renderQuestion(question, difficulty) {
  const card = document.getElementById('question-card');
  card.classList.remove('pulse-correct', 'shake-wrong');
  document.getElementById('q-topic').textContent = question.topicLabel;
  document.getElementById('q-diff').textContent = difficulty[0].toUpperCase() + difficulty.slice(1);
  document.getElementById('q-prompt').textContent = question.prompt;

  document.querySelectorAll('#options-grid .option-btn').forEach((btn, idx) => {
    btn.disabled = false;
    btn.classList.remove('is-correct', 'is-wrong');
    btn.querySelector('.option-text').textContent = question.options[idx];
  });
}

/** Updates score, streak flame scale, multiplier badge, and Survival lives in the HUD. */
export function updateHud({ score, streak, multiplier, mode, lives }) {
  document.getElementById('hud-score').textContent = score.toLocaleString();
  document.getElementById('hud-streak').textContent = streak;
  document.getElementById('hud-mult').textContent = `${multiplier}x`;
  document.getElementById('hud-flame').style.transform = `scale(${Math.min(1.65, 1 + streak * 0.06)})`;

  const livesWrap = document.getElementById('hud-lives-wrap');
  livesWrap.hidden = mode !== 'survival';
  if (mode === 'survival') {
    const safeLives = Math.max(0, lives);
    document.getElementById('hud-lives').textContent = '♥'.repeat(safeLives) + '♡'.repeat(3 - safeLives);
  }
}

/** Updates the countdown bar width and green -> amber -> red color shifts. */
export function updateTimerBar(ratio) {
  const fill = document.getElementById('timer-fill');
  fill.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio))})`;
  fill.classList.toggle('is-amber', ratio <= 0.5 && ratio > 0.22);
  fill.classList.toggle('is-red', ratio <= 0.22);
  fill.parentElement.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
}

/** Highlights right/wrong options, spawns a floating +points particle, and announces via ARIA. */
export function showAnswerFeedback({ isCorrect, correctAnswer, pointsEarned, selectedIdx }) {
  const card = document.getElementById('question-card');
  card.classList.add(isCorrect ? 'pulse-correct' : 'shake-wrong');

  document.querySelectorAll('#options-grid .option-btn').forEach((btn, idx) => {
    btn.disabled = true;
    const text = btn.querySelector('.option-text').textContent;
    if (text === correctAnswer) btn.classList.add('is-correct');
    else if (idx === selectedIdx && !isCorrect) btn.classList.add('is-wrong');
  });

  if (isCorrect && pointsEarned > 0) {
    const p = document.createElement('span');
    p.className = 'score-particle';
    p.textContent = `+${pointsEarned}`;
    document.getElementById('particle-layer').appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
  document.getElementById('sr-announcer').textContent = isCorrect
    ? `Correct! Plus ${pointsEarned} points.`
    : `Incorrect. The correct answer is ${correctAnswer}.`;
}

/** Draws a celebratory confetti burst on the overlay canvas for streak milestones. */
export function triggerConfetti() {
  if (reducedMotion()) return;
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#22d3ee', '#8b5cf6', '#f472b6', '#a3e635', '#fbbf24'];
  const pieces = Array.from({ length: 42 }, () => ({
    x: canvas.width / 2, y: canvas.height * 0.35,
    vx: (Math.random() - 0.5) * 11, vy: Math.random() * -8 - 2,
    size: Math.random() * 6 + 4, color: colors[Math.floor(Math.random() * colors.length)]
  }));
  let frame = 0;
  const step = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.35;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    if (++frame < 45) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  requestAnimationFrame(step);
}

/** Populates the results screen with animated score count-up, stats, and topic bars. */
export function renderResults(results, isNewBest) {
  document.getElementById('grade-badge').textContent = results.grade;
  document.getElementById('new-pb-banner').hidden = !isNewBest;
  document.getElementById('stat-accuracy').textContent = `${results.accuracy}%`;
  document.getElementById('stat-mean').textContent = `${results.mean.toFixed(2)}s`;
  document.getElementById('stat-median').textContent = `${results.median.toFixed(2)}s`;
  document.getElementById('stat-sd').textContent = `${results.sd.toFixed(2)}s`;
  document.getElementById('share-feedback').textContent = '';

  const bars = document.getElementById('topic-bars');
  bars.innerHTML = results.breakdown.map((b) => `
    <div class="bar-row">
      <span>${b.topic}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${b.pct}%"></div></div>
      <span class="mono">${b.pct}%</span>
    </div>
  `).join('');

  const scoreEl = document.getElementById('res-score');
  let current = 0;
  const step = Math.max(1, Math.ceil(results.score / 28));
  const animateScore = () => {
    current = Math.min(results.score, current + step);
    scoreEl.textContent = current.toLocaleString();
    if (current < results.score) requestAnimationFrame(animateScore);
  };
  requestAnimationFrame(animateScore);
}