// kitchen.js — the fixed layout of the night-market kitchen: crates, board, woks,
// plating counter, serving window and trash. Every station has a rect, a label
// and an interaction point the chef walks to.
import { INGREDIENTS } from "./config.js";

export const CRATE_IDS = ["rice", "noodle", "egg", "chicken", "tomato", "chili"];

export const STATIONS = {
  // Ingredient crates along the top-left wall.
  crates: CRATE_IDS.map((id, i) => ({
    kind: "crate",
    id,
    label: INGREDIENTS[id].label,
    x: 36 + i * 92,
    y: 206,
    w: 84,
    h: 76,
    ix: 36 + i * 92 + 42, // interaction point (front of the crate)
    iy: 206 + 76 + 26,
  })),
  board: {
    kind: "board",
    id: "board",
    label: "CHOP",
    x: 620, y: 206, w: 170, h: 84,
    ix: 705, iy: 206 + 84 + 26,
  },
  woks: [
    { kind: "wok", id: "wok0", label: "WOK", x: 838, y: 206, w: 118, h: 84, ix: 897, iy: 206 + 84 + 26 },
    { kind: "wok", id: "wok1", label: "WOK", x: 968, y: 206, w: 118, h: 84, ix: 1027, iy: 206 + 84 + 26 },
  ],
  // Plating counter: three plate slots along the lower-left counter.
  plates: [0, 1, 2].map((i) => ({
    kind: "plate",
    id: "plate" + i,
    label: "PLATE",
    plateIndex: i,
    x: 60 + i * 150,
    y: 448,
    w: 130,
    h: 96,
    ix: 60 + i * 150 + 65,
    iy: 448 + 96 + 22,
  })),
  serve: {
    kind: "serve",
    id: "serve",
    label: "SERVE",
    x: 830, y: 448, w: 220, h: 96,
    ix: 940, iy: 448 + 96 + 22,
  },
  trash: {
    kind: "trash",
    id: "trash",
    label: "TRASH",
    x: 1120, y: 448, w: 110, h: 96,
    ix: 1175, iy: 448 + 96 + 22,
  },
};

export function allStations() {
  return [
    ...STATIONS.crates,
    STATIONS.board,
    ...STATIONS.woks,
    ...STATIONS.plates,
    STATIONS.serve,
    STATIONS.trash,
  ];
}

export function stationCenter(s) {
  return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
}

// The station whose interaction point is nearest the chef, if close enough.
export function nearestStation(px, py) {
  let best = null;
  let bestD = 92;
  for (const s of allStations()) {
    const dx = s.ix - px;
    const dy = s.iy - py;
    const d = Math.hypot(dx, dy);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

// The station whose rect contains a click (for click-to-move).
export function stationAtPoint(x, y) {
  for (const s of allStations()) {
    if (x >= s.x - 8 && x <= s.x + s.w + 8 && y >= s.y - 8 && y <= s.y + s.h + 8) return s;
  }
  return null;
}

// Walkable floor: everywhere except inside the counters themselves.
export function clampToFloor(p) {
  p.x = Math.max(34, Math.min(1246, p.x));
  p.y = Math.max(300, Math.min(690, p.y));
  return p;
}
