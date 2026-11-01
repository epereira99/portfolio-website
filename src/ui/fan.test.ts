import { expect, test } from "vitest";
import { fanPositions } from "./fan";

test("six cards spread evenly left to right without overlapping", () => {
  const xs = fanPositions(6).map((p) => p.x);
  expect(xs).toEqual([-325, -195, -65, 65, 195, 325]);
  xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBeGreaterThanOrEqual(118));
});

test("cards follow an arc that peaks in the middle", () => {
  const ps = fanPositions(6);
  expect(ps[2].y).toBeLessThan(ps[0].y);
  expect(fanPositions(1)).toEqual([{ x: 0, y: -210 }]);
});
