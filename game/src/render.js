// render.js — every pixel of Ember & Egg: night-market kitchen, food, HUD, particles.
import {
  CANVAS_W, CANVAS_H, RECIPES, RECIPE_BY_ID, CHOP_TIME, COOK_TIME, BURN_TIME,
  itemColor, itemDark, recipeName,
} from "./config.js";
import { STATIONS, CRATE_IDS, stationCenter } from "./kitchen.js";
import { plateIsReady } from "./orders.js";

const FONT = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align, weight) {
  ctx.font = (weight || 700) + " " + size + "px " + FONT;
  ctx.textAlign = align || "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function outlinedText(ctx, str, x, y, size, color, align, weight) {
  ctx.font = (weight || 800) + " " + size + "px " + FONT;
  ctx.textAlign = align || "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(3, size / 6);
  ctx.strokeStyle = "rgba(20,10,5,0.85)";
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ---- food drawing: each ingredient / dish drawn so it reads at a glance ----
export function drawFood(ctx, itemId, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  const c = itemColor(itemId);
  const d = itemDark(itemId);
  switch (itemId) {
    case "rice":
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.ellipse(0, 2, r, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#c9b896"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 2, r, r * 0.72, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = d;
      ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.2, r * 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.25, -r * 0.05, r * 0.12, 0, Math.PI * 2); ctx.fill();
      break;
    case "noodle":
      ctx.strokeStyle = c; ctx.lineWidth = r * 0.28; ctx.lineCap = "round";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.55 + i * 0.22), 0.3 + i * 0.7, 2.6 + i * 0.7);
        ctx.stroke();
      }
      ctx.strokeStyle = d; ctx.lineWidth = r * 0.1;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0.5, 2.4); ctx.stroke();
      break;
    case "egg":
      ctx.fillStyle = "#fff8e6";
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.95, r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f7c948";
      ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.42, 0, Math.PI * 2); ctx.fill();
      break;
    case "friedEgg":
      ctx.fillStyle = "#fff6da";
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.05, r * 0.85, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffbf2e";
      ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffd94d";
      ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.28, 0, Math.PI * 2); ctx.fill();
      break;
    case "chicken":
    case "grilledChicken":
    case "choppedChicken": {
      const n = itemId === "choppedChicken" ? 3 : 1;
      ctx.fillStyle = itemId === "grilledChicken" ? "#8a4d1d" : c;
      for (let i = 0; i < n; i++) {
        const ox = (i - 1) * r * 0.55;
        ctx.beginPath(); ctx.ellipse(ox, i % 2 ? r * 0.2 : -r * 0.1, r * 0.55, r * 0.42, 0.4, 0, Math.PI * 2); ctx.fill();
      }
      if (itemId === "grilledChicken") {
        ctx.strokeStyle = "#5e3410"; ctx.lineWidth = r * 0.12;
        ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.3); ctx.lineTo(r * 0.4, r * 0.3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.5); ctx.lineTo(r * 0.6, r * 0.1); ctx.stroke();
      }
      break;
    }
    case "tomato":
    case "choppedTomato":
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = d;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ff8a70";
      ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.15, r * 0.25, 0, Math.PI * 2); ctx.fill();
      if (itemId === "choppedTomato") {
        ctx.strokeStyle = "#fff"; ctx.lineWidth = r * 0.1;
        ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.6, 0); ctx.stroke();
      }
      break;
    case "chili":
    case "choppedChili":
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.9, r * 0.4, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#2e7d32"; ctx.lineWidth = r * 0.16;
      ctx.beginPath(); ctx.moveTo(r * 0.7, -r * 0.35); ctx.quadraticCurveTo(r * 1.1, -r * 0.6, r * 1.0, -r * 0.2); ctx.stroke();
      if (itemId === "choppedChili") {
        ctx.fillStyle = "#ff6b4a";
        ctx.beginPath(); ctx.arc(-r * 0.4, r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.3, r * 0.35, r * 0.24, 0, Math.PI * 2); ctx.fill();
      }
      break;
    case "cookedNoodle":
      ctx.strokeStyle = c; ctx.lineWidth = r * 0.3; ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.4 + i * 0.2), i * 1.1, 2.2 + i * 1.1);
        ctx.stroke();
      }
      ctx.fillStyle = "#7dff8a";
      ctx.beginPath(); ctx.arc(r * 0.5, -r * 0.5, r * 0.16, 0, Math.PI * 2); ctx.fill();
      break;
    default:
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlateDish(ctx, x, y, r, items) {
  // White plate
  ctx.fillStyle = "#f8f4ea";
  ctx.beginPath(); ctx.ellipse(x, y, r + 8, (r + 8) * 0.82, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#c9b896"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, r + 8, (r + 8) * 0.82, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#e8dfc8";
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.55, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  // Food stacked on it, slightly offset so each item reads.
  const spots = [[0, 0], [-r * 0.45, r * 0.25], [r * 0.45, r * 0.22]];
  items.forEach((item, i) => {
    const s = spots[i % spots.length];
    drawFood(ctx, item, x + s[0], y + s[1] - 4, r * 0.62);
  });
}

function drawChef(ctx, state) {
  const p = state.player;
  const bob = p.moving ? Math.sin(p.walkPhase) * 2.5 : 0;
  const x = p.x, y = p.y + bob * 0.3;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(x, y + 26, 26, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Body: striped apron shirt
  ctx.fillStyle = "#e8e4da";
  rr(ctx, x - 20, y - 6, 40, 40, 12); ctx.fill();
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(x - 20, y + 8, 40, 7);
  ctx.fillRect(x - 20, y + 22, 40, 7);
  // Apron
  ctx.fillStyle = "#2e6f8e";
  rr(ctx, x - 14, y + 2, 28, 32, 8); ctx.fill();

  // Arms
  ctx.fillStyle = "#f2c49b";
  ctx.beginPath(); ctx.arc(x - 22, y + 8, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 22, y + 8, 7, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = "#f2c49b";
  ctx.beginPath(); ctx.arc(x, y - 20, 15, 0, Math.PI * 2); ctx.fill();
  // Eyes (look toward movement)
  ctx.fillStyle = "#222";
  const ex = p.dirX * 3, ey = p.dirY * 2;
  ctx.beginPath(); ctx.arc(x - 5 + ex, y - 21 + ey, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5 + ex, y - 21 + ey, 2.2, 0, Math.PI * 2); ctx.fill();
  // Smile
  ctx.strokeStyle = "#a85b2a"; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(x, y - 16, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

  // Chef hat
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.ellipse(x, y - 32, 17, 10, 0, Math.PI, 0); ctx.fill();
  ctx.fillRect(x - 17, y - 34, 34, 6);
  ctx.strokeStyle = "#d8d2c2"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x - 6, y - 34, 5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 6, y - 34, 5, 0, Math.PI * 2); ctx.stroke();

  // Carried item / plate above the head
  if (state.carry) {
    const cy = y - 62;
    ctx.fillStyle = "rgba(20,10,5,0.55)";
    ctx.beginPath(); ctx.arc(x, cy, 24, 0, Math.PI * 2); ctx.fill();
    if (state.carry.kind === "item") {
      drawFood(ctx, state.carry.item, x, cy, 15);
    } else {
      drawPlateDish(ctx, x, cy, 14, state.carry.items);
    }
  }
}

function drawBackground(ctx, state) {
  // Night sky
  const sky = ctx.createLinearGradient(0, 0, 0, 200);
  sky.addColorStop(0, "#1a2340");
  sky.addColorStop(1, "#2c2a4a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, 200);
  // Stars
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  for (let i = 0; i < 40; i++) {
    const sx = (i * 173) % CANVAS_W;
    const sy = (i * 47) % 130 + 8;
    ctx.globalAlpha = 0.3 + ((i * 7) % 10) / 16;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;

  // String lights across the top
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 30); ctx.quadraticCurveTo(640, 62, 1280, 30); ctx.stroke();
  const bulbColors = ["#ffd94d", "#ff8a5c", "#7dff8a", "#ff9ff3"];
  for (let i = 0; i < 18; i++) {
    const bx = 40 + i * 70;
    const by = 30 + Math.sin((bx / 1280) * Math.PI) * 26;
    ctx.fillStyle = bulbColors[i % 4];
    ctx.beginPath(); ctx.arc(bx, by + 6, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,217,77,0.25)";
    ctx.beginPath(); ctx.arc(bx, by + 6, 12, 0, Math.PI * 2); ctx.fill();
  }

  // Paper lanterns (sides only, clear of the order board)
  for (const [lx, ly, lr, col] of [[90, 92, 26, "#ff5a3c"], [1190, 88, 30, "#ffb02e"]]) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(lx, ly, lr, lr * 1.15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(lx - lr * 0.7, ly - lr * 0.5, lr * 1.4, 4);
    ctx.fillStyle = "#ffd94d";
    ctx.fillRect(lx - 3, ly + lr * 1.15, 6, 10);
  }

  // Kitchen floor
  ctx.fillStyle = "#3a2a1c";
  ctx.fillRect(0, 190, CANVAS_W, CANVAS_H - 190);
  ctx.fillStyle = "#43301f";
  for (let ty = 200; ty < CANVAS_H; ty += 64) {
    ctx.fillRect(0, ty, CANVAS_W, 3);
  }
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let tx = 0; tx < CANVAS_W; tx += 96) {
    ctx.fillRect(tx, 200, 2, CANVAS_H - 200);
  }

  // Back wall band behind the counters
  ctx.fillStyle = "#241a12";
  ctx.fillRect(0, 180, CANVAS_W, 14);
}

function drawStationLabel(ctx, label, cx, y, highlight) {
  ctx.font = "800 15px " + FONT;
  const w = ctx.measureText(label).width + 18;
  ctx.fillStyle = highlight ? "#ffd94d" : "rgba(20,12,6,0.78)";
  rr(ctx, cx - w / 2, y - 12, w, 24, 12); ctx.fill();
  ctx.fillStyle = highlight ? "#241a12" : "#ffe9b0";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, cx, y + 1);
}

function drawStations(ctx, state, highlightStation) {
  const hl = (s) => highlightStation && highlightStation.id === s.id;

  // Crates
  for (const c of STATIONS.crates) {
    ctx.fillStyle = "#8a5a2e";
    rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill();
    ctx.fillStyle = "#a9743c";
    rr(ctx, c.x + 4, c.y + 4, c.w - 8, c.h - 8, 6); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 2;
    rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.stroke();
    drawFood(ctx, c.id, c.x + c.w / 2, c.y + c.h / 2 - 6, 20);
    drawStationLabel(ctx, c.label.toUpperCase(), c.x + c.w / 2, c.y + c.h - 2, hl(c));
    if (hl(c)) {
      ctx.strokeStyle = "#ffd94d"; ctx.lineWidth = 4;
      rr(ctx, c.x - 3, c.y - 3, c.w + 6, c.h + 6, 10); ctx.stroke();
    }
  }

  // Chopping board
  const b = STATIONS.board;
  ctx.fillStyle = "#6b4a26";
  rr(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 10); ctx.fill();
  ctx.fillStyle = "#d9b380";
  rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
  ctx.strokeStyle = "#8a6a42"; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(b.x + 14, b.y + 14 + i * 18); ctx.lineTo(b.x + b.w - 14, b.y + 14 + i * 18); ctx.stroke();
  }
  if (state.board) {
    drawFood(ctx, state.board.item, b.x + b.w / 2, b.y + b.h / 2, 24);
    const frac = Math.min(1, state.board.progress / CHOP_TIME);
    ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = frac >= 1 ? "#7dff8a" : "#ffd94d";
    ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 34, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    if (frac >= 1) outlinedText(ctx, "READY — take it!", b.x + b.w / 2, b.y - 16, 15, "#7dff8a");
  } else {
    // Knife resting on the board
    ctx.fillStyle = "#c8ccd2";
    ctx.save();
    ctx.translate(b.x + 120, b.y + 30); ctx.rotate(0.5);
    ctx.fillRect(0, -4, 44, 8);
    ctx.fillStyle = "#5a3a1e"; ctx.fillRect(44, -4, 18, 8);
    ctx.restore();
  }
  drawStationLabel(ctx, "CHOP", b.x + b.w / 2, b.y + b.h - 2, hl(b));
  if (hl(b)) { ctx.strokeStyle = "#ffd94d"; ctx.lineWidth = 4; rr(ctx, b.x - 9, b.y - 9, b.w + 18, b.h + 18, 12); ctx.stroke(); }

  // Woks
  STATIONS.woks.forEach((w, i) => {
    const wok = state.woks[i];
    ctx.fillStyle = "#3c3c46";
    rr(ctx, w.x, w.y, w.w, w.h, 8); ctx.fill();
    ctx.fillStyle = "#22222a";
    ctx.beginPath(); ctx.ellipse(w.x + w.w / 2, w.y + w.h / 2 + 4, 44, 26, 0, 0, Math.PI * 2); ctx.fill();
    // Flame under the wok
    const flick = 6 + Math.sin(state.elapsed * 9 + i * 2) * 3;
    ctx.fillStyle = wok && wok.burned ? "#555" : "#ff7a2e";
    ctx.beginPath();
    ctx.moveTo(w.x + 22, w.y + w.h - 4);
    ctx.quadraticCurveTo(w.x + w.w / 2, w.y + w.h - 4 - flick * 2.2, w.x + w.w - 22, w.y + w.h - 4);
    ctx.closePath(); ctx.fill();
    if (wok) {
      const food = wok.burned ? null : wok.result;
      if (food) drawFood(ctx, food, w.x + w.w / 2, w.y + w.h / 2, 22);
      if (wok.burned) {
        ctx.fillStyle = "#1c1c1c";
        ctx.beginPath(); ctx.ellipse(w.x + w.w / 2, w.y + w.h / 2, 30, 18, 0, 0, Math.PI * 2); ctx.fill();
        outlinedText(ctx, "BURNED!", w.x + w.w / 2, w.y - 16, 15, "#ff6b5e");
      } else {
        const total = wok.done ? BURN_TIME : COOK_TIME;
        const frac = Math.min(1, wok.progress / total);
        ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 36, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = wok.done ? "#ff9f2e" : "#ffd94d";
        ctx.beginPath(); ctx.arc(w.x + w.w / 2, w.y + w.h / 2, 36, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
        if (wok.done) outlinedText(ctx, "DONE!", w.x + w.w / 2, w.y - 16, 15, "#7dff8a");
      }
    }
    drawStationLabel(ctx, "WOK", w.x + w.w / 2, w.y + w.h - 2, hl(w));
    if (hl(w)) { ctx.strokeStyle = "#ffd94d"; ctx.lineWidth = 4; rr(ctx, w.x - 3, w.y - 3, w.w + 6, w.h + 6, 10); ctx.stroke(); }
  });

  // Plating counter
  ctx.fillStyle = "#7a4a26";
  rr(ctx, 40, 436, 500, 122, 12); ctx.fill();
  ctx.fillStyle = "#96602f";
  rr(ctx, 44, 440, 492, 60, 10); ctx.fill();
  for (const p of STATIONS.plates) {
    const plate = state.plates[p.plateIndex];
    const ready = plateIsReady(state, plate.items);
    if (ready) {
      const pulse = 0.5 + Math.sin(state.elapsed * 6) * 0.3;
      ctx.fillStyle = "rgba(125,255,138," + pulse * 0.35 + ")";
      ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, 66, 48, 0, 0, Math.PI * 2); ctx.fill();
    }
    drawPlateDish(ctx, p.x + p.w / 2, p.y + p.h / 2 + 4, 30, plate.items);
    if (plate.items.length === 0) {
      ctx.fillStyle = "#8a7a58";
      ctx.font = "700 12px " + FONT; ctx.textAlign = "center";
      ctx.fillText("empty plate", p.x + p.w / 2, p.y + p.h / 2 + 5);
    }
    if (ready) outlinedText(ctx, "READY!", p.x + p.w / 2, p.y - 14, 17, "#7dff8a");
    drawStationLabel(ctx, "PLATE " + (p.plateIndex + 1), p.x + p.w / 2, p.y + p.h - 2, hl(p));
    if (hl(p)) { ctx.strokeStyle = "#ffd94d"; ctx.lineWidth = 4; rr(ctx, p.x - 3, p.y - 3, p.w + 6, p.h + 6, 10); ctx.stroke(); }
  }

  // Serving window
  const s = STATIONS.serve;
  ctx.fillStyle = "#5a3a1e";
  rr(ctx, s.x - 8, s.y - 8, s.w + 16, s.h + 16, 12); ctx.fill();
  ctx.fillStyle = "#2c1f14";
  rr(ctx, s.x, s.y, s.w, s.h, 8); ctx.fill();
  ctx.fillStyle = "#ffd94d";
  ctx.font = "800 20px " + FONT; ctx.textAlign = "center";
  ctx.fillText("★ SERVE ★", s.x + s.w / 2, s.y + 26);
  ctx.fillStyle = "#ffe9b0";
  ctx.font = "700 14px " + FONT;
  ctx.fillText("match a ticket to serve", s.x + s.w / 2, s.y + 52);
  // Little bell on the counter
  ctx.fillStyle = "#e8b93c";
  ctx.beginPath(); ctx.arc(s.x + 34, s.y + 74, 12, Math.PI, 0); ctx.fill();
  ctx.fillRect(s.x + 22, s.y + 74, 24, 4);
  drawStationLabel(ctx, "SERVE", s.x + s.w / 2, s.y + s.h - 2, hl(s));
  if (hl(s)) { ctx.strokeStyle = "#ffd94d"; ctx.lineWidth = 4; rr(ctx, s.x - 11, s.y - 11, s.w + 22, s.h + 22, 14); ctx.stroke(); }

  // Trash bin
  const t = STATIONS.trash;
  ctx.fillStyle = "#4a4a52";
  rr(ctx, t.x, t.y, t.w, t.h, 8); ctx.fill();
  ctx.fillStyle = "#33333a";
  rr(ctx, t.x + 8, t.y + 8, t.w - 16, t.h - 24, 6); ctx.fill();
  ctx.fillStyle = "#6a6a72";
  ctx.fillRect(t.x - 4, t.y - 4, t.w + 8, 10);
  text(ctx, "🗑", t.x + t.w / 2, t.y + 44, 30, "#fff");
  drawStationLabel(ctx, "TRASH", t.x + t.w / 2, t.y + t.h - 2, hl(t));
  if (hl(t)) { ctx.strokeStyle = "#ffd94d"; ctx.lineWidth = 4; rr(ctx, t.x - 3, t.y - 3, t.w + 6, t.h + 6, 10); ctx.stroke(); }
}

function drawTicket(ctx, ticket, x, y, w, h) {
  const frac = Math.max(0, ticket.patience / ticket.patienceMax);
  const urgent = frac < 0.35;
  const pulse = urgent ? 0.6 + Math.sin(Date.now() / 120) * 0.4 : 1;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#fff8e6";
  rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = urgent ? "#e33a24" : "#c9a86a";
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 10); ctx.stroke();
  ctx.restore();

  // Ticket number + dish name
  ctx.fillStyle = "#241a12";
  ctx.font = "800 16px " + FONT; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(ticket.name, x + 10, y + 16);
  // Price
  ctx.fillStyle = "#8a6d1f";
  ctx.font = "800 15px " + FONT; ctx.textAlign = "right";
  ctx.fillText(ticket.price + "c", x + w - 10, y + 16);
  // Needed ingredients as coloured chips, wrapped to fit the ticket.
  let cx = x + 10;
  let cy = y + 34;
  ctx.font = "700 11px " + FONT;
  for (const item of ticket.needs) {
    const label = recipeName(item);
    const tw = ctx.measureText(label).width + 18;
    if (cx + tw > x + w - 8 && cx > x + 10) { cx = x + 10; cy += 22; }
    ctx.fillStyle = itemColor(item);
    rr(ctx, cx, cy, tw, 19, 9); ctx.fill();
    ctx.fillStyle = "#241a12";
    ctx.textAlign = "left";
    ctx.fillText(label, cx + 14, cy + 10);
    cx += tw + 5;
  }
  // Patience bar with seconds at its right end
  const barY = y + h - 15;
  ctx.fillStyle = "#e0d4b8";
  rr(ctx, x + 10, barY, w - 52, 9, 4); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? "#58b368" : frac > 0.25 ? "#f2a93b" : "#e33a24";
  if (frac > 0) { rr(ctx, x + 10, barY, (w - 52) * frac, 9, 4); ctx.fill(); }
  ctx.fillStyle = urgent ? "#e33a24" : "#6a5a3a";
  ctx.font = "800 12px " + FONT; ctx.textAlign = "right";
  ctx.fillText(Math.ceil(ticket.patience) + "s", x + w - 10, barY + 5);
}

