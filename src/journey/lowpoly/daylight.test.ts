import { expect, test } from "vitest";
import { ENDING_START } from "../timeline";
import { DAY, SLOTS, daylightAt } from "./daylight";

test("the day starts in the morning and ends at dusk, in the last stage", () => {
  expect(daylightAt(0)).toEqual(DAY.braga);
  expect(daylightAt(ENDING_START)).toEqual(DAY.personal);
  expect(daylightAt(99)).toEqual(DAY.personal);
});

test("every time of day colours every part of the scene", () => {
  for (const d of Object.values(DAY)) for (const slot of SLOTS) expect(d.palette[slot]).toMatch(/^#[0-9a-f]{6}$/);
});

// Relative luminance of an sRGB hex colour (WCAG).
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test("the colours change smoothly with scroll", () => {
  for (let s = 0; s < ENDING_START; s += 0.01) {
    const a = daylightAt(s);
    const b = daylightAt(s + 0.01);
    expect(Math.abs(luminance(a.palette.ground) - luminance(b.palette.ground))).toBeLessThan(0.01);
    expect(Math.abs(luminance(a.skyTop) - luminance(b.skyTop))).toBeLessThan(0.01);
  }
});

test("the day gets darker toward dusk", () => {
  expect(luminance(DAY.porto.skyTop)).toBeGreaterThan(luminance(DAY.stockholm.skyTop));
  expect(luminance(DAY.stockholm.skyTop)).toBeGreaterThan(luminance(DAY.personal.skyTop)); // golden hour, then sunset
  expect(luminance(DAY.porto.palette.ground)).toBeGreaterThan(luminance(DAY.personal.palette.ground));
});

test("the sky behind the cards never gets too bright to read them", () => {
  for (const d of Object.values(DAY)) expect(luminance(d.skyTop)).toBeLessThanOrEqual(0.6);
});
