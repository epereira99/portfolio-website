import { expect, test } from "vitest";
import { QUAY_END, pathPointExtended } from "../path";
import { unbuiltTiles } from "./unbuilt";

test("the unbuilt path starts past the quay and fades out ahead", () => {
  const tiles = unbuiltTiles();
  expect(tiles).toHaveLength(14);
  tiles.forEach((tile) => {
    expect(tile.along).toBeGreaterThan(QUAY_END);
    const [x, , z] = pathPointExtended(tile.along);
    expect(tile.position[0]).toBeCloseTo(x);
    expect(tile.position[2]).toBeCloseTo(z);
  });
  tiles.slice(1).forEach((tile, i) => expect(tile.opacity).toBeLessThan(tiles[i].opacity));
  expect(tiles[0].opacity).toBeGreaterThan(0.7);
  expect(tiles.at(-1)!.opacity).toBeLessThan(0.05);
});
