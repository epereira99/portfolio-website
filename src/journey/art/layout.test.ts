import { describe, expect, test } from "vitest";
import { PATH_LENGTH, pathPoint, pathTangent, type Vec3 } from "../path";
import type { SegmentId } from "../timeline";
import { voyageState } from "../voyage/phase";
import { avatarPose, cameraPoseAt } from "../voyage/poses";
import type { HouseSpec } from "./houses";
import { LANDMARKS } from "./landmarks";
import { cityLayout } from "./layout";
import { CITY_STYLE } from "./styles";

const CITIES: SegmentId[] = ["braga", "porto", "jonkoping", "stockholm"];
const SAMPLES = Array.from({ length: Math.ceil(PATH_LENGTH) + 1 }, (_, d) => pathPoint(d));
const distToPath = (x: number, z: number) => Math.min(...SAMPLES.map(([px, , pz]) => Math.hypot(x - px, z - pz)));

/** Signed lateral offset of a point from the path at `along` (positive = walker's right). */
function lateral(along: number, x: number, z: number) {
  const [px, , pz] = pathPoint(along);
  const [tx, , tz] = pathTangent(along);
  const len = Math.hypot(tx, tz);
  return (x - px) * (-tz / len) + (z - pz) * (tx / len);
}

/** World-space axis-aligned box of a house (rotated footprint, roof included). */
function box(h: HouseSpec): [Vec3, Vec3] {
  const [c, s] = [Math.abs(Math.cos(h.heading)), Math.abs(Math.sin(h.heading))];
  const hx = (h.w * c + h.d * s) / 2;
  const hz = (h.w * s + h.d * c) / 2;
  return [
    [h.x - hx, 0, h.z - hz],
    [h.x + hx, h.floors * h.floorHeight + 1.2, h.z + hz],
  ];
}

function segmentHitsBox(a: Vec3, b: Vec3, [min, max]: [Vec3, Vec3]) {
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 3; i++) {
    const d = b[i] - a[i];
    if (Math.abs(d) < 1e-9) {
      if (a[i] < min[i] || a[i] > max[i]) return false;
      continue;
    }
    let [near, far] = [(min[i] - a[i]) / d, (max[i] - a[i]) / d];
    if (near > far) [near, far] = [far, near];
    t0 = Math.max(t0, near);
    t1 = Math.min(t1, far);
    if (t0 > t1) return false;
  }
  return true;
}

describe("cityLayout", () => {
  test.each(CITIES)("%s keeps the walkway clear", (id) => {
    const { houses, trees, lamps } = cityLayout(id);
    expect(houses.length).toBeGreaterThan(10);
    for (const h of houses) expect(distToPath(h.x, h.z) - Math.max(h.w, h.d) / 2).toBeGreaterThanOrEqual(3);
    for (const t of trees) expect(distToPath(t.x, t.z) - t.size).toBeGreaterThanOrEqual(3);
    for (const l of lamps) expect(distToPath(l.x, l.z)).toBeGreaterThanOrEqual(3);
  });

  test.each(CITIES)("%s builds nothing on its water side", (id) => {
    const side = CITY_STYLE[id].water;
    for (const h of cityLayout(id).houses) {
      if (side === -1 || side === 1) expect(Math.sign(lateral(h.along, h.x, h.z))).not.toBe(side);
    }
  });

  test.each(CITIES)("%s houses in a row never overlap", (id) => {
    const houses = cityLayout(id).houses;
    for (let i = 0; i < houses.length; i++) {
      for (let j = i + 1; j < houses.length; j++) {
        const [a, b] = [houses[i], houses[j]];
        const sameRow = Math.abs(lateral(a.along, a.x, a.z) - lateral(b.along, b.x, b.z)) < 1.2;
        if (sameRow && Math.abs(a.along - b.along) < 6) {
          expect(Math.abs(a.along - b.along)).toBeGreaterThanOrEqual((a.w + b.w) / 2 + 0.1);
        }
      }
    }
  });

  test("nothing stands in a landmark's footprint, the nau's mooring, the banner or the quay", () => {
    for (const id of CITIES) {
      for (const h of cityLayout(id).houses) {
        const off = lateral(h.along, h.x, h.z);
        for (const l of LANDMARKS) {
          const alongHit = Math.abs(h.along - l.along) < l.footprint.w / 2 + h.w / 2;
          const sideHit = Math.sign(off) === l.side && Math.abs(Math.abs(off) - l.offset) < l.footprint.d / 2 + h.d / 2;
          expect(alongHit && sideHit, `${id} house at ${h.along.toFixed(1)} vs ${l.id}`).toBe(false);
        }
        if (id === "porto") expect(h.along > 130 && h.along < 150 && off > 0).toBe(false);
        if (id === "jonkoping") expect(h.along > 203 && h.along < 209).toBe(false);
        if (id === "stockholm") expect(h.along).toBeLessThan(334);
      }
    }
  });

  test("never blocks the camera's view of the avatar", () => {
    const boxes = CITIES.flatMap((id) => cityLayout(id).houses.map(box));
    for (let s = 0; s <= 9; s += 0.05) {
      const { phase } = voyageState(s);
      if (phase === "sail" || phase === "diveIn") continue;
      const cam = cameraPoseAt(s).position;
      const [x, y, z] = avatarPose(s).position;
      const head: Vec3 = [x, y + 1.6, z];
      for (const b of boxes) expect(segmentHitsBox(cam, head, b), `blocked at s=${s.toFixed(2)}`).toBe(false);
    }
  });

  test("the voyage has no city, and layouts are deterministic", () => {
    expect(cityLayout("voyage")).toEqual({ houses: [], trees: [], lamps: [] });
    expect(cityLayout("porto")).toEqual(cityLayout("porto"));
  });
});
