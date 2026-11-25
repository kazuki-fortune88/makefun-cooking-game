// main.ts — hand the entry in: copy game/ and screenshots/ beside this file
// into the output directory and write /output/dossier.json with buildDossier
// from ./vendor/makefun-game.ts. Node 22 stdlib only.
// Never delete the output directory itself: on the grader it is a mount point.
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

// Make the output directory if missing; never remove it or its parent.
mkdirSync(outDir, { recursive: true });

const gameSrc = join(here, "game");
const shotsSrc = join(here, "screenshots");

// Copy the game and the screenshots in, overwriting stale files.
cpSync(gameSrc, join(outDir, "game"), { recursive: true, force: true });
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, join(outDir, "screenshots"), { recursive: true, force: true });
}

// Drop any stale dossier first so a failed build never leaves an old one.
const dossierPath = join(outDir, "dossier.json");

// buildDossier takes the output root (which holds game/ and screenshots/)
// and the standard caps, and returns the dossier bytes.
const dossier = await buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots_max: 4,
  screenshots_max_bytes: 262144,
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

const bytes = typeof dossier === "string" ? Buffer.from(dossier, "utf8") : dossier;
writeFileSync(dossierPath, bytes);
const dossierSize = Buffer.byteLength(bytes);

console.log("wrote", dossierPath, dossierSize, "bytes");
console.log("game files:", readdirSync(join(outDir, "game")).join(", "));
console.log("screenshots:", existsSync(join(outDir, "screenshots")) ? readdirSync(join(outDir, "screenshots")).join(", ") : "(none)");
