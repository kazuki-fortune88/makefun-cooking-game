// main.js — boot, game loop and the title / play / end screen state machine.
import { CANVAS_W, CANVAS_H, SHIFT_SECONDS, STARS } from "./config.js";
import { createShiftState, resetShift, updateParticles } from "./state.js";
import { createInput, endFrameInput } from "./input.js";
import {
  ensureAudio, setMuted, startMusic, stopMusic,
  playDing, playError,
} from "./audio.js";
import { updateOrders, spawnTicket } from "./orders.js";
import { updatePlayer, currentStation } from "./player.js";
import { interactAtStation, updateCooking } from "./cooking.js";
import { renderGame } from "./render.js";
import { applyShot, shotFromQuery } from "./shots.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const state = createShiftState();
const input = createInput(canvas);

let lastTime = performance.now();
let highlightStation = null;

function startShift() {
  ensureAudio();
  startMusic();
  resetShift(state);
  spawnTicket(state);
  state.nextTicketIn = 14;
}

function endShift() {
  state.screen = "end";
  state.stars = 0;
  for (const s of STARS) {
    if (state.coins >= s.coins) { state.stars = s.stars; break; }
  }
  stopMusic();
}

function update(dt) {
  // Global keys work on every screen.
  if (input.mutePressed) {
    state.muted = !state.muted;
    setMuted(state.muted);
  }
  if (input.restartPressed && state.screen !== "title") {
    startShift();
    return;
  }

  if (state.screen === "title") {
    if (input.confirmPressed || input.clicked) startShift();
    return;
  }
  if (state.screen === "end") {
    if (input.confirmPressed || input.restartPressed) startShift();
    return;
  }

  // Playing.
  if (state.frozen) return; // screenshot staging: scene stays exactly as staged
  if (input.pausePressed) {
    state.paused = !state.paused;
    if (state.paused) stopMusic(); else startMusic();
  }
  if (state.paused) return;

  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  if (state.timeLeft <= 0) {
    endShift();
    return;
  }

  const move = updatePlayer(state, input, dt);
  if (move.arrivedAt) interactAtStation(state, move.arrivedAt);
  if (input.interactPressed) {
    const station = currentStation(state);
    if (station) interactAtStation(state, station);
    else playError();
  }
  highlightStation = currentStation(state);

  updateOrders(state, dt);
  updateCooking(state, dt);
  updateParticles(state, dt);
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  renderGame(ctx, state, highlightStation);
  endFrameInput(input);
  requestAnimationFrame(frame);
}

function boot() {
  const { shot, seed } = shotFromQuery();
  if (shot) {
    // Screenshot staging: hide the page hint so the canvas fills the window.
    const hint = document.getElementById("hint");
    if (hint) hint.style.display = "none";
    // Jump straight into a fixed mid-service scene.
    ensureAudio();
    applyShot(state, shot, seed);
    // Freeze the staged scene: update() returns early, render draws it as-is.
    state.screen = "play";
    state.frozen = true;
  }
  requestAnimationFrame(frame);
}

boot();

// Expose a tiny debug handle for playtesting (not part of the game UI).
window.__emberEgg = { state, startShift };
