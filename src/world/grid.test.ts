import { expect, test } from "vitest";
import { ahead, integerZoom, step } from "./grid";
const wallAt = (x: number) => (t: { x: number; y: number }) => t.x === x;

test("a step moves one tile, and a blocked step stays put", () => {
  expect(ahead({ x: 2, y: 2 }, "up")).toEqual({ x: 2, y: 1 });
  expect(step({ x: 2, y: 2 }, "right", wallAt(9))).toEqual({ x: 3, y: 2 });
  expect(step({ x: 2, y: 2 }, "right", wallAt(3))).toEqual({ x: 2, y: 2 });
});

test("zoom is the largest whole number at which the 20×13-tile view fits, never below 1", () => {
  expect(integerZoom(1440, 900)).toBe(4);
  expect(integerZoom(640, 416)).toBe(2);
  expect(integerZoom(390, 520)).toBe(1); // portrait phone: the area above the controls
  expect(integerZoom(100, 80)).toBe(1);
});

test("on high-density screens zoom is whole in device pixels, so a phone gets a bigger screen that stays crisp", () => {
  expect(integerZoom(500, 700, 3)).toBe(4 / 3); // 1500 device px wide → 4 device px per game pixel
  expect(integerZoom(1440, 900, 2)).toBe(4);
  expect(integerZoom(100, 80, 2)).toBe(1); // never below one CSS pixel per game pixel
});
