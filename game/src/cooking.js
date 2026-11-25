// cooking.js — chop, wok, plating, serving and trash: what E / click does at a station.
import {
  CHOP_TIME,
  COOK_TIME,
  BURN_TIME,
  CHOPPABLE,
  COOKABLE,
  RECIPE_BY_ID,
  TIP_MAX,
  COMBO_STEP,
  COMBO_MAX_MULT,
  recipeName,
} from "./config.js";
import { addPopup, addParticles, setMessage } from "./state.js";
import { ticketForPlate, plateIsReady } from "./orders.js";
import {
  playChop, playPickup, playPlace, playSizzle, playCoin,
  playServeJingle, playBuzz, playBurn, playError, playReady,
} from "./audio.js";

// One interaction at a station. Returns nothing; updates state, coins, popups.
export function interactAtStation(state, station) {
  if (!station) return;
  switch (station.kind) {
    case "crate": interactCrate(state, station); break;
    case "board": interactBoard(state); break;
    case "wok": interactWok(state, station); break;
    case "plate": interactPlate(state, station); break;
    case "serve": interactServe(state); break;
    case "trash": interactTrash(state); break;
  }
}

function interactCrate(state, station) {
  if (state.carry) { setMessage(state, "Hands full! Put it down first.", 2); playError(); return; }
  state.carry = { kind: "item", item: station.id };
  playPickup();
  addParticles(state, station.x + station.w / 2, station.y + 10, "#ffd94d", 6, 60, "dot");
}

function interactBoard(state) {
  // Take a finished chopped item off the board.
  if (state.board && state.board.progress >= CHOP_TIME) {
    if (state.carry) { setMessage(state, "Hands full!", 2); playError(); return; }
    state.carry = { kind: "item", item: state.board.result };
    state.board = null;
    playPickup();
    return;
  }
  // Place a choppable raw item on the board to start chopping.
  if (!state.board && state.carry && state.carry.kind === "item" && CHOPPABLE[state.carry.item]) {
    state.board = { item: state.carry.item, result: CHOPPABLE[state.carry.item], progress: 0 };
    state.carry = null;
    playPlace();
    return;
  }
  if (state.board) { setMessage(state, "Still chopping…", 1.5); return; }
  setMessage(state, "The board chops chicken, tomato and chili.", 2.5);
}

function interactWok(state, station) {
  const idx = station.id === "wok0" ? 0 : 1;
  const wok = state.woks[idx];
  // Take a cooked item out (before it burns).
  if (wok && wok.done && !wok.burned) {
    if (state.carry) { setMessage(state, "Hands full!", 2); playError(); return; }
    state.carry = { kind: "item", item: wok.result };
    state.woks[idx] = null;
    playPickup();
    return;
  }
  if (wok && wok.burned) { setMessage(state, "Burned! Toss it in the trash.", 2); playError(); return; }
  if (wok) { setMessage(state, "Still cooking…", 1.5); return; }
  // Put a cookable raw item into the wok.
  if (state.carry && state.carry.kind === "item" && COOKABLE[state.carry.item]) {
    state.woks[idx] = { item: state.carry.item, result: COOKABLE[state.carry.item], progress: 0, done: false, burned: false };
    state.carry = null;
    playSizzle();
    return;
  }
  setMessage(state, "The wok cooks egg, noodle and chicken.", 2.5);
}

function interactPlate(state, station) {
  const plate = state.plates[station.plateIndex];
  // Carrying a plate: set it down on an empty plate slot.
  if (state.carry && state.carry.kind === "plate") {
    if (plate.items.length === 0) {
      plate.items = state.carry.items;
      state.carry = null;
      playPlace();
    } else {
      setMessage(state, "That plate slot is busy.", 2);
      playError();
    }
    return;
  }
  // Carrying an item: stack it on the plate (max 3, no duplicates).
  if (state.carry && state.carry.kind === "item") {
    if (plate.items.length >= 3) { setMessage(state, "Plate is full (3 items).", 2); playError(); return; }
    if (plate.items.includes(state.carry.item)) { setMessage(state, "That is already on the plate.", 2); playError(); return; }
    plate.items.push(state.carry.item);
    state.carry = null;
    playPlace();
    if (plateIsReady(state, plate.items)) {
      playReady();
      addPopup(state, station.x + station.w / 2, station.y - 8, "READY!", "#7dff8a");
    }
    return;
  }
  // Empty hands: pick the plate up (only if it has food on it).
  if (plate.items.length > 0) {
    state.carry = { kind: "plate", plateIndex: station.plateIndex, items: [...plate.items] };
    plate.items = [];
    playPickup();
  } else {
    setMessage(state, "Empty plate — add ingredients first.", 2);
  }
}

