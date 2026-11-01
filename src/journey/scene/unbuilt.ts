import { QUAY_END, pathPointExtended, type Vec3 } from "../path";
import { headingAt } from "../voyage/poses";

export type Tile = { along: number; position: Vec3; heading: number; opacity: number };

/** The next chapter's path: tiles laid out past the quay, fading into the distance. */
export function unbuiltTiles(count = 14): Tile[] {
  return Array.from({ length: count }, (_, k) => {
    const along = QUAY_END + 1.5 + 2 * k;
    const [x, , z] = pathPointExtended(along);
    return { along, position: [x, 0.02, z], heading: headingAt(Math.min(along, QUAY_END)), opacity: 0.85 * (1 - k / count) ** 2 };
  });
}
