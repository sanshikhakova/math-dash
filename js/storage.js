const SETTINGS_KEY = 'mathdash_settings_v1';
const SCORES_KEY = 'mathdash_scores_v1';

const DEFAULT_SETTINGS = {
  topics: ['arithmetic', 'algebra', 'numberTheory', 'statistics', 'probability'],
  difficulty: 'easy',
  mode: 'sprint',
  sound: true,
  theme: 'dark'
};

/** Loads persisted user settings with safe fallback defaults. */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      topics: Array.isArray(parsed.topics) ? parsed.topics : DEFAULT_SETTINGS.topics,
      difficulty: parsed.difficulty || DEFAULT_SETTINGS.difficulty,
      mode: parsed.mode || DEFAULT_SETTINGS.mode,
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : true,
      theme: parsed.theme === 'light' ? 'light' : 'dark'
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Saves current user settings to localStorage safely. */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota or privacy-mode errors gracefully
  }
}

/** Retrieves the personal best score for a given mode and difficulty. */
export function getBestScore(mode, difficulty) {
  try {
    const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}');
    return Number(scores[`${mode}_${difficulty}`]) || 0;
  } catch {
    return 0;
  }
}

/** Updates the personal best if the new score is higher and returns true if beaten. */
export function updateBestScore(mode, difficulty, score) {
  try {
    const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || '{}');
    const key = `${mode}_${difficulty}`;
    const prev = Number(scores[key]) || 0;
    if (score > prev) {
      scores[key] = score;
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}