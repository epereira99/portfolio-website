// Boarding the nau: as he reaches the ship he walks up its gangplank into the painting, then the map takes over.

/** Journey positions (screens) where boarding starts and where his feet reach the deck, just as the map fades in. */
export const BOARD_FROM = 3.45;
export const BOARD_TO = 3.8;

// Measured on art/memories/nau.png (square): where the gangplank meets the deck, and a person's height on that deck.
const PLANK = { x: 0.502, y: 0.466 };
export const DECK_PERSON = 0.075;

export function boardingProgress(s: number): number {
  const t = Math.min(Math.max((s - BOARD_FROM) / (BOARD_TO - BOARD_FROM), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Top of the gangplank on screen, for the ship's current box (the square painting fills it with background-size: cover). */
export function plankPoint(box: { left: number; top: number; width: number; height: number }): { x: number; y: number } {
  const size = Math.max(box.width, box.height);
  return { x: box.left + box.width / 2 + (PLANK.x - 0.5) * size, y: box.top + box.height / 2 + (PLANK.y - 0.5) * size };
}

/**
 * Walker offset (px, from his feet) and scale at boarding progress t. Shrinking follows perspective (1/distance), and
 * his feet travel with it, so they stay on the gangplank as it recedes.
 */
export function boardingTransform(
  t: number,
  { feetY, plankY, startHeight, endHeight }: { feetY: number; plankY: number; startHeight: number; endHeight: number },
): { ty: number; scale: number } {
  if (t <= 0) return { ty: 0, scale: 1 };
  const end = endHeight / startHeight;
  const scale = 1 / (1 + t * (1 / end - 1));
  return { ty: (plankY - feetY) * ((1 - scale) / (1 - end)), scale };
}
