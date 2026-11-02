import { expect, test } from "vitest";
import { MEMORIES, memoryPose } from "./memories";
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

test("when the map takes over his feet stand halfway up the gangplank, at the size of a person there", () => {
  const { ty, scale } = boardingTransform(1, { feetY: 900, plankY: 400, startHeight: 870, endHeight: 70 });
  expect(ty).toBe(-500);
  expect(scale).toBeCloseTo(70 / 870);
});

test("he shrinks with perspective: most of the shrinking happens early, like walking away", () => {
  const { scale } = boardingTransform(0.5, { feetY: 900, plankY: 400, startHeight: 870, endHeight: 70 });
  expect(scale).toBeLessThan((1 + 70 / 870) / 2);
  expect(scale).toBeGreaterThan(70 / 870);
});

test("halfway up the gangplank sits where the painting puts it, scaled with the ship", () => {
  // a 600×600 box showing the square painting: halfway up the gangplank is 50.2% across, 62% down
  const p = plankPoint({ left: 100, top: 50, width: 600, height: 600 });
  expect(p.x).toBeCloseTo(100 + 0.502 * 600);
  expect(p.y).toBeCloseTo(50 + 0.62 * 600);
  // a taller-than-wide box crops the painting's sides (background-size: cover)
  const tall = plankPoint({ left: 0, top: 0, width: 400, height: 600 });
  expect(tall.y).toBeCloseTo(0.62 * 600);
  expect(tall.x).toBeCloseTo(200 + (0.502 - 0.5) * 600);
});

test("he walks up the gangplank for at least two thirds of a screen of scrolling", () => {
  expect(BOARD_TO - BOARD_FROM).toBeGreaterThanOrEqual(0.65);
});

test("the ship stays fully visible all the way up the gangplank", () => {
  const nau = MEMORIES.find((m) => m.id === "nau")!;
  for (let s = BOARD_FROM; s <= BOARD_TO; s += 0.05) expect(memoryPose(nau, s, false).opacity, `s=${s}`).toBe(1);
});

test("the ship never grows past the screen, so its masts and flag stay in view", () => {
  const nau = MEMORIES.find((m) => m.id === "nau")!;
  for (let s = 2; s <= 5; s += 0.05) expect(memoryPose(nau, s, false).scale).toBeLessThanOrEqual(1.1);
});

test("his pace matches his steps: every bit of scroll takes him the same distance further away", () => {
  const BOX = { feetY: 900, plankY: 400, startHeight: 870, endHeight: 160 };
  const distance = (t: number) => 1 / boardingTransform(t, BOX).scale; // a figure's size is 1 / its distance
  const steps = [0.25, 0.5, 0.75, 1].map((t, i, all) => distance(t) - distance(i ? all[i - 1] : 0));
  for (const step of steps) expect(step).toBeCloseTo(steps[0]);
  expect(boardingProgress((BOARD_FROM + BOARD_TO) / 2)).toBeCloseTo(0.5);
});
