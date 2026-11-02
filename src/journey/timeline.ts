import { projectsForStage } from "@/content/projects";
import type { StageId } from "@/content/stages";

export type SegmentId = StageId | "voyage";

// Length budget in screens (spec §6).
export const SEGMENTS: { id: SegmentId; screens: number }[] = [
  { id: "braga", screens: 1.5 },
  { id: "porto", screens: 2 },
  { id: "voyage", screens: 1.5 },
  { id: "jonkoping", screens: 2 },
  { id: "stockholm", screens: 2 }, // 1.5 + the ending (plan 3)
];

export const TOTAL_SCREENS = SEGMENTS.reduce((sum, s) => sum + s.screens, 0);
export const INTRO_END = 0.5;
export const ENDING_SCREENS = 0.5;
export const ENDING_START = TOTAL_SCREENS - ENDING_SCREENS;

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

export const CHAPTER_SCREENS = 0.33; // how long a stage's chapter title holds after entering it

/** Screens into a stage before its chapter title: Braga waits for the home intro. */
export function chapterDelay(id: StageId): number {
  return id === "braga" ? INTRO_END : 0;
}

/** The stage whose chapter is on screen: it stays for the whole stage, with its projects coming and going under it. */
export function chapterAt(s: number): StageId | null {
  if (s < INTRO_END || s >= ENDING_START) return null;
  const x = clamp(s);
  const id = segmentAt(x);
  return id === "voyage" || x < segmentStart(id) + chapterDelay(id) ? null : id;
}

export function stageProgress(s: number): number {
  const x = clamp(s);
  const id = segmentAt(x);
  const seg = SEGMENTS.find((g) => g.id === id)!;
  return Math.min((x - segmentStart(id)) / seg.screens, 1);
}

export type Overlay =
  | { kind: "intro" }
  | { kind: "chapter"; stage: StageId; t: number }
  | { kind: "project"; slug: string }
  | { kind: "ending"; t: number }
  | { kind: "none" };

export function overlayAt(s: number): Overlay {
  if (s < INTRO_END) return { kind: "intro" };
  if (s >= ENDING_START) return { kind: "ending", t: Math.min((s - ENDING_START) / ENDING_SCREENS, 1) };
  const x = clamp(s);
  const id = segmentAt(x);
  if (id === "voyage") return { kind: "none" };
  const chapterFrom = segmentStart(id) + chapterDelay(id);
  if (x < chapterFrom) return { kind: "none" };
  if (x - chapterFrom < CHAPTER_SCREENS) return { kind: "chapter", stage: id, t: (x - chapterFrom) / CHAPTER_SCREENS };
  const projects = projectsForStage(id);
  if (projects.length === 0) return { kind: "none" };
  const seg = SEGMENTS.find((g) => g.id === id)!;
  const from = chapterFrom + CHAPTER_SCREENS; // projects begin where the chapter title ends
  const until = Math.min(segmentStart(id) + seg.screens, ENDING_START); // Stockholm's projects end where the ending begins
  const slot = (until - from) / projects.length;
  const k = Math.floor((x - from) / slot);
  if (k < 0 || k >= projects.length) return { kind: "none" };
  const local = x - from - k * slot;
  return local >= 0.15 * slot && local < 0.85 * slot ? { kind: "project", slug: projects[k].slug } : { kind: "none" };
}
