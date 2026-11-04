import { easeProgress } from "../progress";
import { segmentAt, segmentStart } from "../timeline";
import { STRIDE_UNITS, distanceAt } from "./path";

/** One frame toward the scroll position. Reduced motion skips the walk: the scene holds at the stage's start. */
export function nextPosition(shown: number, target: number, reducedMotion: boolean): number {
  return reducedMotion ? segmentStart(segmentAt(target)) : easeProgress(shown, target);
}

/** Where in the Walk loop he is (0–1), by distance, so walking back plays it in reverse. */
export function walkTime(s: number): number {
  return (((distanceAt(s) / STRIDE_UNITS) % 1) + 1) % 1;
}
