// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { PLACES } from "@/content/places";
import { contractsFor } from "@/content/contracts";

type Obj = { type: string; x: number; y: number; properties?: { name: string; value: string }[] };
const map = JSON.parse(readFileSync("public/world/world.tmj", "utf8"));
const objects: Obj[] = map.layers.find((l: { name: string }) => l.name === "objects").objects;
const ground: number[] = map.layers.find((l: { name: string }) => l.name === "ground").data;
const prop = (o: Obj, k: string) => o.properties?.find((p) => p.name === k)?.value;
const tileOf = (o: Obj) => ({ x: o.x / 16, y: o.y / 16 });

test("spawn stands right below the main board, on the Swedish bank", () => {
  const spawn = tileOf(objects.find((o) => o.type === "spawn")!);
  const board = tileOf(objects.find((o) => o.type === "board" && prop(o, "place") === "all")!);
  expect(board).toEqual({ x: spawn.x, y: spawn.y - 1 });
  expect(spawn.x).toBeGreaterThan(map.width / 2);
});

test("every place has a travel point, and every place with contracts has a board", () => {
  for (const p of PLACES) {
    expect(objects.some((o) => o.type === "travel" && prop(o, "place") === p.id), p.id).toBe(true);
    expect(objects.some((o) => o.type === "board" && prop(o, "place") === p.id), p.id).toBe(contractsFor(p.id).length > 0);
  }
});

test("every travel point is walkable from spawn, so the bridge joins the banks", () => {
  const key = (x: number, y: number) => `${x},${y}`;
  const solid = new Set(objects.filter((o) => o.type !== "spawn" && o.type !== "travel").map((o) => key(o.x / 16, o.y / 16)));
  const open = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < map.width && y < map.height && ![3, 5, 6, 7].includes(ground[y * map.width + x]) && !solid.has(key(x, y));
  const start = tileOf(objects.find((o) => o.type === "spawn")!);
  const seen = new Set([key(start.x, start.y)]);
  const queue = [start];
  while (queue.length) {
    const { x, y } = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const [nx, ny] = [x + dx, y + dy];
      if (open(nx, ny) && !seen.has(key(nx, ny))) {
        seen.add(key(nx, ny));
        queue.push({ x: nx, y: ny });
      }
    }
  }
  for (const t of objects.filter((o) => o.type === "travel")) expect(seen.has(key(t.x / 16, t.y / 16)), prop(t, "place")).toBe(true);
});