function drawHUD(ctx, state) {
  // Top bar
  ctx.fillStyle = "rgba(16,10,6,0.88)";
  ctx.fillRect(0, 0, CANVAS_W, 66);
  ctx.fillStyle = "#ffd94d";
  ctx.fillRect(0, 66, CANVAS_W, 3);

  // Timer (big, centre-left)
  const mins = Math.floor(Math.max(0, state.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, state.timeLeft) % 60);
  const timeStr = mins + ":" + String(secs).padStart(2, "0");
  const lowTime = state.timeLeft <= 30;
  outlinedText(ctx, "⏱ " + timeStr, 110, 34, 40, lowTime ? "#ff6b5e" : "#ffffff", "center", 800);
  text(ctx, "SHIFT TIMER", 110, 58, 11, "#ffb02e", "center", 800);

  // Title centre
  outlinedText(ctx, "EMBER & EGG", 640, 24, 26, "#ffd94d", "center", 800);
  text(ctx, "★ Twilight Kitchen ★  night-market street food", 640, 50, 13, "#ffe9b0", "center", 700);

  // Coins + combo (right)
  outlinedText(ctx, "🪙 " + state.coins, 1130, 28, 30, "#ffd94d", "center", 800);
  if (state.comboMult > 1) {
    outlinedText(ctx, "COMBO x" + state.comboMult + "  (" + state.combo + " served)", 1130, 54, 14, "#ff9ff3", "center", 800);
  } else {
    text(ctx, state.served + " served  •  " + state.failed + " lost", 1130, 54, 13, "#ffe9b0", "center", 700);
  }

  // Order board label + tickets
  text(ctx, "— ORDER BOARD —", 640, 80, 13, "#ffd94d", "center", 800);
  const ticketW = 240;
  const gap = 10;
  const totalW = Math.min(state.tickets.length, 5) * (ticketW + gap) - gap;
  let tx = (CANVAS_W - totalW) / 2;
  state.tickets.slice(0, 5).forEach((t) => {
    drawTicket(ctx, t, tx, 90, ticketW, 100);
    tx += ticketW + gap;
  });
  if (state.tickets.length === 0) {
    text(ctx, "No orders yet — the night is young…", 640, 130, 16, "#ffe9b0", "center", 700);
  }

  // Rush banner (bottom centre, clear of the counters)
  if (state.rush || state.rushBanner > 0) {
    const alpha = state.rush ? 1 : Math.min(1, state.rushBanner);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#e33a24";
    rr(ctx, 490, 630, 300, 34, 17); ctx.fill();
    ctx.strokeStyle = "#ffd94d"; ctx.lineWidth = 2;
    rr(ctx, 490, 630, 300, 34, 17); ctx.stroke();
    outlinedText(ctx, "⚡ RUSH HOUR ⚡", 640, 648, 20, "#ffffff", "center", 800);
    ctx.restore();
  }

  // Hint message (bottom of the screen)
  if (state.messageTimer > 0 && state.message) {
    outlinedText(ctx, state.message, 640, 700, 18, "#ffffff", "center", 700);
  }
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = p.kind === "steam" ? a * 0.5 : a;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.kind === "steam" ? (1.6 - a * 0.6) : 1), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const pop of state.popups) {
    const a = Math.min(1, pop.life / 0.5);
    ctx.globalAlpha = a;
    outlinedText(ctx, pop.text, pop.x, pop.y - (1.4 - pop.life) * 30, 22, pop.color, "center", 800);
  }
  ctx.globalAlpha = 1;
}

