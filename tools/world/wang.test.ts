// @vitest-environment node
import { expect, test } from "vitest";
import { pickTile } from "./wang.mjs";

type Side = "lower" | "upper";
/** A fake set whose 16 tiles cover every corner combination; tile i's corners are its bits NW,NE,SW,SE (1 = upper). */
const set = (lower: string, upper: string, row: number) => ({
  lower,
  upper,
  row,
  tiles: [...Array(16)].map((_, index) => ({
    index,
    corners: [8, 4, 2, 1].map((bit) => (index & bit ? "upper" : "lower")) as Side[],
  })),
});
const sets = [set("water", "grass", 0), set("grass", "path", 1)];
const gid = (row: number, bits: number) => row * 16 + bits + 1;

test("picks the full upper tile when all corners are upper", () => {
  expect(pickTile(["grass", "grass", "grass", "grass"], sets)).toBe(gid(0, 0b1111));
});

test("picks the tile whose corners match a mixed cell", () => {
  expect(pickTile(["water", "grass", "grass", "grass"], sets)).toBe(gid(0, 0b0111));
  expect(pickTile(["grass", "grass", "path", "path"], sets)).toBe(gid(1, 0b0011));
});

test("a cell mixing three terrains still gets a tile", () => {
  // water + grass covers as many corners as grass + path; the earlier set wins and path counts as grass.
  expect(pickTile(["water", "path", "grass", "grass"], sets)).toBe(gid(0, 0b0111));
});
