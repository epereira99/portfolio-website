import { PATH_LENGTH, pathPointExtended, pathTangent } from "../path";
import type { SegmentId } from "../timeline";

export type WaterShape = { points: [number, number][] }; // xz polygon

/** A band of water beside the path: `lo`..`hi` units off it on `side` (−1 left, 1 right). */
function band(from: number, to: number, side: number, lo: number, hi: number): WaterShape {
  const inner: [number, number][] = [];
  const outer: [number, number][] = [];
  for (let d = from; d <= to + 1e-9; d += 2) {
    const [px, , pz] = pathPointExtended(d);
    const [tx, , tz] = pathTangent(Math.min(d, PATH_LENGTH));
    const len = Math.hypot(tx, tz);
    const [nx, nz] = [(-tz / len) * side, (tx / len) * side];
    inner.push([px + nx * lo, pz + nz * lo]);
    outer.push([px + nx * hi, pz + nz * hi]);
  }
  return { points: [...inner, ...outer.reverse()] };
}

// Water only where it is real (spec §7).
const SHAPES: Partial<Record<SegmentId, WaterShape[]>> = {
  porto: [band(70, 150, 1, 6, 40)], // the Douro, meeting the open sea
  voyage: [band(146, 194, 1, -40, 40)], // open sea, short of both shores
  jonkoping: [band(200, 280, -1, 5, 60)], // Lake Vättern
  stockholm: [band(280, 400, 1, 6, 20)], // water before the far shore where the City Hall stands
};

export function waterShapes(id: SegmentId): WaterShape[] {
  return SHAPES[id] ?? [];
}

/** Advances the wave clock; reduced motion keeps the water still. */
export function nextWaterTime(t: number, dt: number, reduced: boolean): number {
  return reduced ? 0 : t + dt;
}
