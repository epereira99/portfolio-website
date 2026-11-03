import { expect, test } from "vitest";
import { ahead, integerZoom, step } from "./grid";
const wallAt = (x: number) => (t: { x: number; y: number }) => t.x === x;

test("a step moves one tile, and a blocked step stays put", () => {
  expect(ahead({ x: 2, y: 2 }, "up")).toEqual({ x: 2, y: 1 });
  expect(step({ x: 2, y: 2 }, "right", wallAt(9))).toEqual({ x: 3, y: 2 });
  expect(step({ x: 2, y: 2 }, "right", wallAt(3))).toEqual({ x: 2, y: 2 });
});

test("zoom is the largest whole number that fits, never below 1", () => {
  expect(integerZoom(1440, 900)).toBe(5);
  expect(integerZoom(480, 320)).toBe(2);
  expect(integerZoom(390, 520)).toBe(1); // portrait phone: the area above the controls
  expect(integerZoom(100, 80)).toBe(1);
});
