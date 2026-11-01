import { projectsForStage } from "@/content/projects";
import type { StageId } from "@/content/stages";

export type SegmentId = StageId | "voyage";

// Length budget in screens (spec §6).
export const SEGMENTS: { id: SegmentId; screens: number }[] = [
  { id: "braga", screens: 1.5 },
  { id: "porto", screens: 2 },
  { id: "voyage", screens: 1.5 },
  { id: "jonkoping", screens: 2 },
  { id: "stockholm", screens: 1.5 },
];

export const TOTAL_SCREENS = SEGMENTS.reduce((sum, s) => sum + s.screens, 0);
export const INTRO_END = 0.5;

const clamp = (s: number) => Math.min(Math.max(s, 0), TOTAL_SCREENS);

export function segmentStart(id: SegmentId): number {
  let start = 0;
  for (const seg of SEGMENTS) {
    if (seg.id === id) return start;
    start += seg.screens;
  }
  throw new Error(`unknown segment ${id}`);
}

export function segmentAt(s: number): SegmentId {
  const x = clamp(s);
  let start = 0;
  for (const seg of SEGMENTS) {
    if (x < start + seg.screens) return seg.id;
    start += seg.screens;
  }
  return SEGMENTS[SEGMENTS.length - 1].id;
}

export type Overlay = { kind: "intro" } | { kind: "project"; slug: string } | { kind: "none" };

export function overlayAt(s: number): Overlay {
  if (s < INTRO_END) return { kind: "intro" };
  const x = clamp(s);
  const id = segmentAt(x);
  if (id === "voyage") return { kind: "none" };
  const projects = projectsForStage(id);
  if (projects.length === 0) return { kind: "none" };
  const seg = SEGMENTS.find((g) => g.id === id)!;
  const from = segmentStart(id) + (id === "braga" ? INTRO_END : 0.25);
  const slot = (segmentStart(id) + seg.screens - from) / projects.length;
  const k = Math.floor((x - from) / slot);
  if (k < 0 || k >= projects.length) return { kind: "none" };
  const local = x - from - k * slot;
  return local >= 0.15 * slot && local < 0.85 * slot ? { kind: "project", slug: projects[k].slug } : { kind: "none" };
}
