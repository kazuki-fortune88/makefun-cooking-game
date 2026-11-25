// state.js — the whole shift state: score, combo, tickets, stations, particles.
import {
  SHIFT_SECONDS,
  PLAYER_SPEED,
} from "./config.js";

export function createPlayer() {
  return {
    x: 640, y: 560, // centre of the kitchen floor
    radius: 26,
    speed: PLAYER_SPEED,
    dirX: 0, dirY: 1, // facing down by default
    moving: false,
    walkPhase: 0,
    target: null, // {x, y, station} for click-to-move
  };
}

export function createShiftState() {
  return {
    screen: "title", // title | play | end
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    failed: 0,
    burned: 0,
    combo: 0, // clean serves in a row
    comboMult: 1, // tip multiplier 1..3
    stars: 0,
    paused: false,
    frozen: false, // screenshot staging: update() skips, render draws the scene
    muted: false,
    rush: false,
    rushBanner: 0, // seconds left showing the RUSH HOUR banner
    spawnTimer: 0,
    nextTicketIn: 4,
    tickets: [], // {id, recipeId, patience, patienceMax, born}
    plates: [
      { slot: 0, items: [] },
      { slot: 1, items: [] },
      { slot: 2, items: [] },
    ],
    board: null, // {item, progress} chopping in progress
    woks: [null, null], // each {item, progress, done, burned}
    carry: null, // {kind:'item', item} | {kind:'plate', plateIndex, items}
    player: createPlayer(),
    popups: [], // {x, y, text, color, life, maxLife}
    particles: [], // {x, y, vx, vy, life, maxLife, color, size, kind}
    floats: [], // rising steam / spark bursts
    message: "", // one-line hint under the HUD
    messageTimer: 0,
    sizzle: 0, // wok sizzle sound throttle
    chopSoundTimer: 0,
    flashRed: 0, // screen edge flash when a ticket expires
    seed: 7,
    rngState: 7,
  };
}

// Tiny deterministic PRNG (mulberry32) so ?shot= staging is repeatable.
export function seededRandom(state) {
  state.rngState = (state.rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(state.rngState ^ (state.rngState >>> 15), 1 | state.rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function resetShift(state) {
  const fresh = createShiftState();
  fresh.muted = state.muted;
  Object.assign(state, fresh);
  state.screen = "play";
}

export function addPopup(state, x, y, text, color) {
  state.popups.push({ x, y, text, color: color || "#ffd94d", life: 1.4, maxLife: 1.4 });
  if (state.popups.length > 12) state.popups.shift();
}

export function addParticles(state, x, y, color, count, speed, kind) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - speed * 0.35,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      color,
      size: 2 + Math.random() * 3.5,
      kind: kind || "dot",
    });
  }
  if (state.particles.length > 400) state.particles.splice(0, state.particles.length - 400);
}

export function setMessage(state, text, seconds) {
  state.message = text;
  state.messageTimer = seconds || 2.5;
}

export function updateParticles(state, dt) {
  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    if (p.kind === "steam") { p.vy -= 140 * dt; p.vx *= 0.98; }
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const p of state.popups) p.life -= dt;
  state.popups = state.popups.filter((p) => p.life > 0);
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.rushBanner > 0) state.rushBanner -= dt;
  if (state.flashRed > 0) state.flashRed -= dt;
}
