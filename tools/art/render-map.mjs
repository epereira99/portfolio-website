// Renders the whole world map with its art pack to one PNG, for reviewing layout and art together. Run: node tools/art/render-map.mjs . out.png [scale]
import { existsSync, readFileSync } from "node:fs";
import sharp from "sharp";
const [repo, out, scale = "2"] = process.argv.slice(2);
const m = JSON.parse(readFileSync(`${repo}/public/world/world.tmj`));
const terrain = `${repo}/public/world/art/terrain.png`;
const parts = [], cache = {};
const g = m.layers.find((l) => l.name === "ground").data;
for (let i = 0; i < g.length; i++) {
  const id = g[i] - 1;
  cache[id] ??= await sharp(terrain).extract({ left: (id % 16) * 16, top: Math.floor(id / 16) * 16, width: 16, height: 16 }).png().toBuffer();
  parts.push({ input: cache[id], left: (i % m.width) * 16, top: Math.floor(i / m.width) * 16 });
}
const objs = m.layers.find((l) => l.name === "objects").objects.map((o) => ({ ...o, art: o.properties?.find((p) => p.name === "art")?.value })).filter((o) => o.art).sort((a, b) => a.y + a.height - (b.y + b.height));
for (const o of objs) {
  const f = `${repo}/public/world/art/objects/${o.art}.png`;
  if (!existsSync(f)) continue;
  const meta = await sharp(f).metadata();
  const left = Math.round(o.x + o.width / 2 - meta.width / 2), top = o.y + o.height - meta.height;
  if (left < 0 || top < 0 || left + meta.width > m.width * 16 || top + meta.height > m.height * 16) continue; // border trees off the edge
  parts.push({ input: f, left, top });
}
const W = m.width * 16, H = m.height * 16;
const buf = await sharp({ create: { width: W, height: H, channels: 4, background: "#000" } }).composite(parts).png().toBuffer();
await sharp(buf).resize(W * +scale, H * +scale, { kernel: "nearest" }).toFile(out);
console.log("wrote", out);
