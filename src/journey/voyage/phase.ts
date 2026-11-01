import { SEGMENTS, segmentStart } from "../timeline";

export type VoyagePhase = "before" | "board" | "liftOut" | "sail" | "diveIn" | "after";
export type VoyageState = { phase: VoyagePhase; t: number; mapOpacity: number; routeProgress: number };

const START = segmentStart("voyage");
const LENGTH = SEGMENTS.find((s) => s.id === "voyage")!.screens;

// Phase windows in voyage-local progress v ∈ [0, 1).
const WINDOWS: [VoyagePhase, number, number][] = [
  ["board", 0, 0.15],
  ["liftOut", 0.15, 0.3],
  ["sail", 0.3, 0.8],
  ["diveIn", 0.8, 1],
];

const ramp = (v: number, from: number, to: number) => Math.min(Math.max((v - from) / (to - from), 0), 1);

export function voyageState(s: number): VoyageState {
  const v = (s - START) / LENGTH;
  const mapOpacity = v < 0.8 ? ramp(v, 0.2, 0.3) : 1 - ramp(v, 0.8, 0.9);
  const routeProgress = ramp(v, 0.3, 0.8);
  if (v < 0) return { phase: "before", t: 0, mapOpacity: 0, routeProgress: 0 };
  for (const [phase, from, to] of WINDOWS) {
    if (v < to) return { phase, t: (v - from) / (to - from), mapOpacity, routeProgress };
  }
  return { phase: "after", t: 0, mapOpacity: 0, routeProgress: 1 };
}
