import { ENDING_START } from "../timeline";

// The walk loop: frames 61–199 of the source video (tools/walk/make-walk.sh).
export const WALK_FRAMES = 139;
export const FRAMES_PER_SCREEN = 90;

/** A walk loop: where its frames live, how many, and how many play per journey screen (his pace over the ground). */
export type Walk = { dir: string; frames: number; perScreen: number };
export const WALK: Walk = { dir: "walk", frames: WALK_FRAMES, perScreen: FRAMES_PER_SCREEN };
// One gait cycle of the Seedance video (tools/walk/make-walk-cartoon.sh): 32 frames against the painted walk's ≈36 per
// cycle, so 80 a screen keeps his steps in time with the ground.
export const CARTOON_WALK: Walk = { dir: "walk-cartoon", frames: 32, perScreen: 80 };

/** Frame for a journey position. Driven by distance, so walking back plays it in reverse; he stops at the ending. */
export function walkFrame(s: number, walk: Walk = WALK): number {
  const f = Math.floor(Math.min(s, ENDING_START) * walk.perScreen) % walk.frames;
  return (f + walk.frames) % walk.frames;
}

export function walkFrameUrl(i: number, walk: Walk = WALK): string {
  return `/${walk.dir}/walk-${String(i).padStart(3, "0")}.webp`;
}

/** Moves the shown frame at most `max` frames toward the target, the short way round the loop. A smooth-scrolled
 * jump arrives as many small steps that never trip easeProgress's snap, so this keeps the walk from strobing. */
export function stepFrame(shown: number, target: number, max = 3, frames = WALK_FRAMES): number {
  let delta = (target - shown) % frames;
  if (delta > frames / 2) delta -= frames;
  if (delta < -frames / 2) delta += frames;
  const step = Math.max(-max, Math.min(max, delta));
  return (shown + step + frames) % frames;
}
