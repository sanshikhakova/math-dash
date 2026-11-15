# Math Dash — Speed Mathematics & Statistics Arena

Live Link: https://sanshikhakova.github.io/math-dash/


Math Dash is a responsive, zero-dependency browser quiz game that challenges players to solve exact mathematical problems across **Arithmetic, Algebra, Number Theory, Statistics, and Probability** under timed pressure. Built with vanilla HTML5, CSS3, and modular ES6+ JavaScript, it pairs tactile arcade feedback with a post-game statistical telemetry dashboard that computes response-time mean, median, and standard deviation in real time.

---

## Features

- **5 Mathematical Domains:** Multi-select topic engine covering Arithmetic (`+ − × ÷`), Linear Algebra (`ax + b = c`), Number Theory (`GCD`, `LCM`, `mod`), Descriptive Statistics (`mean`, `median`, `range`), and Probability (reduced fractions).
- **2 Distinct Game Modes & 3 Difficulties:**
  - **Sprint Mode:** 60-second time attack to maximize total points.
  - **Survival Mode:** 3 lives with a shrinking per-question countdown timer as streaks climb.
- **Post-Game Statistical Telemetry:** Calculates accuracy percentage, mean response time, median response time, population standard deviation ($\sigma$), and per-topic accuracy bars without external charting libraries.
- **Full Keyboard & Touch Accessibility:** Playable via mouse/touch or keys `1–4` (`Enter` to start, `Esc` to pause), complete with ARIA live announcements, high-contrast dark/light themes, and `prefers-reduced-motion` support.
- **Synthesized Web Audio & Particle FX:** Dynamic Web Audio API sound cues and a custom HTML5 `<canvas>` confetti burst on streak milestones—with zero external media assets.

---

## Tech Stack

- **Markup:** Semantic HTML5
- **Styling:** Modern CSS3 (Custom Properties, Grid/Flexbox, Glassmorphism, View Transitions API)
- **Logic:** Vanilla ES6+ JavaScript Modules (`const`/`let`, pure functions, Web Audio API, Canvas 2D, `localStorage`)

---

## How It Works

### Modular Architecture
The codebase is split into six focused ES modules with strict separation of concerns:
- `js/questions.js` — Stateless problem generators producing exact solutions alongside deterministic distractors.
- `js/game.js` — Pure game-loop state machine and statistical engine with **zero DOM dependencies**.
- `js/ui.js` — DOM rendering, CSS-driven timer bar scaling, View Transitions, and `<canvas>` confetti physics.
- `js/storage.js` — Safe `localStorage` persistence wrapper for user settings and personal best records.
- `js/audio.js` — Real-time oscillator synthesis via the Web Audio API.
- `js/main.js` — Thin entry point wiring UI events to the game engine.

### Question & Distractor Generation
Rather than populating multiple-choice buttons with random noise, every generator constructs **plausible mathematical distractors** based on common student errors—such as sign inversions in linear equations (`-x`), swapping `GCD` and `LCM`, confusing `mean` with `range`, or selecting the complement probability `(q - p)/q`.

---

## Key Engineering Decisions

- **Strict Separation of Logic and Rendering:** Keeping `game.js` completely free of DOM APIs makes the scoring rules, timer math, and statistical calculations deterministic and easy to unit-test.
- **Drift-Free High-Resolution Timers:** Elapsed time is computed against `performance.now()` timestamps (accounting for cumulative pause durations) rather than incrementing `setInterval` counters, preventing frame-rate timer drift.
- **GPU-Composited Animations:** Timer bars and screen entrances animate exclusively via `transform` and `opacity` to maintain smooth 60fps performance on mobile devices.
- **Graceful Storage & Audio Degradation:** All `localStorage` calls are wrapped in `try/catch` blocks for private-browsing safety, and `AudioContext` initialization is deferred until the user's first click gesture to comply with browser autoplay policies.

---

## What I Learned

- **Translating Statistical Formulas into Clean Code:** Implementing median sorting and standard deviation calculations directly in JavaScript reinforced how theoretical statistics translates into real-time user analytics.
- **Algorithmic Distractor Design:** Ensuring every generated equation has a unique, exact answer while guaranteeing zero duplicate choices required careful edge-case handling (such as integer-only division and Euclidean fraction reduction).
- **Accessible Interactive UI:** Combining keyboard shortcuts (`1–4`, `Esc`), ARIA live regions, and `prefers-reduced-motion` media queries showed how polish and accessibility strengthen one another.

---

## Running Locally

Because the project uses native ES modules (`type="module"`), serve the folder over HTTP rather than opening `index.html` via `file://`:

```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js
npx serve .