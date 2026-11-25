// audio.js — all sound is synthesized with WebAudio. No audio files.
let ctx = null;
let musicTimer = null;
let muted = false;
let musicStep = 0;
let nextNoteTime = 0;

// Gentle pentatonic night-market loop (A minor pentatonic), one soft pluck per beat.
const MELODY = [220, 261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66, 261.63, 220, 196];
const BEAT = 0.42;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(m) {
  muted = m;
  if (ctx) {
    if (muted) stopMusic();
    else startMusic();
  }
}
export function isMuted() { return muted; }

function tone(freq, dur, type, vol, when, slideTo) {
  if (!ctx || muted) return;
  const t = when || ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq) {
  if (!ctx || muted) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq || 1800;
  const gain = ctx.createGain();
  gain.gain.value = vol || 0.2;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

export function playChop() { noiseBurst(0.09, 0.35, 900); tone(180, 0.07, "triangle", 0.12); }
export function playPickup() { tone(520, 0.08, "sine", 0.12, 0, 780); }
export function playPlace() { tone(330, 0.09, "triangle", 0.14, 0, 220); }
export function playSizzle() { noiseBurst(0.35, 0.07, 3200); }
export function playDing() { tone(880, 0.35, "sine", 0.16); tone(1318, 0.4, "sine", 0.1, ctx ? ctx.currentTime + 0.08 : 0); }
export function playCoin() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  tone(988, 0.1, "square", 0.07, t);
  tone(1319, 0.22, "square", 0.07, t + 0.09);
}
export function playServeJingle() {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.13, t + i * 0.09));
}
export function playBuzz() { tone(140, 0.4, "sawtooth", 0.14, 0, 90); }
export function playBurn() { noiseBurst(0.3, 0.25, 500); tone(110, 0.5, "sawtooth", 0.12, 0, 70); }
export function playError() { tone(220, 0.15, "square", 0.1, 0, 160); }
export function playReady() { tone(660, 0.12, "sine", 0.12); tone(990, 0.18, "sine", 0.1, ctx ? ctx.currentTime + 0.1 : 0); }

export function startMusic() {
  if (!ctx || muted || musicTimer) return;
  nextNoteTime = ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    if (!ctx || muted) return;
    while (nextNoteTime < ctx.currentTime + 0.25) {
      const note = MELODY[musicStep % MELODY.length];
      tone(note, BEAT * 0.9, "sine", 0.045, nextNoteTime);
      if (musicStep % 4 === 0) tone(note / 2, BEAT * 1.8, "triangle", 0.03, nextNoteTime);
      musicStep++;
      nextNoteTime += BEAT;
    }
  }, 120);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}
