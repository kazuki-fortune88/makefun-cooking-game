// player.js — the chef: WASD / arrow movement, click-to-move, carrying one item.
import { PLAYER_SPEED } from "./config.js";
import { clampToFloor, nearestStation, stationAtPoint } from "./kitchen.js";

export function updatePlayer(state, input, dt) {
  const p = state.player;

  // Click: walk to the clicked point (or to a station's front) and interact there.
  if (input.clicked && state.screen === "play") {
    const station = stationAtPoint(input.clickX, input.clickY);
    if (station) {
      p.target = { x: station.ix, y: station.iy, station };
    } else {
      p.target = { x: input.clickX, y: Math.max(300, input.clickY), station: null };
    }
  }

  let mx = 0;
  let my = 0;
  if (input.keys.has("left")) mx -= 1;
  if (input.keys.has("right")) mx += 1;
  if (input.keys.has("up")) my -= 1;
  if (input.keys.has("down")) my += 1;

  if (mx !== 0 || my !== 0) {
    p.target = null; // keyboard takes over from click-to-move
    const len = Math.hypot(mx, my);
    moveChef(state, (mx / len) * PLAYER_SPEED * dt, (my / len) * PLAYER_SPEED * dt);
    p.dirX = mx / len;
    p.dirY = my / len;
    p.moving = true;
  } else if (p.target) {
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      const arrived = p.target.station || null;
      p.target = null;
      p.moving = false;
      if (arrived) return { arrivedAt: arrived };
    } else {
      const step = Math.min(dist, PLAYER_SPEED * dt);
      const nx = (dx / dist) * step;
      const ny = (dy / dist) * step;
      moveChef(state, nx, ny);
      p.dirX = dx / dist;
      p.dirY = dy / dist;
      p.moving = true;
    }
  } else {
    p.moving = false;
  }

  if (p.moving) p.walkPhase += dt * 12;
  return {};
}

function moveChef(state, dx, dy) {
  const p = state.player;
  p.x += dx;
  p.y += dy;
  clampToFloor(p);
}

// The station the chef is standing at right now (for the E key / highlight).
export function currentStation(state) {
  return nearestStation(state.player.x, state.player.y);
}
