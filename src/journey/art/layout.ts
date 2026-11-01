import { UNITS_PER_SCREEN, pathPoint, pathTangent } from "../path";
import { SEGMENTS, segmentStart, type SegmentId } from "../timeline";
import { houseSpec, rng, type HouseSpec } from "./houses";
import { LANDMARKS } from "./landmarks";
import { CITY_STYLE } from "./styles";

export type TreeSpec = { along: number; x: number; z: number; kind: "round" | "pine"; size: number; snow: boolean };
export type LampSpec = { along: number; x: number; z: number; glow: boolean };
export type CityLayout = { houses: HouseSpec[]; trees: TreeSpec[]; lamps: LampSpec[] };

const ROW_FRONT: [number, number][] = [
  [3.6, 4.6], // first row's front, from the path centre
  [8.4, 9.4], // second row, behind it
];

/** Spots nothing may be built on, by path distance and side (0 = both sides). */
const KEEP_CLEAR: { id: SegmentId; from: number; to: number; side: -1 | 0 | 1 }[] = [
  { id: "porto", from: 130, to: 150, side: 1 }, // the nau's mooring and gangplank
  { id: "jonkoping", from: 203, to: 209, side: 0 }, // the welcome banner
  { id: "stockholm", from: 334, to: Infinity, side: 0 }, // the quay and the unbuilt path ahead
];

function frame(along: number) {
  const [px, , pz] = pathPoint(along);
  const [tx, , tz] = pathTangent(along);
  const len = Math.hypot(tx, tz);
  return { px, pz, nx: -tz / len, nz: tx / len }; // n = the walker's right
}

function blocked(id: SegmentId, along: number, halfW: number, side: -1 | 1, lateral: number, halfD: number) {
  for (const l of LANDMARKS) {
    if (Math.abs(along - (l.along + (l.forward ?? 0))) < l.footprint.w / 2 + halfW + 1 && side === l.side && Math.abs(lateral - l.offset) < l.footprint.d / 2 + halfD + 1)
      return true;
  }
  return KEEP_CLEAR.some((k) => k.id === id && along + halfW > k.from && along - halfW < k.to && (k.side === 0 || k.side === side));
}

export function cityLayout(id: SegmentId): CityLayout {
  const style = CITY_STYLE[id];
  if (style.water === 0) return { houses: [], trees: [], lamps: [] };
  const seg = SEGMENTS.find((s) => s.id === id)!;
  const from = segmentStart(id) * UNITS_PER_SCREEN;
  const to = from + seg.screens * UNITS_PER_SCREEN;
  const rand = rng(SEGMENTS.indexOf(seg) + 1);
  const sides = ([-1, 1] as const).filter((side) => side !== style.water);

  const houses: HouseSpec[] = [];
  for (const side of sides) {
    for (const [lo, hi] of ROW_FRONT) {
      let cursor = from + 1 + rand() * 2;
      while (cursor < to - 2) {
        const probe = houseSpec(rand, id, { along: 0, x: 0, z: 0, heading: 0 });
        const along = cursor + probe.w / 2;
        const lateral = lo + rand() * (hi - lo) + probe.d / 2;
        cursor += probe.w + 0.2 + rand() * 0.6;
        if (along > to - 1 || blocked(id, along, probe.w / 2, side, lateral, probe.d / 2)) continue;
        const { px, pz, nx, nz } = frame(along);
        houses.push({
          ...probe,
          along,
          x: px + side * nx * lateral,
          z: pz + side * nz * lateral,
          heading: Math.atan2(-side * nx, -side * nz), // front faces the path
        });
      }
    }
  }

  const trees: TreeSpec[] = [];
  const pine = id === "jonkoping";
  for (let along = from + 2; along < to - 2; along += 3 + rand() * 4) {
    const side = sides[Math.floor(rand() * sides.length)];
    const lateral = 13 + rand() * 6;
    const size = pine ? 0.9 + rand() * 0.6 : 0.8 + rand() * 0.5;
    if (blocked(id, along, size, side, lateral, size)) continue;
    const { px, pz, nx, nz } = frame(along);
    trees.push({ along, x: px + side * nx * lateral, z: pz + side * nz * lateral, kind: pine ? "pine" : "round", size, snow: pine });
  }

  const lamps: LampSpec[] = [];
  if (id === "porto" || id === "stockholm") {
    for (let along = from + 4; along < to - 2; along += 8) {
      const side = sides[0];
      if (blocked(id, along, 0.3, side, 3.2, 0.3)) continue;
      const { px, pz, nx, nz } = frame(along);
      lamps.push({ along, x: px + side * nx * 3.2, z: pz + side * nz * 3.2, glow: id === "stockholm" });
    }
  }

  return { houses, trees, lamps };
}
