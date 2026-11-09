import { expect, test } from "vitest";
import { segmentStart } from "../timeline";
import { TREES, pathX, snowAt } from "./road";

const sweden = segmentStart("jonkoping") * 6; // road.ts UNITS

test("grass in Portugal, snow in Sweden, with a short blend at the border", () => {
  expect(snowAt(0)).toBe(0);
  expect(snowAt(sweden - 2)).toBe(0);
  expect(snowAt(sweden)).toBeCloseTo(0.5);
  expect(snowAt(sweden + 2)).toBe(1);
});

test("broadleaf trees line the Portuguese road and pines the Swedish one, never on the path", () => {
  expect(TREES.length).toBeGreaterThan(0);
  for (const t of TREES) {
    expect(t.kind).toBe(t.d < sweden ? "broadleaf" : "pine");
    expect(Math.abs(t.x - pathX(t.d))).toBeGreaterThan(0.4);
  }
  expect(TREES.some((t) => t.kind === "pine")).toBe(true);
});
