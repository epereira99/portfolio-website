// Builds the hunter sprite sheet from the PixelLab character. Run: node tools/art/hunter.mjs
// Rows follow HUNTER_ROWS in src/world/config.ts; column 0 stands, columns 1..6 walk.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { normalize, readPalette } from "./normalize.mjs";

const BASE = "https://backblaze.pixellab.ai/file/pixellab-characters/30d06502-18a0-47f2-b9cc-c95f46926b21/cf2a5355-8728-4d42-9494-4e115988b8e0";
const ROWS = [
  ["up", "north", "f652ff4d-d81e-48d1-bb2b-4912486e6eb3"],
  ["down", "south", "8fe7355c-24cd-4540-b724-396e0175f94f"],
  ["left", "west", "9d44473e-799f-43ea-aad4-32757558ce20"],
  ["right", "east", "62bc9a65-50bf-4f97-873b-4f8d564985b0"],
];
const S = 32, WALK = 6;

const get = async (url, file) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(file, buf);
  return buf;
};

mkdirSync("art/raw/hunter", { recursive: true });
const parts = [];
for (const [r, [dir, compass, anim]] of ROWS.entries()) {
  parts.push({ input: await get(`${BASE}/rotations/${compass}.png`, `art/raw/hunter/${compass}.png`), left: 0, top: r * S });
  for (let i = 0; i < WALK; i++)
    parts.push({ input: await get(`${BASE}/animations/${anim}/${compass}/${i}.png`, `art/raw/hunter/${compass}-walk-${i}.png`), left: (i + 1) * S, top: r * S });
  console.log(`${dir}: ${compass}`);
}
// Normalize the whole sheet, not per frame: a small frame can look like a 2× upscale on its own.
const raw = await sharp({ create: { width: (WALK + 1) * S, height: ROWS.length * S, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(parts)
  .png()
  .toBuffer();
mkdirSync("public/world/art", { recursive: true });
writeFileSync("public/world/art/hunter.png", await normalize(raw, readPalette()));
console.log("wrote public/world/art/hunter.png");
