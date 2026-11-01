import { describe, expect, test } from "vitest";
import { QUAY_END, pathPoint, pathTangent } from "../path";
import type { SegmentId } from "../timeline";
import { nauPose } from "../voyage/poses";
import { nextWaterTime, waterShapes, type WaterShape } from "./water";

const ALL: SegmentId[] = ["braga", "porto", "voyage", "jonkoping", "stockholm"];
const shapes = ALL.flatMap(waterShapes);

function inside([x, z]: [number, number], { points }: WaterShape) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, zi] = points[i];
    const [xj, zj] = points[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
}
const wet = (p: [number, number]) => shapes.some((s) => inside(p, s));

describe("waterShapes", () => {
  test("water only where it is real", () => {
    expect(waterShapes("braga")).toEqual([]);
    for (const id of ["porto", "voyage", "jonkoping", "stockholm"] as const) expect(waterShapes(id).length).toBeGreaterThan(0);
  });

  test("the walkway is always dry where you walk", () => {
    for (let d = 0; d <= QUAY_END; d += 1) {
      if (d > 140 && d < 200) continue; // the voyage: you're on the ship, then the map
      const [px, , pz] = pathPoint(d);
      const [tx, , tz] = pathTangent(d);
      const len = Math.hypot(tx, tz);
      for (const k of [-2.5, 0, 2.5]) expect(wet([px - (tz / len) * k, pz + (tx / len) * k]), `d=${d} k=${k}`).toBe(false);
    }
  });

  test("the nau floats on the Douro", () => {
    const [x, , z] = nauPose(3.0).position;
    expect(waterShapes("porto").some((s) => inside([x, z], s))).toBe(true);
  });

  test("the welcome banner and the quay stand on dry ground", () => {
    const [bx, , bz] = pathPoint(206);
    const [tx, , tz] = pathTangent(206);
    const len = Math.hypot(tx, tz);
    for (const k of [-3.2, 3.2]) expect(wet([bx - (tz / len) * k, bz + (tx / len) * k])).toBe(false);
    const [qx, , qz] = pathPoint(QUAY_END);
    expect(wet([qx, qz])).toBe(false);
  });
});

describe("nextWaterTime", () => {
  test("waves move normally, and freeze for reduced motion", () => {
    expect(nextWaterTime(1, 0.5, false)).toBe(1.5);
    expect(nextWaterTime(1, 0.5, true)).toBe(0);
    expect(nextWaterTime(0, 0.5, true)).toBe(0);
  });
});