function drawTitleScreen(ctx, state) {
  drawBackground(ctx, state);
  // Big signboard
  ctx.fillStyle = "rgba(20,10,5,0.72)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = "#2c1f14";
  rr(ctx, 240, 120, 800, 300, 18); ctx.fill();
  ctx.strokeStyle = "#ffd94d"; ctx.lineWidth = 4;
  rr(ctx, 240, 120, 800, 300, 18); ctx.stroke();
  outlinedText(ctx, "EMBER & EGG", 640, 185, 64, "#ffd94d", "center", 800);
  outlinedText(ctx, "★ Twilight Kitchen ★", 640, 240, 28, "#ffe9b0", "center", 700);
  text(ctx, "A night-market cooking game — one chef, one wok, a hungry crowd.", 640, 285, 19, "#ffffff", "center", 700);
  text(ctx, "Chop it. Fry it. Plate it. Serve it before the ticket runs out!", 640, 318, 19, "#ffffff", "center", 700);

  const lines = [
    "HOW TO PLAY",
    "Move with WASD or arrow keys — or click anywhere to walk there.",
    "Grab ingredients from the crates. Chop chicken, tomato & chili on the board.",
    "Fry egg, noodle & chicken in the wok — don't let it burn!",
    "Stack food on a plate to match a ticket, then serve it at the window.",
    "Fast serves earn tips. Clean serves in a row raise your combo to x3.",
    "Survive the 3-minute shift and the RUSH HOURS. E or click to interact.",
  ];
  lines.forEach((line, i) => {
    const y = 452 + i * 26;
    if (i === 0) text(ctx, line, 640, y, 18, "#ffd94d", "center", 800);
    else text(ctx, line, 640, y, 16, "#f5ecd7", "center", 600);
  });

  const pulse = 0.65 + Math.sin(Date.now() / 300) * 0.35;
  ctx.globalAlpha = pulse;
  outlinedText(ctx, "▶  CLICK OR PRESS ENTER TO START COOKING  ◀", 640, 648, 24, "#7dff8a", "center", 800);
  ctx.globalAlpha = 1;
  text(ctx, "M mute  •  P pause  •  R restart", 640, 682, 14, "#ffe9b0", "center", 700);
}

