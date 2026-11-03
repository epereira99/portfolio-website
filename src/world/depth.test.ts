import { expect, test } from "vitest";
import { TILE } from "./config";
import { depthOf } from "./depth";

const feet = (row: number) => (row + 1) * TILE; // bottom edge of a tile row
const buildingBase = 10; // a building's bottom row

test("a hunter standing above a building's base draws behind it", () => {
  expect(depthOf(feet(buildingBase - 1))).toBeLessThan(depthOf(feet(buildingBase)));
});

test("below it, he draws in front", () => {
  expect(depthOf(feet(buildingBase + 1))).toBeGreaterThan(depthOf(feet(buildingBase)));
});
