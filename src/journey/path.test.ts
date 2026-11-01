import { describe, expect, test } from "vitest";
import { PATH_LENGTH, cameraPose, distanceAt, pathPoint, walkClipTime } from "./path";

describe("path", () => {
  test("starts at the origin and is 360 units long", () => {
    expect(PATH_LENGTH).toBe(360);
    pathPoint(0).forEach((v) => expect(v).toBeCloseTo(0, 5));
  });

  test("stays flat, heads into the screen and keeps gentle bends", () => {
    let prevZ = Infinity;
    for (let d = 0; d <= 360; d += 10) {
      const [x, y, z] = pathPoint(d);
      expect(y).toBe(0);
      expect(z).toBeLessThanOrEqual(prevZ);
      expect(Math.abs(x)).toBeLessThanOrEqual(7);
      prevZ = z;
    }
  });

  test("distanceAt clamps to the walk", () => {
    expect(distanceAt(-1)).toBe(0);
    expect(distanceAt(100)).toBe(360);
  });

  test("camera sits above and behind the walker", () => {
    const { position } = cameraPose(0);
    expect(position[1]).toBeCloseTo(3, 5);
    expect(position[2]).toBeGreaterThan(0);
  });
});

describe("walkClipTime", () => {
  test("advances one clip per stride, also when walking back", () => {
    expect(walkClipTime(0.8, 1.6, 1)).toBeCloseTo(0.5);
    expect(walkClipTime(-0.8, 1.6, 1)).toBeCloseTo(0.5);
    expect(walkClipTime(3.2, 1.6, 2)).toBeCloseTo(0);
  });
});
