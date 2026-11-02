import { segmentStart } from "../timeline";

// Boarding the nau: as he reaches the ship he walks up its gangplank into the painting, then the map takes over.
// He walks at a steady pace (his distance grows linearly with scroll) so his steps match the ground he covers.

/** Journey positions (screens) where boarding starts and where he is halfway up, just as the map fades in. */
export const BOARD_FROM = segmentStart("voyage") - 0.35; // the ship is fully in view by here
export const BOARD_TO = segmentStart("voyage") + 0.3;
/** By here the map covers the whole screen, so he is quietly put back to full size for the walk out in Jönköping. */
export const BOARDED = segmentStart("voyage") + 0.46;

// Measured on art/memories/nau.png (square): halfway up the gangplank, just past the quay edge, and a person's
// height standing there (1.6× the gangplank's width at that point).
const PLANK = { x: 0.502, y: 0.62 };
export const END_PERSON = 0.18;

export function boardingProgress(s: number): number {
  if (s >= BOARDED) return 0;
  return Math.min(Math.max((s - BOARD_FROM) / (BOARD_TO - BOARD_FROM), 0), 1);
}

/** Halfway up the gangplank on screen, for the ship's current box (the square painting fills it with background-size: cover). */
export function plankPoint(box: { left: number; top: number; width: number; height: number }): { x: number; y: number } {
  const size = Math.max(box.width, box.height);
  return { x: box.left + box.width / 2 + (PLANK.x - 0.5) * size, y: box.top + box.height / 2 + (PLANK.y - 0.5) * size };
}

/**
 * Walker offset (px, from his feet) and scale at boarding progress t. Shrinking follows perspective, and his feet
 * travel with it, so they stay on the gangplank as it recedes.
 */
export function boardingTransform(
  t: number,
  { feetY, plankY, startHeight, endHeight }: { feetY: number; plankY: number; startHeight: number; endHeight: number },
): { ty: number; scale: number } {
  if (t <= 0) return { ty: 0, scale: 1 };
  const end = endHeight / startHeight;
  const scale = 1 / (1 + t * (1 / end - 1)); // size is 1 / distance, and distance grows steadily
  return { ty: (plankY - feetY) * ((1 - scale) / (1 - end)), scale };
}
