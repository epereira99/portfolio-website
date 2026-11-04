// @vitest-environment node
import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, test } from "vitest";

type Gltf = {
  nodes: { name?: string; mesh?: number; translation?: number[] }[];
  meshes: { primitives: { attributes: { POSITION: number }; indices?: number }[] }[];
  accessors: { count: number; max?: number[]; min?: number[] }[];
  animations?: { name?: string }[];
};

function read(file: string) {
  const path = `public/models/${file}`;
  expect(existsSync(path), path).toBe(true);
  const buf = readFileSync(path);
  return { size: statSync(path).size, gltf: JSON.parse(buf.toString("utf8", 20, 20 + buf.readUInt32LE(12))) as Gltf };
}

/** Bounds of the named nodes' meshes, assuming translation-only nodes (the scripts bake rotation and scale). */
function bounds(gltf: Gltf, names?: string[]) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const node of gltf.nodes) {
    if (node.mesh === undefined || (names && !names.includes(node.name ?? ""))) continue;
    const t = node.translation ?? [0, 0, 0];
    for (const p of gltf.meshes[node.mesh].primitives) {
      const a = gltf.accessors[p.attributes.POSITION];
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], a.min![i] + t[i]);
        max[i] = Math.max(max[i], a.max![i] + t[i]);
      }
    }
  }
  return { min, max };
}

describe("walk-scene.glb", () => {
  test("fits the budget: ≤ 3 MB, ≤ 150k triangles", () => {
    const { size, gltf } = read("walk-scene.glb");
    expect(size).toBeLessThanOrEqual(3 * 1024 * 1024);
    const tris = gltf.meshes.flatMap((m) => m.primitives).reduce((n, p) => n + gltf.accessors[p.indices!].count / 3, 0);
    expect(tris).toBeLessThanOrEqual(150_000);
  });

  test("has the scenery kit as named parts", () => {
    const names = read("walk-scene.glb").gltf.nodes.map((n) => n.name);
    for (const part of ["ground", "path", "trees", "rocks", "mountains", "clouds"]) expect(names).toContain(part);
  });

  test("the path runs the whole walk", () => {
    const { min, max } = bounds(read("walk-scene.glb").gltf, ["path"]);
    expect(max[2] - min[2]).toBeGreaterThanOrEqual(100);
  });
});

describe("walker.glb", () => {
  test("is light and carries a Walk action", () => {
    const { size, gltf } = read("walker.glb");
    expect(size).toBeLessThanOrEqual(500 * 1024);
    expect(gltf.animations?.map((a) => a.name)).toContain("Walk");
  });

  test("stands 1.7–1.9 tall on the ground", () => {
    const { min, max } = bounds(read("walker.glb").gltf);
    expect(max[1] - min[1]).toBeGreaterThanOrEqual(1.7);
    expect(max[1] - min[1]).toBeLessThanOrEqual(1.9);
  });
});
