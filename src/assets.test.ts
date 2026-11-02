// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, test } from "vitest";

type Gltf = {
  animations?: { name: string }[];
  nodes: { name?: string; mesh?: number; skin?: number }[];
  meshes: { primitives: { attributes: { POSITION: number } }[] }[];
  accessors: { max?: number[]; min?: number[] }[];
  skins?: unknown[];
};

function readGlb(path: string): Gltf {
  const buf = readFileSync(path);
  expect(buf.toString("utf8", 0, 4)).toBe("glTF");
  const jsonLength = buf.readUInt32LE(12);
  return JSON.parse(buf.toString("utf8", 20, 20 + jsonLength));
}

describe("avatar.glb follows the avatar contract", () => {
  const gltf = readGlb("public/models/avatar.glb");

  test("has idle, walk and turn clips", () => {
    const names = (gltf.animations ?? []).map((a) => a.name);
    expect(names).toEqual(expect.arrayContaining(["idle", "walk", "turn"]));
  });

  test("uses Mixamo bone names and is skinned", () => {
    const names = gltf.nodes.map((n) => n.name);
    for (const bone of ["mixamorig:Hips", "mixamorig:LeftUpLeg", "mixamorig:RightUpLeg", "mixamorig:Head"]) {
      expect(names).toContain(bone);
    }
    expect(gltf.skins?.length).toBeGreaterThan(0);
  });

  test("stands about 1.8 units tall from the ground", () => {
    const pos = gltf.meshes.flatMap((m) => m.primitives.map((p) => gltf.accessors[p.attributes.POSITION]));
    const top = Math.max(...pos.map((a) => a.max![1]));
    const bottom = Math.min(...pos.map((a) => a.min![1]));
    expect(top).toBeGreaterThan(1.6);
    expect(top).toBeLessThanOrEqual(2.0);
    expect(bottom).toBeGreaterThanOrEqual(-0.01);
  });
});

describe("memory walk assets stay within budget", () => {
  const walk = existsSync("public/walk") ? readdirSync("public/walk").filter((f) => f.endsWith(".webp")).sort() : [];

  test("139 walk frames named walk-000..walk-138", () => {
    expect(walk).toHaveLength(139);
    expect(walk[0]).toBe("walk-000.webp");
    expect(walk[138]).toBe("walk-138.webp");
  });

  test("walk frames total ≤ 4 MB", () => {
    const total = walk.reduce((sum, f) => sum + statSync(`public/walk/${f}`).size, 0);
    expect(total).toBeLessThanOrEqual(4 * 1024 * 1024);
  });

  test("each memory image ≤ 300 KB", () => {
    const dir = "public/memories";
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".webp")) : [];
    for (const f of files) expect(statSync(`${dir}/${f}`).size, f).toBeLessThanOrEqual(300 * 1024);
  });
});