function drawEndScreen(ctx, state) {
  ctx.fillStyle = "rgba(16,10,6,0.78)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = "#2c1f14";
  rr(ctx, 290, 110, 700, 460, 18); ctx.fill();
  ctx.strokeStyle = "#ffd94d"; ctx.lineWidth = 4;
  rr(ctx, 290, 110, 700, 460, 18); ctx.stroke();

  outlinedText(ctx, "SHIFT OVER!", 640, 165, 52, "#ffd94d", "center", 800);
  const stars = "★".repeat(state.stars) + "☆".repeat(3 - state.stars);
  outlinedText(ctx, stars, 640, 230, 46, "#ffd94d", "center", 800);
  text(ctx, state.stars === 3 ? "A legendary night at the market!" : state.stars === 2 ? "The crowd loved your food!" : state.stars === 1 ? "You kept the stall alive." : "The crowd went home hungry…", 640, 285, 20, "#ffffff", "center", 700);

  const rows = [
    ["Coins earned", String(state.coins)],
    ["Dishes served", String(state.served)],
    ["Orders lost", String(state.failed)],
    ["Burned dishes", String(state.burned)],
    ["Best combo", "x" + state.comboMult],
  ];
  rows.forEach(([label, value], i) => {
    const y = 340 + i * 34;
    text(ctx, label, 480, y, 20, "#ffe9b0", "left", 700);
    text(ctx, value, 800, y, 22, "#ffffff", "right", 800);
  });
  outlinedText(ctx, "PRESS R TO COOK ANOTHER SHIFT", 640, 540, 20, "#7dff8a", "center", 800);
}

function drawPause(ctx) {
  ctx.fillStyle = "rgba(16,10,6,0.6)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  outlinedText(ctx, "PAUSED", 640, 340, 56, "#ffffff", "center", 800);
  text(ctx, "Press P to keep cooking", 640, 395, 20, "#ffe9b0", "center", 700);
}

// Main entry: draw the whole frame for the current screen.
export function renderGame(ctx, state, highlightStation) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (state.screen === "title") {
    drawTitleScreen(ctx, state);
    return;
  }
  drawBackground(ctx, state);
  drawStations(ctx, state, highlightStation);
  drawChef(ctx, state);
  drawParticles(ctx, state);
  drawHUD(ctx, state);

  if (state.screen === "end") drawEndScreen(ctx, state);
  if (state.paused && state.screen === "play") drawPause(ctx);

  // Red edge flash when a ticket expires
  if (state.flashRed > 0) {
    ctx.fillStyle = "rgba(227,58,36," + (state.flashRed * 0.35) + ")";
    ctx.fillRect(0, 0, CANVAS_W, 10);
    ctx.fillRect(0, CANVAS_H - 10, CANVAS_W, 10);
  }
}
