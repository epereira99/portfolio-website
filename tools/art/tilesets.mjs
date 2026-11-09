// Stacks the downloaded PixelLab Wang tilesets into one normalized sheet + corner metadata. Run: node tools/art/tilesets.mjs
// Input: art/raw/tilesets/<name>.png + <name>.json (from /mcp/tilesets/{id}/image and /metadata).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";
import { normalize, readPalette } from "./normalize.mjs";

const T = 16;
// One row of 16 tiles per set, in this order; row index fixes the gids, so only append.
const SETS = [
  { name: "water-grass", lower: "water", upper: "grass" },
  { name: "grass-path", lower: "grass", upper: "path" },
  { name: "grass-dry", lower: "grass", upper: "dry" },
  { name: "dry-path", lower: "dry", upper: "path" },
  { name: "grass-crops", lower: "grass", upper: "crops" },
];

const palette = readPalette();
const tiles = [];
const sets = [];
for (const [row, set] of SETS.entries()) {
  const meta = JSON.parse(readFileSync(`art/raw/tilesets/${set.name}.json`, "utf8"));
  // Normalize the whole sheet, not each tile: a plain 16 px tile can look like a 2× upscale on its own.
  const sheet = await normalize(readFileSync(`art/raw/tilesets/${set.name}.png`), palette);
  const list = meta.tileset_data.tiles;
  if (list.length !== 16) throw new Error(`${set.name}: expected 16 tiles, got ${list.length}`);
  sets.push({
    ...set,
    row,
    tiles: await Promise.all(
      list.map(async (t, index) => {
        const b = t.bounding_box;
        const png = await sharp(sheet).extract({ left: b.x, top: b.y, width: b.width, height: b.height }).png().toBuffer();
        tiles.push({ input: png, left: index * T, top: row * T });
        return { index, corners: ["NW", "NE", "SW", "SE"].map((c) => t.corners[c]) };
      }),
    ),
  });
}

mkdirSync("public/world/art", { recursive: true });
await sharp({ create: { width: 16 * T, height: SETS.length * T, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(tiles)
  .png()
  .toFile("public/world/art/terrain.png");
writeFileSync("art/tilesets.json", JSON.stringify({ sets }, null, 1));
console.log(`wrote public/world/art/terrain.png and art/tilesets.json (${SETS.length} sets)`);
