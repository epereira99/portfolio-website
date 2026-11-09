import { expect, test } from "vitest";
import { segmentAt, segmentStart } from "../timeline";
import { nextPosition, walkTime } from "./rig";

test("a big jump (header click, reload) snaps instead of walking there", () => {
  expect(nextPosition(0, 5, false)).toBe(5);
});

test("small scrolls ease toward the target", () => {
  const p = nextPosition(2, 2.1, false);
  expect(p).toBeGreaterThan(2);
  expect(p).toBeLessThan(2.1);
});

test("reduced motion holds at the start of the current stage", () => {
  expect(nextPosition(0, 3.3, true)).toBe(segmentStart(segmentAt(3.3)));
});

test("the walk cycle follows distance and stays inside one loop", () => {
  expect(walkTime(-1)).toBe(0);
  for (let s = 0; s <= 10; s += 0.05) {
    expect(walkTime(s)).toBeGreaterThanOrEqual(0);
    expect(walkTime(s)).toBeLessThan(1);
  }
});
