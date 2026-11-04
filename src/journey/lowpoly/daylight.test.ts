import { expect, test } from "vitest";
import { ENDING_START } from "../timeline";
import { DAY, daylightAt } from "./daylight";

test("the day starts in the morning and ends at dusk", () => {
  expect(daylightAt(0)).toEqual(DAY.braga);
  expect(daylightAt(ENDING_START)).toEqual(DAY.stockholm);
  expect(daylightAt(99)).toEqual(DAY.stockholm);
});

test("the sun rises to midday then sets", () => {
  expect(DAY.braga.sunElevation).toBeLessThan(DAY.porto.sunElevation);
  expect(DAY.porto.sunElevation).toBeGreaterThan(DAY.jonkoping.sunElevation);
  expect(DAY.jonkoping.sunElevation).toBeGreaterThan(DAY.stockholm.sunElevation);
});

test("the light changes smoothly with scroll", () => {
  for (let s = 0; s < ENDING_START; s += 0.01) {
    expect(Math.abs(daylightAt(s + 0.01).sunElevation - daylightAt(s).sunElevation)).toBeLessThan(1);
  }
});

// Relative luminance of an sRGB hex colour (WCAG).
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test("the sky behind the cards never gets too bright to read them", () => {
  for (const d of Object.values(DAY)) expect(luminance(d.skyTop)).toBeLessThanOrEqual(0.6);
});
