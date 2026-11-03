// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { expect, test } from "vitest";
import { normalize, readPalette } from "./normalize.mjs";

type RGB = [number, number, number];
const palette: RGB[] = readPalette();

/** A PNG from rows of [r,g,b,a] pixels. */
const png = (px: number[][][]) =>
  sharp(Buffer.from(px.flat(2)), { raw: { width: px[0].length, height: px.length, channels: 4 } }).png().toBuffer();
const pixels = async (buf: Buffer) => {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data: [...data] };
};
const upscale = (px: number[][][], k: number) => px.flatMap((row) => Array(k).fill(row.flatMap((p) => Array(k).fill(p))));

const c = (i: number) => [...palette[i], 255];
const grid4 = [0, 1, 2, 3].map((y) => [0, 1, 2, 3].map((x) => c((x + y * 4) % palette.length)));

test("snaps a 3× upscaled image back to its true pixels", async () => {
  const out = await pixels(await normalize(await png(upscale(grid4, 3)), palette));
  expect([out.w, out.h]).toEqual([4, 4]);
  expect(out.data).toEqual(grid4.flat(2));
});

test("maps near-miss colours to the nearest palette colour", async () => {
  const [r, g, b] = palette[0];
  const out = await pixels(await normalize(await png([[[r + 6, g - 5, b + 4, 255]]]), palette));
  expect(out.data).toEqual([r, g, b, 255]);
});

test("makes alpha binary", async () => {
  const out = await pixels(await normalize(await png([[[...palette[0], 100], [...palette[1], 200]]]), palette));
  expect([out.data[3], out.data[7]]).toEqual([0, 255]);
});

test("leaves a native-size image at its size", async () => {
  const checker = [...Array(8)].map((_, y) => [...Array(8)].map((_, x) => c((x + y) % 2)));
  const out = await pixels(await normalize(await png(checker), palette));
  expect([out.w, out.h]).toEqual([8, 8]);
});

test("art pack is on palette", async () => {
  const dir = "public/world/art";
  const files = existsSync(dir) ? readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith(".png")) : [];
  const allowed = new Set(palette.map((p) => p.join()));
  for (const f of files) {
    const { data } = await pixels(readFileSync(`${dir}/${f}`));
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      expect(data[i + 3], `${f}: partial alpha`).toBe(255);
      expect(allowed.has(data.slice(i, i + 3).join()), `${f}: off-palette ${data.slice(i, i + 3)}`).toBe(true);
    }
  }
});
