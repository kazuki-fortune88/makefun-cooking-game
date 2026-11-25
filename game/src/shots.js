// shots.js — deterministic staging for screenshots. ?shot=cover|chop|rush|serve
// sets up a mid-service scene with a fixed seed and no interaction needed,
// so every screenshot shows the kitchen, order board, food, timer and a plate.
import {
  RECIPES, SHIFT_SECONDS, PATIENCE_SECONDS, RUSH_PATIENCE_SECONDS,
} from "./config.js";
import { spawnTicket } from "./orders.js";

function placeTicket(state, recipeId, patienceFrac, patienceMax) {
  const t = spawnTicket(state, recipeId);
  if (!t) return;
  t.patienceMax = patienceMax || PATIENCE_SECONDS;
  t.patience = t.patienceMax * patienceFrac;
}

function setPlate(state, slot, items) {
  state.plates[slot].items = [...items];
}

export function applyShot(state, shotName, seed) {
  state.screen = "play";
  state.paused = false;
  state.seed = seed || 7;
  state.rngState = state.seed;
  state.tickets = [];
  state.plates.forEach((p) => { p.items = []; });
  state.board = null;
  state.woks = [null, null];
  state.carry = null;
  state.popups = [];
  state.particles = [];
  state.message = "";
  state.messageTimer = 0;
  state.flashRed = 0;

  if (shotName === "cover") {
    // Hero mid-service: 3 tickets, chef at the wok frying an egg,
    // a plate mid-assembly (rice + egg), one READY plate at the window side.
    state.elapsed = 46;
    state.timeLeft = 134; // 2:14 on the clock
    state.coins = 58;
    state.served = 4;
    state.combo = 2;
    state.comboMult = 1;
    placeTicket(state, "sunny-rice", 0.72);
    placeTicket(state, "chicken-noodle", 0.55);
    placeTicket(state, "golden-noodle", 0.38);
    setPlate(state, 0, ["rice", "friedEgg"]); // mid-assembly, matches Sunny Rice Bowl
    setPlate(state, 1, ["cookedNoodle", "friedEgg", "choppedChili"]); // READY Golden Noodle
    state.woks[0] = { item: "egg", result: "friedEgg", progress: 2.6, done: false, burned: false };
    state.player.x = 897; state.player.y = 338; state.player.dirX = 0; state.player.dirY = -1;
    state.carry = { kind: "item", item: "choppedChili" };
    addSteam(state, 897, 205);
  } else if (shotName === "chop") {
    // Chef chopping chili on the board, progress ring half done.
    state.elapsed = 28;
    state.timeLeft = 152;
    state.coins = 24;
    state.served = 2;
    placeTicket(state, "ember-rice", 0.8);
    placeTicket(state, "tomato-omelette", 0.6);
    setPlate(state, 0, ["rice"]);
    state.board = { item: "chili", result: "choppedChili", progress: 0.8 };
    state.player.x = 705; state.player.y = 338; state.player.dirX = 0; state.player.dirY = -1;
    state.carry = { kind: "item", item: "tomato" };
    for (let i = 0; i < 10; i++) {
      state.particles.push({
        x: 705 + (Math.random() - 0.5) * 50, y: 235 + (Math.random() - 0.5) * 20,
        vx: 0, vy: -20, life: 0.7, maxLife: 0.7, color: "#fff3d6", size: 3, kind: "dot",
      });
    }
  } else if (shotName === "rush") {
    // Rush hour: 5 tickets, wok + board both busy, steam, red patience bars.
    state.elapsed = 75;
    state.timeLeft = 105;
    state.coins = 84;
    state.served = 6;
    state.combo = 5;
    state.comboMult = 2;
    state.rush = true;
    state.rushBanner = 99; // banner stays up for the shot
    placeTicket(state, "chicken-noodle", 0.3, RUSH_PATIENCE_SECONDS);
    placeTicket(state, "chili-chicken-rice", 0.42, RUSH_PATIENCE_SECONDS);
    placeTicket(state, "golden-noodle", 0.25, RUSH_PATIENCE_SECONDS);
    placeTicket(state, "ember-rice", 0.55, RUSH_PATIENCE_SECONDS);
    placeTicket(state, "tomato-omelette", 0.18, RUSH_PATIENCE_SECONDS);
    setPlate(state, 0, ["rice", "grilledChicken"]);
    setPlate(state, 1, ["cookedNoodle"]);
    state.board = { item: "chicken", result: "choppedChicken", progress: 1.1 };
    state.woks[0] = { item: "noodle", result: "cookedNoodle", progress: 3.4, done: false, burned: false };
    state.woks[1] = { item: "chicken", result: "grilledChicken", progress: 1.2, done: false, burned: false };
    state.player.x = 640; state.player.y = 420; state.player.dirX = 1; state.player.dirY = 0;
    addSteam(state, 897, 205);
    addSteam(state, 1027, 205);
  } else if (shotName === "serve") {
    // The serve moment: a READY plate carried to the window, +coins popup.
    state.elapsed = 58;
    state.timeLeft = 122;
    state.coins = 73;
    state.served = 5;
    state.combo = 3;
    state.comboMult = 2;
    placeTicket(state, "sunny-rice", 0.65);
    placeTicket(state, "golden-noodle", 0.5);
    placeTicket(state, "chili-chicken-rice", 0.8);
    setPlate(state, 0, ["rice", "friedEgg"]);
    setPlate(state, 1, ["cookedNoodle", "friedEgg"]); // another dish mid-assembly
    state.carry = { kind: "plate", plateIndex: 0, items: ["rice", "friedEgg"] };
    state.plates[0].items = [];
    state.player.x = 790; state.player.y = 615; state.player.dirX = 1; state.player.dirY = 0;
    state.popups.push({ x: 940, y: 420, text: "+20 coins", color: "#ffd94d", life: 1.2, maxLife: 1.4 });
    state.popups.push({ x: 940, y: 380, text: "COMBO x2!", color: "#ff9ff3", life: 1.2, maxLife: 1.4 });
    for (let i = 0; i < 20; i++) {
      state.particles.push({
        x: 940 + (Math.random() - 0.5) * 90, y: 470 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 60,
        life: 0.9, maxLife: 0.9, color: i % 3 ? "#ffd94d" : "#7dff8a", size: 3 + Math.random() * 3, kind: "dot",
      });
    }
  } else {
    // Unknown shot: plain mid-service fallback.
    state.elapsed = 30;
    state.timeLeft = 150;
    state.coins = 30;
    placeTicket(state, "sunny-rice", 0.7);
    setPlate(state, 0, ["rice", "friedEgg"]);
  }
  state.nextTicketIn = 999; // staging must not spawn extra tickets during the shot
}

function addSteam(state, x, y) {
  for (let i = 0; i < 8; i++) {
    state.particles.push({
      x: x + (Math.random() - 0.5) * 40, y: y - i * 8,
      vx: (Math.random() - 0.5) * 10, vy: -30 - Math.random() * 20,
      life: 0.9, maxLife: 0.9, color: "rgba(255,255,255,0.55)", size: 5 + Math.random() * 4, kind: "steam",
    });
  }
}

export function shotFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return {
    shot: params.get("shot"),
    seed: parseInt(params.get("seed") || "7", 10),
  };
}
