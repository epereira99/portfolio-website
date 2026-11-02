import { ENDING_START } from "../timeline";

// The walk loop: frames 61–199 of the source video (tools/walk/make-walk.sh).
export const WALK_FRAMES = 139;
export const FRAMES_PER_SCREEN = 90;

/** Frame for a journey position. Driven by distance, so walking back plays it in reverse; he stops at the ending. */
export function walkFrame(s: number): number {
  const f = Math.floor(Math.min(s, ENDING_START) * FRAMES_PER_SCREEN) % WALK_FRAMES;
  return (f + WALK_FRAMES) % WALK_FRAMES;
}

export function walkFrameUrl(i: number): string {
  return `/walk/walk-${String(i).padStart(3, "0")}.webp`;
}

/** One frame of smoothing toward the scroll position; big jumps (header clicks, reloads) snap instead of spinning the walk. */
export function easeProgress(current: number, target: number): number {
  const gap = Math.abs(target - current);
  return gap > 1 || gap < 0.0005 ? target : current + (target - current) * 0.12;
}
