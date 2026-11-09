import { STORIES } from "@/content/stories";
import { shownProjects } from "./beats";
import type { StageId } from "@/content/stages";

export type SegmentId = StageId;

// Length budget in screens (spec §6).
export const SEGMENTS: { id: SegmentId; screens: number }[] = [
  { id: "braga", screens: 1.5 },
  { id: "porto", screens: 3 }, // Porto and Jönköping have the most story to tell (content/stories.ts)
  { id: "jonkoping", screens: 3 },
  { id: "stockholm", screens: 1.5 },
  { id: "personal", screens: 2 }, // 1.5 + the ending
];

export const TOTAL_SCREENS = SEGMENTS.reduce((sum, s) => sum + s.screens, 0);
export const INTRO_END = 0.5;
const ENDING_SCREENS = 0.5;
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
  return x < segmentStart(id) + chapterDelay(id) ? null : id;
}

export type Overlay =
  | { kind: "intro" }
  | { kind: "chapter"; stage: StageId; t: number }
  | { kind: "project"; slugs: string[] }
  | { kind: "ending"; t: number }
  | { kind: "none" };

export function overlayAt(s: number): Overlay {
  if (s < INTRO_END) return { kind: "intro" };
  if (s >= ENDING_START) return { kind: "ending", t: Math.min((s - ENDING_START) / ENDING_SCREENS, 1) };
  const x = clamp(s);
  const id = segmentAt(x);
  const chapterFrom = segmentStart(id) + chapterDelay(id);
  if (x < chapterFrom) return { kind: "none" };
  if (x - chapterFrom < CHAPTER_SCREENS) return { kind: "chapter", stage: id, t: (x - chapterFrom) / CHAPTER_SCREENS };
  // Projects come in with the line of the story that mentions them (content/stories.ts).
  const slugs = shownProjects(STORIES[id], chapterProgress(x));
  return slugs.length ? { kind: "project", slugs } : { kind: "none" };
}

/** How far through its chapter's time on screen the journey is (0–1): Braga's chapter starts after the intro. */
export function chapterProgress(s: number): number {
  const x = clamp(s);
  const id = segmentAt(x);
  const start = segmentStart(id) + chapterDelay(id);
  const seg = SEGMENTS.find((g) => g.id === id)!;
  return Math.min(Math.max((x - start) / (seg.screens - chapterDelay(id)), 0), 1);
}
