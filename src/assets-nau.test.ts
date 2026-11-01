// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { DECK_HEIGHT } from "./journey/voyage/poses";

type Gltf = {
  nodes: { name?: string; mesh?: number; translation?: number[] }[];
  meshes: { primitives: { attributes: { POSITION: number } }[] }[];
  accessors: { max?: number[]; min?: number[] }[];
  materials?: { name?: string }[];
};

function readGlb(path: string): Gltf {
  const buf = readFileSync(path);
  expect(buf.toString("utf8", 0, 4)).toBe("glTF");
  return JSON.parse(buf.toString("utf8", 20, 20 + buf.readUInt32LE(12)));
}

describe("nau.glb", () => {
  const gltf = readGlb("public/models/nau.glb");
  const node = (name: string) => gltf.nodes.find((n) => n.name === name);

  test("has a hull, two castles, three masts and three sails", () => {
    for (const name of [
      "Hull",
      "Castle_Fore",
      "Castle_Aft",
      "Mast_Fore",
      "Mast_Main",
      "Mast_Mizzen",
      "Sail_Fore",
      "Sail_Main",
      "Sail_Mizzen",
    ]) {
      expect(node(name), name).toBeDefined();
    }
  });

  test("marks the deck spot at the height the avatar stands on", () => {
    expect(node("DeckSpot")?.translation?.[1]).toBeCloseTo(DECK_HEIGHT, 1);
  });

  test("is ship-sized and floats at the waterline", () => {
    const hull = node("Hull")!;
    const pos = gltf.accessors[gltf.meshes[hull.mesh!].primitives[0].attributes.POSITION];
    const length = pos.max![2] - pos.min![2];
    expect(length).toBeGreaterThanOrEqual(8);
    expect(length).toBeLessThanOrEqual(14);
    expect(pos.min![1]).toBeGreaterThanOrEqual(-1.5);
  });

  test("carries the red cross of the Order of Christ", () => {
    expect(gltf.materials?.some((m) => m.name?.includes("Cross"))).toBe(true);
  });
});
