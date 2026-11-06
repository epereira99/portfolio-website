import { expect, test } from "vitest";
import { cameraAt, distanceAt, pointAt } from "../lowpoly/path";
import { ENDING_START, INTRO_END, TOTAL_SCREENS, segmentAt, segmentStart } from "../timeline";
import { RIGS, place, shotAt, sunAt, turnTo, weatherAt } from "./shots";

test("he faces you only at the start and at the end", () => {
  expect(shotAt(0)).toBe("front");
  expect(shotAt(ENDING_START + 0.2)).toBe("farewell");
});

test("each stage keeps one angle from behind the whole way through, and the next stage brings a new one", () => {
  const byStage = new Map<string, Set<string>>();
  for (let s = INTRO_END; s < ENDING_START; s += 0.01) {
    const stage = segmentAt(s);
    if (!byStage.has(stage)) byStage.set(stage, new Set());
    byStage.get(stage)!.add(shotAt(s));
  }
  const shots = [...byStage.values()].map((set) => [...set]);
  shots.forEach((one) => expect(one).toHaveLength(1));
  shots.slice(1).forEach(([shot], i) => expect(shot).not.toBe(shots[i][0]));
  shots.flat().forEach((shot) => expect(Math.abs(RIGS[shot as keyof typeof RIGS].around)).toBeLessThan(Math.PI / 2));
});

test("the follow rig is exactly the classic walk's camera", () => {
  for (const s of [0.7, 3, 6.2]) {
    const a = place(RIGS.follow, s, 16 / 9);
    const b = cameraAt(s, 16 / 9);
    a.position.forEach((v, i) => expect(v).toBeCloseTo(b.position[i], 6));
    a.target.forEach((v, i) => expect(v).toBeCloseTo(b.target[i], 6));
    expect(a.fov).toBeCloseTo(b.fov, 6);
  }
});

test("the front rig is in front of him, looking back at him", () => {
  const s = 1;
  const w = pointAt(distanceAt(s));
  const cam = place(RIGS.front, s, 1.5);
  const f = [-Math.sin(w.heading), -Math.cos(w.heading)];
  expect((cam.position[0] - w.x) * f[0] + (cam.position[2] - w.z) * f[1]).toBeGreaterThan(7);
  expect(Math.hypot(cam.target[0] - w.x, cam.target[2] - w.z)).toBeCloseTo(0, 6);
});

test("looking around keeps the camera's distance to him; a full turn comes back to the shot", () => {
  const w = pointAt(distanceAt(1));
  const dist = (c: ReturnType<typeof place>) => Math.hypot(c.position[0] - w.x, c.position[2] - w.z);
  const cam = place(RIGS.front, 1, 1.5);
  expect(dist(place(RIGS.front, 1, 1.5, Math.PI))).toBeCloseTo(dist(cam), 6);
  place(RIGS.front, 1, 1.5, Math.PI * 2).position.forEach((v, i) => expect(v).toBeCloseTo(cam.position[i], 6));
});

test("turns take the short way round", () => {
  expect(turnTo(0, RIGS.front.around)).toBeCloseTo(RIGS.front.around, 6);
  expect(turnTo(3, -3)).toBeCloseTo(2 * Math.PI - 6, 6);
});

test("the sun stays up and sinks toward dusk", () => {
  for (let s = 0; s <= TOTAL_SCREENS; s += 0.1) {
    const [x, y, z] = sunAt(s);
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
    expect(y).toBeGreaterThan(0);
  }
  expect(sunAt(TOTAL_SCREENS)[1]).toBeLessThan(sunAt(segmentStart("porto") + 1.5)[1]);
});

test("the sun sweeps across the sky one way all day, never turning back", () => {
  let last = -Infinity;
  for (let s = 0; s <= TOTAL_SCREENS; s += 0.05) {
    const [x, , z] = sunAt(s);
    let az = Math.atan2(-x, -z);
    while (az < last - Math.PI) az += 2 * Math.PI; // unwrapped
    expect(az).toBeGreaterThanOrEqual(last - 1e-9);
    last = az;
  }
});

test("pollen in Portugal, snow in Sweden, fireflies with his own projects", () => {
  expect(weatherAt(segmentStart("braga"))).toBe("pollen");
  expect(weatherAt(segmentStart("stockholm") + 0.1)).toBe("snow");
  expect(weatherAt(TOTAL_SCREENS)).toBe("fireflies");
});
