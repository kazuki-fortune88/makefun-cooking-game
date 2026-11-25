// input.js — keyboard and mouse, shared by the player and the menus.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: false, // consumed by the game loop each frame
    clickX: 0,
    clickY: 0,
    interactPressed: false, // E / Space edge, consumed each frame
    anyKeyPressed: false,
  };

  const KEYMAP = {
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
  };

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }
    input.anyKeyPressed = true;
    if (KEYMAP[e.code]) input.keys.add(KEYMAP[e.code]);
    if ((e.code === "KeyE" || e.code === "Space") && !e.repeat) input.interactPressed = true;
    if (e.code === "KeyM" && !e.repeat) input.mutePressed = true;
    if (e.code === "KeyR" && !e.repeat) input.restartPressed = true;
    if (e.code === "KeyP" && !e.repeat) input.pausePressed = true;
    if ((e.code === "Enter" || e.code === "Space") && !e.repeat) input.confirmPressed = true;
  });
  window.addEventListener("keyup", (e) => {
    if (KEYMAP[e.code]) input.keys.delete(KEYMAP[e.code]);
  });
  window.addEventListener("blur", () => input.keys.clear());

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 1280,
      y: ((e.clientY - rect.top) / rect.height) * 720,
    };
  }
  canvas.addEventListener("mousemove", (e) => {
    const p = canvasPos(e);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });
  canvas.addEventListener("mousedown", (e) => {
    const p = canvasPos(e);
    input.mouseX = p.x;
    input.mouseY = p.y;
    input.mouseDown = true;
    input.clicked = true;
    input.clickX = p.x;
    input.clickY = p.y;
  });
  window.addEventListener("mouseup", () => { input.mouseDown = false; });

  return input;
}

// Edge-triggered flags, cleared after each frame's update.
export function endFrameInput(input) {
  input.interactPressed = false;
  input.clicked = false;
  input.anyKeyPressed = false;
  input.mutePressed = false;
  input.restartPressed = false;
  input.pausePressed = false;
  input.confirmPressed = false;
}
