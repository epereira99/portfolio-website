// Canva downloads → keyed, trimmed WebP sprites for the road scene. Run from the repo root: npm run gen:road
// Reads art/raw/road/<style>/<name>.(png|jpg) and writes public/road/<style>/<name>.webp. Missing files are skipped,
// so the scene keeps drawing its own shapes for them.
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const STYLES = ["painted", "cartoon"];
// The longest side each sprite is resized to: trees get close to the camera, mountains span the screen.
export const SIZES = { tree: 900, pine: 900, cloud: 700, grass: 400, "mountains-pt": 2400, "mountains-se": 2400 };
// Ground textures and skies fill the frame, so they keep their background.
const UNKEYED = { ground: 512, snow: 512, dirt: 512, "snow-path": 512, "sky-pt": 1920, "sky-se": 1920 };
const TOL = 28; // colour distance still counted as background (JPEG noise, soft studio gradients)

/**
 * Makes the flat background transparent: flood-fills from the image edges through pixels close to the corner colour,
 * with a soft edge where the subject begins. Pixels of that colour inside the subject (white snow) are kept.
 */
export function keyBackground(data, w, h) {
  const bg = [data[0], data[1], data[2]];
  const dist = (i) => Math.max(...[0, 1, 2].map((c) => Math.abs(data[i * 4 + c] - bg[c])));
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i]) continue;
    seen[i] = 1;
    const d = dist(i);
    if (d >= TOL * 2) continue; // the subject
    data[i * 4 + 3] = d < TOL ? 0 : Math.round(((d - TOL) / TOL) * 255);
    if (d >= TOL) continue; // edge pixel: soften it, but don't flood into the subject
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  return data;
}

async function make(src, out, size, keyed) {
  if (!keyed) return sharp(src).resize(size, size, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyBackground(data, info.width, info.height);
  await sharp(data, { raw: info })
    .trim({ threshold: 0 })
    .resize(size, size, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(out);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const style of STYLES) {
    mkdirSync(`public/road/${style}`, { recursive: true });
    for (const [name, size] of [...Object.entries(SIZES), ...Object.entries(UNKEYED)]) {
      const src = ["png", "jpg", "jpeg"].map((ext) => `art/raw/road/${style}/${name}.${ext}`).find(existsSync);
      if (!src) {
        console.log(`skip ${style}/${name} (no art/raw/road/${style}/${name}.png)`);
        continue;
      }
      await make(src, `public/road/${style}/${name}.webp`, size, name in SIZES);
      console.log(`wrote public/road/${style}/${name}.webp`);
    }
  }
}
