import { PATH_LENGTH, pathPointExtended, pathTangent, type Vec3 } from "../path";
import type { SegmentId } from "../timeline";

export type LandmarkId = "arcada" | "bom-jesus" | "uminho" | "dom-luis" | "clerigos" | "jonkoping-university" | "stadshuset";

/** footprint.w runs along the path, footprint.d away from it. */
export type Landmark = {
  id: LandmarkId;
  segment: SegmentId;
  along: number;
  side: -1 | 1;
  offset: number;
  footprint: { w: number; d: number };
  url: string;
  forward?: number; // stands this far further along the (extended) path than `along`, which still drives its fade
};

const at = (id: LandmarkId, segment: SegmentId, along: number, side: -1 | 1, offset: number, w: number, d: number, forward?: number): Landmark => ({
  id,
  segment,
  along,
  side,
  offset,
  footprint: { w, d },
  url: `/models/landmarks/${id}.glb`,
  ...(forward ? { forward } : {}),
});

// In path order. Braga's and Jönköping's choices are Eduardo's (spec §6).
export const LANDMARKS: Landmark[] = [
  at("arcada", "braga", 12, 1, 9, 20, 6), // visible behind the home intro
  at("bom-jesus", "braga", 30, -1, 16, 22, 22),
  at("uminho", "braga", 48, 1, 11, 16, 10),
  at("clerigos", "porto", 88, -1, 11, 6, 6),
  at("dom-luis", "porto", 118, 1, 23, 6, 34), // spans the Douro, away from the path
  at("jonkoping-university", "jonkoping", 250, 1, 12, 18, 10),
  at("stadshuset", "stockholm", 340, 1, 8, 14, 8, 45), // on the horizon beyond the water: behind the walker in the final shot
];

export function landmarkPosition(l: Landmark): { position: Vec3; heading: number } {
  const where = l.along + (l.forward ?? 0);
  const [px, , pz] = pathPointExtended(where);
  const [tx, , tz] = pathTangent(Math.min(where, PATH_LENGTH));
  const len = Math.hypot(tx, tz);
  const [nx, nz] = [-tz / len, tx / len]; // the walker's right
  const position: Vec3 = [px + l.side * nx * l.offset, 0, pz + l.side * nz * l.offset];
  // Models face +Z; turn them to face the path.
  return { position, heading: Math.atan2(-l.side * nx, -l.side * nz) };
}
