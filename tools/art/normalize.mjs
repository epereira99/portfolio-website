// Snaps a generated image to its true pixel grid and the master palette. Run: npm run art:normalize -- in.png out.png
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const NOISE = 8; // per channel: JPEG and AI upscales leave blocks that are almost, not exactly, one colour

/** The master palette as [r,g,b] triples, from one `rrggbb` per line. */
export function readPalette(path = "art/palette.hex") {
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));
}

/** The largest k where every k×k block is one colour, i.e. how much the image was upscaled. */
function blockSize(data, w, h) {
  for (let k = Math.min(w, h); k > 1; k--) {
    if (w % k || h % k) continue;
    let uniform = true;
    for (let y = 0; y < h && uniform; y++)
      for (let x = 0; x < w && uniform; x++) {
        const a = (y * w + x) * 4, b = ((y - (y % k)) * w + (x - (x % k))) * 4;
        for (let c = 0; c < 4; c++) if (Math.abs(data[a + c] - data[b + c]) > NOISE) uniform = false;
      }
    if (uniform) return k;
  }
  return 1;
}

const nearest = (palette, r, g, b) =>
  palette.reduce((best, p) => {
    const d = 2 * (p[0] - r) ** 2 + 4 * (p[1] - g) ** 2 + 3 * (p[2] - b) ** 2;
    return d < best.d ? { p, d } : best;
  }, { p: palette[0], d: Infinity }).p;

/** A PNG on the true pixel grid, every pixel a palette colour or fully transparent. */
export async function normalize(input, palette) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const k = blockSize(data, info.width, info.height);
  const w = info.width / k, h = info.height / k;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * k * info.width + x * k) * 4, o = (y * w + x) * 4;
      if (data[i + 3] < 128) continue; // stays 0,0,0,0
      out.set([...nearest(palette, data[i], data[i + 1], data[i + 2]), 255], o);
    }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error("usage: npm run art:normalize -- in.png out.png");
  writeFileSync(output, await normalize(readFileSync(input), readPalette()));
  console.log(`wrote ${output}`);
}
