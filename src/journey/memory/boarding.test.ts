import { expect, test } from "vitest";
import { MEMORIES } from "./memories";
import { BOARD_FROM, BOARD_TO, boardingProgress, boardingTransform, plankPoint } from "./boarding";

test("boarding runs from just before the ship to where the map takes over", () => {
  const nau = MEMORIES.find((m) => m.id === "nau")!;
  expect(BOARD_FROM).toBeLessThan(nau.at);
  expect(BOARD_TO).toBeGreaterThan(nau.at);
  expect(boardingProgress(BOARD_FROM - 0.1)).toBe(0);
  expect(boardingProgress(BOARD_TO + 0.1)).toBe(1);
  const a = boardingProgress(BOARD_FROM + 0.1);
  const b = boardingProgress(BOARD_FROM + 0.2);
  expect(a).toBeGreaterThan(0);
  expect(b).toBeGreaterThan(a);
  expect(b).toBeLessThan(1);
});

test("before boarding he walks where he always does", () => {
  expect(boardingTransform(0, { feetY: 900, plankY: 400, startHeight: 870, endHeight: 70 })).toEqual({ ty: 0, scale: 1 });
});

test("once aboard his feet stand on the top of the gangplank, at deck-person size", () => {
  const { ty, scale } = boardingTransform(1, { feetY: 900, plankY: 400, startHeight: 870, endHeight: 70 });
  expect(ty).toBe(-500);
  expect(scale).toBeCloseTo(70 / 870);
});

test("he shrinks with perspective: most of the shrinking happens early, like walking away", () => {
  const { scale } = boardingTransform(0.5, { feetY: 900, plankY: 400, startHeight: 870, endHeight: 70 });
  expect(scale).toBeLessThan((1 + 70 / 870) / 2);
  expect(scale).toBeGreaterThan(70 / 870);
});

test("the top of the gangplank sits where the painting puts it, scaled with the ship", () => {
  // a 600×600 box showing the square painting: point at 50.2% across, 46.6% down
  const p = plankPoint({ left: 100, top: 50, width: 600, height: 600 });
  expect(p.x).toBeCloseTo(100 + 0.502 * 600);
  expect(p.y).toBeCloseTo(50 + 0.466 * 600);
  // a taller-than-wide box crops the painting's sides (background-size: cover)
  const tall = plankPoint({ left: 0, top: 0, width: 400, height: 600 });
  expect(tall.y).toBeCloseTo(0.466 * 600);
  expect(tall.x).toBeCloseTo(200 + (0.502 - 0.5) * 600);
});
