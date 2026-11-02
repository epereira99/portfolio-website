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

/** Moves the shown frame at most `max` frames toward the target, the short way round the loop. A smooth-scrolled
 * jump arrives as many small steps that never trip easeProgress's snap, so this keeps the walk from strobing. */
export function stepFrame(shown: number, target: number, max = 3): number {
  let delta = (target - shown) % WALK_FRAMES;
  if (delta > WALK_FRAMES / 2) delta -= WALK_FRAMES;
  if (delta < -WALK_FRAMES / 2) delta += WALK_FRAMES;
  const step = Math.max(-max, Math.min(max, delta));
  return (shown + step + WALK_FRAMES) % WALK_FRAMES;
}
