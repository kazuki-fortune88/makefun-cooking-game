// orders.js — order tickets: spawning, patience, rush hour and matching plates.
import {
  RECIPES,
  MAX_TICKETS,
  SPAWN_INTERVAL,
  RUSH_SPAWN_INTERVAL,
  PATIENCE_SECONDS,
  RUSH_PATIENCE_SECONDS,
  RUSH_WINDOWS,
  plateMatchesRecipe,
} from "./config.js";
import { seededRandom, addPopup, setMessage } from "./state.js";
import { playDing, playBuzz } from "./audio.js";

let ticketSeq = 0;

export function isRushTime(elapsed) {
  return RUSH_WINDOWS.some((w) => elapsed >= w.start && elapsed < w.end);
}

function pickRecipe(state) {
  // Slightly favour cheap two-item dishes early, so the first minute teaches.
  const pool = state.elapsed < 45 ? RECIPES.filter((r) => r.needs.length === 2) : RECIPES;
  const idx = Math.floor(seededRandom(state) * pool.length);
  return pool[idx];
}

export function spawnTicket(state, forceRecipeId) {
  if (state.tickets.length >= MAX_TICKETS) return null;
  const recipe = forceRecipeId
    ? RECIPES.find((r) => r.id === forceRecipeId)
    : pickRecipe(state);
  const patienceMax = state.rush ? RUSH_PATIENCE_SECONDS : PATIENCE_SECONDS;
  const ticket = {
    id: ++ticketSeq,
    recipeId: recipe.id,
    name: recipe.name,
    needs: [...recipe.needs],
    price: recipe.price,
    patience: patienceMax,
    patienceMax,
    born: state.elapsed,
  };
  state.tickets.push(ticket);
  playDing();
  return ticket;
}

// Called every frame while playing: spawn schedule + patience drain.
export function updateOrders(state, dt) {
  const wasRush = state.rush;
  state.rush = isRushTime(state.elapsed);
  if (state.rush && !wasRush) {
    state.rushBanner = 3;
    setMessage(state, "RUSH HOUR! Orders arrive twice as fast!", 3);
  }

  state.nextTicketIn -= dt;
  if (state.nextTicketIn <= 0) {
    const spawned = spawnTicket(state);
    if (spawned && state.rush) spawnTicket(state); // rush spawns a second ticket
    state.nextTicketIn = state.rush ? RUSH_SPAWN_INTERVAL : SPAWN_INTERVAL;
    if (!spawned) state.nextTicketIn = 4; // board full: retry soon
  }

  for (const t of state.tickets) t.patience -= dt;
  const expired = state.tickets.filter((t) => t.patience <= 0);
  if (expired.length) {
    state.tickets = state.tickets.filter((t) => t.patience > 0);
    state.failed += expired.length;
    state.combo = 0;
    state.comboMult = 1;
    state.flashRed = 0.5;
    playBuzz();
    addPopup(state, 640, 200, "ORDER LOST! Combo reset", "#ff6b5e");
  }
}

// A plate matches a ticket when its items equal that recipe exactly.
export function ticketForPlate(state, plateItems) {
  return state.tickets.find((t) => {
    const recipe = RECIPES.find((r) => r.id === t.recipeId);
    return recipe && plateMatchesRecipe(plateItems, recipe);
  }) || null;
}

// Is this plate a complete dish for some live ticket? (drives the READY glow)
export function plateIsReady(state, plateItems) {
  return plateItems.length > 0 && ticketForPlate(state, plateItems) !== null;
}
