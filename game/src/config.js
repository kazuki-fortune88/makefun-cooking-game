// config.js — constants, ingredients, recipes and tuning for Ember & Egg.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const SHIFT_SECONDS = 180; // one dinner shift, 3 minutes
export const FIRST_ORDER_AT = 4; // seconds in before the first ticket

// Rush windows (elapsed seconds): minute 1 and minute 2 of the shift.
export const RUSH_WINDOWS = [
  { start: 60, end: 90 },
  { start: 120, end: 150 },
];

export const INGREDIENTS = {
  rice:    { id: "rice",    label: "Rice",    color: "#f5ecd7", dark: "#d9c9a3", raw: true },
  noodle:  { id: "noodle",  label: "Noodle",  color: "#f2c14e", dark: "#c98f1b", raw: true },
  egg:     { id: "egg",     label: "Egg",     color: "#fff3d6", dark: "#e8c97a", raw: true },
  chicken: { id: "chicken", label: "Chicken", color: "#e8a06a", dark: "#a85b2a", raw: true },
  tomato:  { id: "tomato",  label: "Tomato",  color: "#e4573d", dark: "#a02c18", raw: true },
  chili:   { id: "chili",   label: "Chili",   color: "#d92b1f", dark: "#8f130b", raw: true },
};

// Processed forms produced by the board and the wok.
export const PROCESSED = {
  friedEgg:       { id: "friedEgg",       label: "Fried Egg",       color: "#ffd94d", dark: "#e8a90c", from: "egg" },
  cookedNoodle:   { id: "cookedNoodle",   label: "Cooked Noodle",   color: "#f7c948", dark: "#c98f1b", from: "noodle" },
  grilledChicken: { id: "grilledChicken", label: "Grilled Chicken", color: "#b06a2e", dark: "#6e3f16", from: "chicken" },
  choppedChicken: { id: "choppedChicken", label: "Chopped Chicken", color: "#d98a4e", dark: "#96521f", from: "chicken" },
  choppedTomato:  { id: "choppedTomato",  label: "Chopped Tomato",  color: "#ef6a4a", dark: "#b03a22", from: "tomato" },
  choppedChili:   { id: "choppedChili",   label: "Chopped Chili",   color: "#e33a24", dark: "#991708", from: "chili" },
};

export const CHOP_TIME = 1.5; // seconds holding the board to chop one item
export const COOK_TIME = 4.0; // seconds in the wok before an item is done
export const BURN_TIME = 9.0; // seconds in the wok before an item burns

// Which raw ingredient goes where. Rice comes out of the crate already steamed.
export const CHOPPABLE = { chicken: "choppedChicken", tomato: "choppedTomato", chili: "choppedChili" };
export const COOKABLE = { egg: "friedEgg", noodle: "cookedNoodle", chicken: "grilledChicken" };

// Six house recipes. A plate serves only when its contents match a ticket exactly.
export const RECIPES = [
  { id: "sunny-rice",   name: "Sunny Rice Bowl",    needs: ["rice", "friedEgg"],       price: 12 },
  { id: "ember-rice",   name: "Ember Fried Rice",   needs: ["rice", "friedEgg", "choppedChili"], price: 16 },
  { id: "chicken-noodle", name: "Chicken Noodle",   needs: ["cookedNoodle", "choppedChicken", "choppedTomato"], price: 18 },
  { id: "tomato-omelette", name: "Tomato Omelette", needs: ["friedEgg", "choppedTomato"], price: 13 },
  { id: "chili-chicken-rice", name: "Chili Chicken Rice", needs: ["rice", "grilledChicken", "choppedChili"], price: 17 },
  { id: "golden-noodle", name: "Golden Noodle",     needs: ["cookedNoodle", "friedEgg", "choppedChili"], price: 16 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

export const MAX_TICKETS = 5;
export const SPAWN_INTERVAL = 20; // calm seconds between new tickets
export const RUSH_SPAWN_INTERVAL = 10; // rush seconds between new tickets
export const PATIENCE_SECONDS = 62;
export const RUSH_PATIENCE_SECONDS = 45;

export const TIP_MAX = 8; // extra coins for a lightning-fast serve
export const COMBO_STEP = 3; // serves in a row before the tip multiplier grows
export const COMBO_MAX_MULT = 3;

export const STARS = [
  { coins: 120, stars: 3 },
  { coins: 70, stars: 2 },
  { coins: 30, stars: 1 },
];

export const PLAYER_SPEED = 300; // px per second
export const PLAYER_RADIUS = 26;

export function recipeName(itemId) {
  if (INGREDIENTS[itemId]) return INGREDIENTS[itemId].label;
  if (PROCESSED[itemId]) return PROCESSED[itemId].label;
  return itemId;
}

export function itemColor(itemId) {
  if (INGREDIENTS[itemId]) return INGREDIENTS[itemId].color;
  if (PROCESSED[itemId]) return PROCESSED[itemId].color;
  return "#cccccc";
}

export function itemDark(itemId) {
  if (INGREDIENTS[itemId]) return INGREDIENTS[itemId].dark;
  if (PROCESSED[itemId]) return PROCESSED[itemId].dark;
  return "#888888";
}

// Same ingredients, any order: does this plate match the recipe?
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const have = [...plateItems].sort();
  const want = [...recipe.needs].sort();
  return have.every((item, i) => item === want[i]);
}

export function findRecipeForPlate(plateItems) {
  return RECIPES.find((r) => plateMatchesRecipe(plateItems, r)) || null;
}
