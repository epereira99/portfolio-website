// Corner-based (Wang) autotiling over the sets in art/tilesets.json.

const GROUND = ["grass", "dry"]; // what a corner outside a set's pair falls back to

/**
 * The terrain gid (firstgid 1) for a cell from its corner terrains [NW, NE, SW, SE].
 * Uses the set covering the most corners (earliest set on a tie); other corners count as its ground side.
 */
export function pickTile(corners, sets) {
  let best = sets[0], bestCount = -1;
  for (const s of sets) {
    const count = corners.filter((c) => c === s.lower || c === s.upper).length;
    if (count > bestCount) [best, bestCount] = [s, count];
  }
  const ground = GROUND.includes(best.lower) ? "lower" : "upper";
  const sides = corners.map((c) => (c === best.lower ? "lower" : c === best.upper ? "upper" : ground));
  const tile = best.tiles.find((t) => t.corners.every((c, i) => c === sides[i]));
  if (!tile) throw new Error(`no tile in ${best.lower}-${best.upper} for ${sides}`);
  return best.row * 16 + tile.index + 1;
}
