import { expect, test } from "vitest";
import { ENDING_START } from "../timeline";
import { cameraAt, distanceAt, pointAt } from "./path";

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

test("walking never jumps", () => {
  let prev = pointAt(distanceAt(0));
  for (let s = 0.01; s <= ENDING_START; s += 0.01) {
    const p = pointAt(distanceAt(s));
    expect(Math.hypot(p.x - prev.x, p.z - prev.z)).toBeLessThan(0.1);
    prev = p;
  }
});

test("the camera sits 11 behind and 3.2 above him", () => {
  for (const s of [0, 1.7, 4.2, ENDING_START]) {
    const w = pointAt(distanceAt(s));
    const { position } = cameraAt(s, 16 / 9);
    expect(position[1]).toBeCloseTo(3.2, 2);
    expect(Math.hypot(position[0] - w.x, position[2] - w.z)).toBeCloseTo(11, 2);
  }
});

test("portrait widens the view but never past 75°", () => {
  expect(cameraAt(0, 390 / 844).fov).toBeLessThanOrEqual(75);
  expect(cameraAt(0, 16 / 9).fov).toBeLessThan(cameraAt(0, 1).fov);
});
