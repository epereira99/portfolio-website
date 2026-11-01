import type { SegmentId } from "../timeline";
import { CITY_STYLE } from "./styles";

export type RoofKind = "gable" | "hip" | "stepped" | "flat";

export type HouseSpec = {
  along: number;
  x: number;
  z: number;
  heading: number;
  w: number;
  d: number;
  floors: number;
  floorHeight: number;
  roof: RoofKind;
  wall: string;
  roofColor: string;
  trim: string;
  azulejo: boolean;
};

/** Small deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed + 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Townscaper-like proportions per city (spec §6/§7).
const RULES: Partial<Record<SegmentId, { floors: [number, number]; maxW: number; roofs: RoofKind[] }>> = {
  braga: { floors: [1, 2], maxW: 2.6, roofs: ["hip", "gable"] },
  porto: { floors: [2, 4], maxW: 2.0, roofs: ["gable"] }, // narrow and tall, like the Ribeira
  jonkoping: { floors: [1, 2], maxW: 2.6, roofs: ["gable"] },
  stockholm: { floors: [3, 4], maxW: 2.6, roofs: ["stepped", "gable"] }, // Gamla Stan
};

const pick = <T,>(rand: () => number, items: T[]) => items[Math.floor(rand() * items.length)];
const between = (rand: () => number, lo: number, hi: number) => lo + rand() * (hi - lo);

export function houseSpec(
  rand: () => number,
  id: SegmentId,
  base: { along: number; x: number; z: number; heading: number },
): HouseSpec {
  const rule = RULES[id] ?? RULES.braga!;
  const style = CITY_STYLE[id];
  return {
    ...base,
    w: between(rand, 1.6, rule.maxW),
    d: between(rand, 1.6, 2.6),
    floors: rule.floors[0] + Math.floor(rand() * (rule.floors[1] - rule.floors[0] + 1)),
    floorHeight: 1.1,
    roof: pick(rand, rule.roofs),
    wall: pick(rand, style.walls),
    roofColor: pick(rand, style.roofs),
    trim: style.trim,
    azulejo: id === "porto" && rand() < 0.35,
  };
}
