// Development stand-ins for the cities (plan 4 replaces them with real art).
import { SEGMENTS, segmentStart, type SegmentId } from "../timeline";
import { UNITS_PER_SCREEN, pathPoint, pathTangent } from "../path";

export type Block = { along: number; x: number; z: number; w: number; h: number; d: number; color: string };
export type Water = { x: number; z: number; w: number; d: number };

// Water side relative to the walker: -1 left, 1 right, 0 both (open sea), null none (spec §7).
const STYLE: Record<SegmentId, { sky: string; colors: string[]; water: -1 | 0 | 1 | null }> = {
  braga: { sky: "#f6d7a7", colors: ["#efe3cc", "#d9cdb8", "#c8b9a0", "#f2d9b0"], water: null },
  porto: { sky: "#f3a46b", colors: ["#e9774a", "#f4ead6", "#5b8fc9", "#f2c38b"], water: 1 },
  voyage: { sky: "#8fb8d8", colors: [], water: 0 },
  jonkoping: { sky: "#bcd3e6", colors: ["#b23a2e", "#f4f1ea", "#9c2f25"], water: -1 },
  stockholm: { sky: "#2b3555", colors: ["#d9a441", "#b5562f", "#e7c27d"], water: 1 },
};

function rng(seed: number) {
  let a = seed + 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalAt(d: number): [number, number] {
  const [tx, , tz] = pathTangent(d);
  const len = Math.hypot(tx, tz);
  return [-tz / len, tx / len]; // points to the walker's right
}

export function standInBlocks(id: SegmentId): { blocks: Block[]; water: Water | null; sky: string } {
  const style = STYLE[id];
  const seg = SEGMENTS.find((s) => s.id === id)!;
  const from = segmentStart(id) * UNITS_PER_SCREEN;
  const to = from + seg.screens * UNITS_PER_SCREEN;
  const rand = rng(SEGMENTS.indexOf(seg));

  const blocks: Block[] = [];
  if (style.water !== 0) {
    for (let along = from + 2; along <= to - 2; along += 4) {
      for (const side of [-1, 1]) {
        if (side === style.water) continue;
        const [px, , pz] = pathPoint(along);
        const [nx, nz] = normalAt(along);
        const offset = 4 + rand() * 6;
        blocks.push({
          along,
          x: px + side * nx * offset,
          z: pz + side * nz * offset,
          w: 1.5 + rand() * 1.5,
          h: 1.5 + rand() * 3.5,
          d: 1.5 + rand() * 1.5,
          color: style.colors[Math.floor(rand() * style.colors.length)],
        });
      }
    }
  }

  let water: Water | null = null;
  if (style.water !== null) {
    const [px, , pz] = pathPoint((from + to) / 2);
    const width = style.water === 0 ? 80 : 20;
    water = { x: px + style.water * 16, z: pz, w: width, d: to - from + 20 };
  }

  return { blocks, water, sky: style.sky };
}
