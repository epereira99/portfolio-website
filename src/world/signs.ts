import type { Tile } from "./grid";

const RANGE = 2; // steps: close enough that a sign reads itself, no A press needed

/** The text of the nearest sign within RANGE steps of `at`, or null. */
export function signNear(at: Tile, signs: { tile: Tile; text: string }[]): string | null {
  let text: string | null = null;
  let best = RANGE + 1;
  for (const s of signs) {
    const d = Math.abs(s.tile.x - at.x) + Math.abs(s.tile.y - at.y);
    if (d < best) [text, best] = [s.text, d];
  }
  return text;
}