function interactServe(state) {
  if (!state.carry || state.carry.kind !== "plate") {
    setMessage(state, "Bring a finished plate to the serving window.", 2.5);
    playError();
    return;
  }
  const ticket = ticketForPlate(state, state.carry.items);
  if (!ticket) {
    setMessage(state, "No ticket wants this dish — check the order board!", 2.5);
    playError();
    return;
  }
  serveTicket(state, ticket);
}

export function serveTicket(state, ticket) {
  const recipe = RECIPE_BY_ID[ticket.recipeId];
  const patienceFrac = Math.max(0, ticket.patience / ticket.patienceMax);
  const tip = Math.round(TIP_MAX * patienceFrac) * state.comboMult;
  const earned = recipe.price + tip;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  if (state.combo > 0 && state.combo % COMBO_STEP === 0 && state.comboMult < COMBO_MAX_MULT) {
    state.comboMult += 1;
    addPopup(state, 940, 420, "COMBO x" + state.comboMult + "!", "#ff9ff3");
  }
  state.tickets = state.tickets.filter((t) => t.id !== ticket.id);
  state.carry = null;
  playCoin();
  playServeJingle();
  addPopup(state, 940, 430, "+" + earned + " coins", "#ffd94d");
  addParticles(state, 940, 470, "#ffd94d", 26, 160, "dot");
  addParticles(state, 940, 470, "#7dff8a", 12, 120, "dot");
}

function interactTrash(state) {
  if (!state.carry) { setMessage(state, "Nothing to throw away.", 1.5); return; }
  if (state.carry.kind === "plate") {
    state.plates[state.carry.plateIndex].items = [];
  }
  state.carry = null;
  playPlace();
  setMessage(state, "Tossed it.", 1.2);
}

// Per-frame cooking progress: chopping, wok timers, burning, steam.
export function updateCooking(state, dt) {
  if (state.board && state.board.progress < CHOP_TIME) {
    state.board.progress += dt;
    state.chopSoundTimer -= dt;
    if (state.chopSoundTimer <= 0) {
      playChop();
      state.chopSoundTimer = 0.45;
      const bx = 705, by = 235;
      addParticles(state, bx, by, "#fff3d6", 5, 90, "dot");
    }
    if (state.board.progress >= CHOP_TIME) {
      state.board.progress = CHOP_TIME;
      playReady();
      addPopup(state, 705, 180, recipeName(state.board.result) + " ready!", "#7dff8a");
    }
  }

  state.woks.forEach((wok, i) => {
    if (!wok) return;
    wok.progress += dt;
    // Steam while cooking.
    if (Math.random() < dt * 6) {
      const wx = 897 + i * 130;
      state.particles.push({
        x: wx + (Math.random() - 0.5) * 40, y: 210,
        vx: (Math.random() - 0.5) * 12, vy: -46 - Math.random() * 20,
        life: 0.9, maxLife: 0.9, color: "rgba(255,255,255,0.55)",
        size: 5 + Math.random() * 5, kind: "steam",
      });
    }
    state.sizzle -= dt;
    if (state.sizzle <= 0 && wok.progress < BURN_TIME) { playSizzle(); state.sizzle = 1.6; }
    if (!wok.done && wok.progress >= COOK_TIME) {
      wok.done = true;
      playReady();
      addPopup(state, 897 + i * 130, 180, recipeName(wok.result) + " done!", "#7dff8a");
    }
    if (!wok.burned && wok.progress >= BURN_TIME) {
      wok.burned = true;
      state.burned += 1;
      playBurn();
      addPopup(state, 897 + i * 130, 180, "BURNED!", "#ff6b5e");
      addParticles(state, 897 + i * 130, 220, "#555555", 16, 80, "dot");
    }
  });
}

// Is the chef holding a burned wok item that must be trashed? (hint text)
export function wokBurnedWaiting(state) {
  return state.woks.some((w) => w && w.burned);
}
