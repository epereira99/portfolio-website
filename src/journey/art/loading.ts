import { SEGMENTS, segmentAt } from "../timeline";
import { LANDMARKS, type LandmarkId } from "./landmarks";

/** Landmarks to load at s: the current segment's and the next segment's (spec §10), in path order. */
export function landmarksToLoad(s: number): LandmarkId[] {
  const i = SEGMENTS.findIndex((g) => g.id === segmentAt(s));
  const wanted = new Set([SEGMENTS[i].id, SEGMENTS[i + 1]?.id]);
  return LANDMARKS.filter((l) => wanted.has(l.segment)).map((l) => l.id);
}
