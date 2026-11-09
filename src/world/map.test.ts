// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { PLACES } from "@/content/places";
import { contractsFor } from "@/content/contracts";

type Obj = { type: string; x: number; y: number; properties?: { name: string; value: string }[] };
const map = JSON.parse(readFileSync("public/world/world.tmj", "utf8"));
const objects: Obj[] = map.layers.find((l: { name: string }) => l.name === "objects").objects;
const solid: number[] = map.layers.find((l: { name: string }) => l.name === "solid").data;
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

/** Steps from spawn to every reachable tile, walking only on open (non-solid) tiles. */
function stepsFromSpawn() {
  const key = (x: number, y: number) => `${x},${y}`;
  const open = (x: number, y: number) => x >= 0 && y >= 0 && x < map.width && y < map.height && !solid[y * map.width + x];
  const start = tileOf(objects.find((o) => o.type === "spawn")!);
  const steps = new Map([[key(start.x, start.y), 0]]);
  const queue = [start];
  while (queue.length) {
    const { x, y } = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const [nx, ny] = [x + dx, y + dy];
      if (open(nx, ny) && !steps.has(key(nx, ny))) {
        steps.set(key(nx, ny), steps.get(key(x, y))! + 1);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return (o: Obj) => steps.get(key(o.x / 16, o.y / 16));
}

test("every travel point is walkable from spawn, so the bridge joins the banks", () => {
  const steps = stepsFromSpawn();
  for (const t of objects.filter((o) => o.type === "travel")) expect(steps(t), prop(t, "place")).toBeDefined();
});

test("every travel point is within 45 steps of spawn", () => {
  const steps = stepsFromSpawn();
  for (const t of objects.filter((o) => o.type === "travel")) expect(steps(t), prop(t, "place")).toBeLessThanOrEqual(45);
});

test("interactive objects stand on solid tiles, so the hunter faces them instead of walking onto them", () => {
  for (const o of objects.filter((o) => ["board", "sign", "academy", "npc"].includes(o.type)))
    expect(solid[(o.y / 16) * map.width + o.x / 16], `${o.type} at ${o.x / 16},${o.y / 16}`).toBe(1);
});

test("a place-name sign reads Sweden on the spawn bank and Portugal across the river", () => {
  const spawn = tileOf(objects.find((o) => o.type === "spawn")!);
  const placeSign = (text: string) => objects.find((o) => o.type === "sign" && prop(o, "look") === "place" && prop(o, "text") === text)!;
  expect(tileOf(placeSign("Sweden")).x).toBeGreaterThan(map.width / 2);
  expect(tileOf(placeSign("Portugal")).x).toBeLessThan(map.width / 2);
  expect(Math.abs(tileOf(placeSign("Sweden")).x - spawn.x)).toBeLessThanOrEqual(3);
});

test("direction signs and place-name signs use different art", () => {
  const art = (look: string) => new Set(objects.filter((o) => o.type === "sign" && prop(o, "look") === look).map((o) => prop(o, "art")));
  expect(art("direction").size).toBeGreaterThan(0);
  expect([...art("direction")].some((a) => art("place").has(a))).toBe(false);
});
