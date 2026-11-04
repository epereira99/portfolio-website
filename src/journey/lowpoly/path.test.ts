import { expect, test } from "vitest";
import { ENDING_START } from "../timeline";
import { UNITS_PER_SCREEN, cameraAt, distanceAt, pointAt } from "./path";

const STEP = 0.01 * UNITS_PER_SCREEN; // ground covered per 0.01 screens of scrolling

test("distance clamps to the walk: nothing before the start, nothing past the ending", () => {
  expect(distanceAt(-1)).toBe(0);
  expect(distanceAt(99)).toBe(distanceAt(ENDING_START));
  expect(distanceAt(NaN)).toBe(0);
});

test("the path starts at the origin heading toward −Z", () => {
  const p = pointAt(0);
  expect(p.x).toBeCloseTo(0, 6);
  expect(p.z).toBeCloseTo(0, 6);
  expect(pointAt(1).z).toBeLessThan(0);
  expect(Math.abs(Math.sin(p.heading))).toBeLessThan(0.5); // mostly straight down −Z
});

test("the journey is a real walk, not a stroll", () => {
  expect(distanceAt(ENDING_START)).toBeGreaterThanOrEqual(90);
});

test("walking never jumps", () => {
  let prev = pointAt(distanceAt(0));
  for (let s = 0.01; s <= ENDING_START; s += 0.01) {
    const p = pointAt(distanceAt(s));
    expect(Math.hypot(p.x - prev.x, p.z - prev.z)).toBeLessThan(STEP * 1.05);
    prev = p;
  }
});

test("the camera sits 11 behind and 2.2 above him", () => {
  for (const s of [0, 1.7, 4.2, ENDING_START]) {
    const w = pointAt(distanceAt(s));
    const { position } = cameraAt(s, 16 / 9);
    expect(position[1]).toBeCloseTo(2.2, 2);
    expect(Math.hypot(position[0] - w.x, position[2] - w.z)).toBeCloseTo(11, 2);
  }
});

test("he turns smoothly along the bends, so the camera behind him never jolts", () => {
  for (let s = 0; s < ENDING_START; s += 0.01) {
    const a = pointAt(distanceAt(s)).heading;
    const b = pointAt(distanceAt(s + 0.01)).heading;
    expect(Math.abs(b - a)).toBeLessThan(0.033 * STEP); // radians per unit walked
  }
});

// Where his feet land on screen, as a fraction of its height from the top.
const feetOnScreen = (s: number, aspect: number) => {
  const w = pointAt(distanceAt(s));
  const { position, target, fov } = cameraAt(s, aspect);
  const pitch = Math.atan2(position[1] - target[1], Math.hypot(target[0] - position[0], target[2] - position[2]));
  const down = Math.atan2(position[1], Math.hypot(w.x - position[0], w.z - position[2])) - pitch;
  return 0.5 + Math.tan(down) / Math.tan((fov * Math.PI) / 360) / 2;
};

test("his feet stay clear of the bottom bar", () => {
  for (const s of [0, 2.5, ENDING_START]) {
    expect(feetOnScreen(s, 16 / 9)).toBeLessThan(0.83);
    expect(feetOnScreen(s, 390 / 844)).toBeLessThan(0.83);
  }
});

test("portrait widens the view but never past 75°", () => {
  expect(cameraAt(0, 390 / 844).fov).toBeLessThanOrEqual(75);
  expect(cameraAt(0, 16 / 9).fov).toBeLessThan(cameraAt(0, 1).fov);
});
