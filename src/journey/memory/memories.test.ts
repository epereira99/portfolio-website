import { expect, test } from "vitest";
import { TOTAL_SCREENS, segmentAt } from "../timeline";
import { MEMORIES, memoryPose } from "./memories";

test("the agreed set, in path order", () => {
  expect(MEMORIES.map((m) => m.id)).toEqual([
    "arcada",
    "bom-jesus",
    "uminho",
    "porto-ribeira",
    "porto-riverside",
    "porto-douro",
    "nau",
    "jonkoping-university",
    "jonkoping-stora-hotellet",
    "stockholm-gamla-stan",
    "stadshuset",
  ]);
  const ats = MEMORIES.map((m) => m.at);
  expect([...ats].sort((a, b) => a - b)).toEqual(ats);
});

test("each memory sits in its stage, the nau at the end of Porto", () => {
  const where = Object.fromEntries(MEMORIES.map((m) => [m.id, segmentAt(m.at)]));
  expect(where).toEqual({
    arcada: "braga",
    "bom-jesus": "braga",
    uminho: "braga",
    "porto-ribeira": "porto",
    "porto-riverside": "porto",
    "porto-douro": "porto",
    nau: "porto",
    "jonkoping-university": "jonkoping",
    "jonkoping-stora-hotellet": "jonkoping",
    "stockholm-gamla-stan": "stockholm",
    stadshuset: "stockholm",
  });
  expect(MEMORIES.find((m) => m.id === "nau")!.layout).toBe("centre");
});

test("hidden far ahead, full alongside, gone once passed", () => {
  const m = MEMORIES[1];
  expect(memoryPose(m, m.at - 1.5, false).opacity).toBe(0);
  expect(memoryPose(m, m.at, false).opacity).toBe(1);
  expect(memoryPose(m, m.at + 0.6, false).opacity).toBe(0);
});

test("grows and slides right while approaching; reduced motion only fades", () => {
  const m = MEMORIES[1];
  const far = memoryPose(m, m.at - 0.7, false);
  const near = memoryPose(m, m.at, false);
  expect(near.scale).toBeGreaterThan(far.scale);
  expect(near.x).toBeGreaterThan(far.x);
  const rm = memoryPose(m, m.at - 0.7, true);
  const rmNear = memoryPose(m, m.at, true);
  expect([rm.x, rm.scale]).toEqual([rmNear.x, rmNear.scale]);
});

test("centre memories don't slide sideways", () => {
  const nau = MEMORIES.find((m) => m.id === "nau")!;
  expect(memoryPose(nau, nau.at - 0.5, false).x).toBe(0);
});

test("no NaN for out-of-range progress", () => {
  for (const s of [-5, 0, 9, 50]) {
    for (const m of MEMORIES) {
      const p = memoryPose(m, s, false);
      expect([p.opacity, p.x, p.scale].every(Number.isFinite)).toBe(true);
    }
  }
});

test("every memory with a painting points at its compressed image", () => {
  for (const m of MEMORIES.filter((x) => x.src)) expect(m.src).toBe(`/memories/${m.id}.webp`);
  expect(MEMORIES.filter((m) => m.src).map((m) => m.id)).toEqual(["arcada", "bom-jesus", "uminho", "porto-ribeira", "nau"]);
});

test("never two memories on screen at once: each one is gone before the next appears", () => {
  for (let s = 0; s <= TOTAL_SCREENS; s += 0.01) {
    const visible = MEMORIES.filter((m) => memoryPose(m, s, false).opacity > 0.01).map((m) => m.id);
    expect(visible.length, `at ${s.toFixed(2)}: ${visible.join(", ")}`).toBeLessThanOrEqual(1);
  }
});
