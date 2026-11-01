// @vitest-environment node
import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, test } from "vitest";

type Gltf = {
  nodes: { name?: string; mesh?: number; translation?: number[] }[];
  meshes: { primitives: { attributes: { POSITION: number } }[] }[];
  accessors: { max?: number[]; min?: number[] }[];
  materials?: { name?: string }[];
};

// Target overall heights (scene units) from the plan; ±25% allowed.
const HEIGHT: Record<string, number> = {
  arcada: 11,
  "bom-jesus": 15,
  uminho: 9,
  "dom-luis": 12,
  clerigos: 14,
  "jonkoping-university": 8,
  stadshuset: 19,
};

function read(id: string) {
  const path = `public/models/landmarks/${id}.glb`;
  expect(existsSync(path), path).toBe(true);
  const buf = readFileSync(path);
  return { size: statSync(path).size, gltf: JSON.parse(buf.toString("utf8", 20, 20 + buf.readUInt32LE(12))) as Gltf };
}

/** World bounds over all mesh nodes, assuming translation-only nodes (scripts bake rotation and scale). */
function bounds(gltf: Gltf) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const node of gltf.nodes) {
    if (node.mesh === undefined) continue;
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

describe.each(Object.keys(HEIGHT))("%s.glb", (id) => {
  test("is light, named, standing on the ground at the planned height", () => {
    const { size, gltf } = read(id);
    expect(size).toBeLessThanOrEqual(400 * 1024);
    expect(gltf.nodes.some((n) => n.name === id)).toBe(true);
    const { min, max } = bounds(gltf);
    expect(max[1]).toBeGreaterThanOrEqual(HEIGHT[id] * 0.75);
    expect(max[1]).toBeLessThanOrEqual(HEIGHT[id] * 1.25);
    expect(min[1]).toBeGreaterThanOrEqual(-0.5);
  });
});

test("the Dom Luís I bridge spans the Douro (28–40 long)", () => {
  const { min, max } = bounds(read("dom-luis").gltf);
  expect(Math.max(max[0] - min[0], max[2] - min[2])).toBeGreaterThanOrEqual(28);
  expect(Math.max(max[0] - min[0], max[2] - min[2])).toBeLessThanOrEqual(40);
});

test("Stockholm City Hall wears its three gold crowns", () => {
  expect(read("stadshuset").gltf.materials?.some((m) => m.name?.includes("Gold"))).toBe(true);
});
