import { generateQuestion, TOPIC_LABELS } from './questions.js';

export const CONFIG = {
  sprintDurationSec: 60,
  survivalLives: 3,
  questionTimeSec: { easy: 14, medium: 11, hard: 8 },
  survivalDecayPerAnswer: 0.25,
  minSurvivalTimeSec: 3.5,
  basePoints: 100,
  maxSpeedBonus: 50,
  streakThresholds: [
    { min: 10, mult: 5 },
    { min: 6, mult: 3 },
    { min: 3, mult: 2 },
    { min: 0, mult: 1 }
  ],
  gradeCutoffs: { S: 2200, A: 1400, B: 700 }
};

/** Computes arithmetic mean, median, and sample/population standard deviation. */
function computeTimeStats(times) {
  if (!times.length) return { mean: 0, median: 0, sd: 0 };
  const sorted = [...times].sort((a, b) => a - b);
  const mean = times.reduce((sum, t) => sum + t, 0) / times.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length;
  return { mean, median, sd: Math.sqrt(variance) };
}

/** Creates a pure game state controller with zero DOM dependencies. */
export function createGame(settings) {
  const state = {
    ...settings,
    score: 0,
    streak: 0,
    lives: CONFIG.survivalLives,
    currentQuestion: null,
    questionStartMs: 0,
    gameStartMs: 0,
    pausedTotalMs: 0,
    pauseStartedMs: 0,
    isPaused: false,
    isOver: false,
    responseTimes: [],
    topicStats: {},
    answered: 0,
    correct: 0
  };

  /** Returns the active streak multiplier based on current consecutive hits. */
  function getMultiplier() {
    return CONFIG.streakThresholds.find((tier) => state.streak >= tier.min).mult;
  }

  /** Returns the time budget in seconds for the current question. */
  function getQuestionLimitSec() {
    const base = CONFIG.questionTimeSec[state.difficulty] || 11;
    if (state.mode === 'sprint') return base;
    return Math.max(CONFIG.minSurvivalTimeSec, base - state.correct * CONFIG.survivalDecayPerAnswer);
  }

  /** Starts the game session and deals the first question. */
  function start(nowMs) {
    state.gameStartMs = nowMs;
    return nextQuestion(nowMs);
  }

  /** Generates and activates the next math problem. */
  function nextQuestion(nowMs) {
    state.currentQuestion = generateQuestion(state.topics, state.difficulty);
    state.questionStartMs = nowMs;
    return state.currentQuestion;
  }

  /** Evaluates a user's selected answer and updates score, streak, lives, and stats. */
  function submitAnswer(choice, nowMs) {
    if (state.isOver || state.isPaused) return null;
    const elapsedSec = Math.max(0.05, (nowMs - state.questionStartMs) / 1000);
    const limitSec = getQuestionLimitSec();
    const isCorrect = choice === state.currentQuestion.answer;
    const topic = state.currentQuestion.topic;

    state.answered += 1;
    state.responseTimes.push(elapsedSec);
    if (!state.topicStats[topic]) state.topicStats[topic] = { correct: 0, total: 0 };
    state.topicStats[topic].total += 1;

    let pointsEarned = 0;
    if (isCorrect) {
      state.correct += 1;
      state.streak += 1;
      state.topicStats[topic].correct += 1;
      const speedRatio = Math.max(0, 1 - elapsedSec / limitSec);
      const speedBonus = Math.round(CONFIG.maxSpeedBonus * speedRatio);
      pointsEarned = (CONFIG.basePoints + speedBonus) * getMultiplier();
      state.score += pointsEarned;
    } else {
      state.streak = 0;
      if (state.mode === 'survival') {
        state.lives -= 1;
        if (state.lives <= 0) state.isOver = true;
      }
    }

    return {
      isCorrect,
      correctAnswer: state.currentQuestion.answer,
      pointsEarned,
      streak: state.streak,
      multiplier: getMultiplier(),
      isMilestone: isCorrect && [3, 6, 10, 15].includes(state.streak),
      isOver: state.isOver
    };
  }

  /** Advances timers and returns normalized progress (1 -> 0) plus timeout/end flags. */
  function tick(nowMs) {
    if (state.isOver || state.isPaused) return { ratio: 1, timedOut: false, isOver: state.isOver };
    if (state.mode === 'sprint') {
      const elapsedSec = (nowMs - state.gameStartMs - state.pausedTotalMs) / 1000;
      const remaining = Math.max(0, CONFIG.sprintDurationSec - elapsedSec);
      if (remaining === 0) state.isOver = true;
      return { ratio: remaining / CONFIG.sprintDurationSec, timedOut: false, isOver: state.isOver };
    }
    const qElapsedSec = (nowMs - state.questionStartMs) / 1000;
    const limitSec = getQuestionLimitSec();
    const remaining = Math.max(0, limitSec - qElapsedSec);
    if (remaining === 0) {
      const res = submitAnswer(null, nowMs);
      return { ratio: 0, timedOut: true, isOver: res.isOver, correctAnswer: res.correctAnswer };
    }
    return { ratio: remaining / limitSec, timedOut: false, isOver: false };
  }

  /** Toggles pause state while preserving accurate elapsed timestamps. */
  function togglePause(nowMs) {
    if (state.isOver) return false;
    state.isPaused = !state.isPaused;
    if (state.isPaused) {
      state.pauseStartedMs = nowMs;
    } else {
      const delta = nowMs - state.pauseStartedMs;
      state.pausedTotalMs += delta;
      state.questionStartMs += delta;
    }
    return state.isPaused;
  }

  /** Computes the final post-game summary and descriptive statistics. */
  function getResults() {
    const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
    const timeStats = computeTimeStats(state.responseTimes);
    const { S, A, B } = CONFIG.gradeCutoffs;
    const grade = state.score >= S ? 'S' : state.score >= A ? 'A' : state.score >= B ? 'B' : 'C';
    const breakdown = Object.entries(state.topicStats).map(([key, val]) => ({
      topic: TOPIC_LABELS[key] || key,
      pct: Math.round((val.correct / val.total) * 100),
      ratio: `${val.correct}/${val.total}`
    }));
    return { score: state.score, accuracy, grade, breakdown, ...timeStats };
  }

  return { state, start, nextQuestion, submitAnswer, tick, togglePause, getResults, getMultiplier };
}