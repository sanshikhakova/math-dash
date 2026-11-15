let audioCtx = null;

/** Initializes or resumes the shared Web Audio context after a user gesture. */
export function initAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Plays a synthesized sound effect by semantic cue name. */
export function playTone(type, enabled = true) {
  if (!enabled) return;
  const ctx = initAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const presets = {
    click: [{ freq: 520, dur: 0.05, wave: 'sine', delay: 0 }],
    correct: [
      { freq: 523.25, dur: 0.08, wave: 'triangle', delay: 0 },
      { freq: 659.25, dur: 0.12, wave: 'triangle', delay: 0.06 }
    ],
    streak: [
      { freq: 523.25, dur: 0.07, wave: 'triangle', delay: 0 },
      { freq: 659.25, dur: 0.07, wave: 'triangle', delay: 0.05 },
      { freq: 783.99, dur: 0.14, wave: 'triangle', delay: 0.1 }
    ],
    wrong: [
      { freq: 210, dur: 0.11, wave: 'sawtooth', delay: 0 },
      { freq: 165, dur: 0.16, wave: 'sawtooth', delay: 0.08 }
    ],
    gameover: [
      { freq: 440, dur: 0.12, wave: 'sine', delay: 0 },
      { freq: 349.23, dur: 0.18, wave: 'sine', delay: 0.1 }
    ]
  };

  const notes = presets[type] || presets.click;
  notes.forEach(({ freq, dur, wave, delay }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now + delay);
    gain.gain.setValueAtTime(0.08, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + dur);
  });
}