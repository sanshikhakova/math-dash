export const TOPIC_LABELS = {
  arithmetic: 'Arithmetic',
  algebra: 'Algebra',
  numberTheory: 'Number Theory',
  statistics: 'Statistics',
  probability: 'Probability'
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** Builds 4 unique shuffled answer choices from an exact answer and logical distractors. */
function buildOptions(answer, candidates, fallbackFn) {
  const unique = new Set([String(answer)]);
  candidates.forEach((c) => {
    if (String(c) !== String(answer)) unique.add(String(c));
  });
  let guard = 0;
  while (unique.size < 4 && guard < 25) {
    unique.add(String(fallbackFn(guard++)));
  }
  return [...unique].slice(0, 4).sort(() => Math.random() - 0.5);
}

/** Generates an exact integer arithmetic problem with realistic error distractors. */
function makeArithmetic(diff) {
  const max = diff === 'easy' ? 15 : diff === 'medium' ? 35 : 75;
  const op = ['+', '−', '×', '÷'][randInt(0, 3)];
  let a = randInt(3, max);
  let b = randInt(2, diff === 'easy' ? 10 : 16);
  let ans = 0;
  if (op === '+') ans = a + b;
  if (op === '−') { if (a < b) [a, b] = [b, a]; ans = a - b; }
  if (op === '×') { a = randInt(2, diff === 'easy' ? 12 : 19); ans = a * b; }
  if (op === '÷') { ans = randInt(2, 15); a = ans * b; }
  const options = buildOptions(ans, [ans + 1, ans - 1, ans + b, Math.abs(ans - 2)], (i) => ans + i + 2);
  return { topic: 'arithmetic', topicLabel: TOPIC_LABELS.arithmetic, prompt: `${a} ${op} ${b} = ?`, answer: String(ans), options };
}

/** Generates a linear equation ax + b = c with an exact integer solution x. */
function makeAlgebra(diff) {
  const a = randInt(2, diff === 'easy' ? 6 : diff === 'medium' ? 11 : 15);
  const x = randInt(diff === 'easy' ? 1 : -8, diff === 'hard' ? 15 : 10) || 3;
  const b = randInt(1, diff === 'easy' ? 15 : 30);
  const c = a * x + b;
  const options = buildOptions(x, [-x, x + 1, x - 1, Math.round((c + b) / a)], (i) => x + i + 2);
  return { topic: 'algebra', topicLabel: TOPIC_LABELS.algebra, prompt: `Solve for x: ${a}x + ${b} = ${c}`, answer: String(x), options };
}

/** Generates a GCD, LCM, or modular remainder question. */
function makeNumberTheory(diff) {
  const scale = diff === 'easy' ? 1 : diff === 'medium' ? 2 : 3;
  const mode = randInt(0, 2);
  if (mode === 0) {
    const factor = randInt(2, 6 * scale);
    const a = factor * randInt(2, 5);
    const b = factor * randInt(3, 7);
    const ans = gcd(a, b);
    const lcm = (a * b) / ans;
    return {
      topic: 'numberTheory', topicLabel: TOPIC_LABELS.numberTheory,
      prompt: `GCD(${a}, ${b}) = ?`, answer: String(ans),
      options: buildOptions(ans, [lcm, ans + 1, Math.max(1, ans - 1), factor], (i) => ans + i + 2)
    };
  }
  if (mode === 1) {
    const a = randInt(3, 6 * scale);
    const b = randInt(4, 7 * scale);
    const ans = (a * b) / gcd(a, b);
    return {
      topic: 'numberTheory', topicLabel: TOPIC_LABELS.numberTheory,
      prompt: `LCM(${a}, ${b}) = ?`, answer: String(ans),
      options: buildOptions(ans, [a * b, gcd(a, b), ans + a, Math.abs(ans - b)], (i) => ans + i + 1)
    };
  }
  const m = randInt(4, 9 + scale * 2);
  const n = randInt(15, 45 * scale);
  const ans = n % m;
  return {
    topic: 'numberTheory', topicLabel: TOPIC_LABELS.numberTheory,
    prompt: `${n} mod ${m} = ?`, answer: String(ans),
    options: buildOptions(ans, [Math.floor(n / m), (ans + 1) % m, m - ans, ans + 2], (i) => ans + i + 3)
  };
}

/** Generates a descriptive statistics question (mean, median, or range) over 5 numbers. */
function makeStatistics(diff) {
  const spread = diff === 'easy' ? 6 : diff === 'medium' ? 12 : 20;
  const mid = randInt(8, 25);
  const d1 = randInt(1, spread);
  const d2 = randInt(1, spread);
  const set = [mid - d2, mid - d1, mid, mid + d1, mid + d2].sort(() => Math.random() - 0.5);
  const metric = ['Mean', 'Median', 'Range'][randInt(0, 2)];
  const mean = mid;
  const median = mid;
  const range = d2 * 2;
  const ans = metric === 'Range' ? range : mid;
  return {
    topic: 'statistics', topicLabel: TOPIC_LABELS.statistics,
    prompt: `${metric} of [${set.join(', ')}]`, answer: String(ans),
    options: buildOptions(ans, [range, mid + 1, mid - 1, Math.min(...set)], (i) => ans + i + 2)
  };
}

/** Generates a probability question answered as an exact reduced fraction. */
function makeProbability(diff) {
  const red = randInt(2, diff === 'easy' ? 4 : 7);
  const blue = randInt(2, diff === 'easy' ? 5 : 8);
  const total = red + blue;
  const isCompound = diff === 'hard';
  const num = isCompound ? red * (red - 1) : red;
  const den = isCompound ? total * (total - 1) : total;
  const g = gcd(num, den);
  const ans = `${num / g}/${den / g}`;
  const comp = `${(den - num) / g}/${den / g}`;
  const prompt = isCompound
    ? `Bag: ${red}R, ${blue}B. P(2 Red without replacement)?`
    : `Bag: ${red} Red, ${blue} Blue. P(Red)?`;
  return {
    topic: 'probability', topicLabel: TOPIC_LABELS.probability, prompt, answer: ans,
    options: buildOptions(ans, [comp, `${red}/${blue}`, `${Math.max(1, red - 1)}/${total}`, `${red}/${total + 1}`], (i) => `${i + 1}/${total + i + 2}`)
  };
}

const GENERATORS = {
  arithmetic: makeArithmetic,
  algebra: makeAlgebra,
  numberTheory: makeNumberTheory,
  statistics: makeStatistics,
  probability: makeProbability
};

/** Generates a random question from the user's selected topics and difficulty. */
export function generateQuestion(topics, difficulty) {
  const pool = topics.length ? topics : Object.keys(GENERATORS);
  const chosen = pool[randInt(0, pool.length - 1)];
  return GENERATORS[chosen](difficulty);
}