import { describe, expect, test } from "vitest";
import { voyageState } from "./phase";

const expectState = (s: number, want: Partial<ReturnType<typeof voyageState>>) => {
  const got = voyageState(s);
  if (want.phase) expect(got.phase).toBe(want.phase);
  for (const k of ["t", "mapOpacity", "routeProgress"] as const) {
    if (want[k] !== undefined) expect(got[k]).toBeCloseTo(want[k]!, 6);
  }
};

describe("voyageState", () => {
  test("is idle before the voyage", () => {
    expect(voyageState(3.4)).toEqual({ phase: "before", t: 0, mapOpacity: 0, routeProgress: 0 });
  });

  test("boards the nau first", () => {
    expectState(3.5, { phase: "board", t: 0, mapOpacity: 0 });
    expectState(3.6125, { phase: "board", t: 0.5 });
  });

  test("fades the map in while the camera lifts out", () => {
    expectState(3.8375, { phase: "liftOut", t: 0.5, mapOpacity: 0.25 });
  });

  test("draws the route with scroll while sailing", () => {
    expectState(3.95, { phase: "sail", t: 0, mapOpacity: 1, routeProgress: 0 });
    expectState(4.325, { phase: "sail", t: 0.5, mapOpacity: 1, routeProgress: 0.5 });
  });

  test("fades the map out while diving into Jönköping", () => {
    expectState(4.7, { phase: "diveIn", t: 0, mapOpacity: 1 });
    expectState(4.85, { phase: "diveIn", t: 0.5, mapOpacity: 0 });
  });

  test("leaves no map behind once past the voyage", () => {
    for (const s of [5, 7]) expectState(s, { phase: "after", mapOpacity: 0, routeProgress: 1 });
  });
});
