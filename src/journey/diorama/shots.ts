import type { StageId } from "@/content/stages";
import { distanceAt, pointAt } from "../lowpoly/path";
import { ENDING_START, SEGMENTS, overlayAt, segmentAt, segmentStart } from "../timeline";

/** A directed camera shot: one view from behind per stage, facing him only to say hello and goodbye. */
export type Shot = "follow" | "high" | "shoulder" | "crane" | "quarter" | "front" | "farewell";

// Each stage keeps its own angle the whole time, changing only as the next stage begins; he's seen from the front
// only at the start and at the end (Eduardo, 2026-11-06).
const STAGE_SHOTS: Record<StageId, Shot> = {
  braga: "follow",
  porto: "high",
  jonkoping: "shoulder",
  stockholm: "crane",
  personal: "quarter",
};

export function shotAt(s: number): Shot {
  const overlay = overlayAt(s);
  if (overlay.kind === "intro") return "front";
  if (overlay.kind === "ending") return "farewell";
  return STAGE_SHOTS[segmentAt(s)];
}

/** A camera placed around him: `around` is the angle from straight behind him (0) toward his right, π in front;
 * it looks at the point `ahead` units down the road at height `lookUp`. Easing these, rather than positions, swings
 * the camera round him instead of through him. */
export type Rig = { around: number; dist: number; height: number; ahead: number; lookUp: number; hfov: number };

export const RIGS: Record<Shot, Rig> = {
  follow: { around: 0, dist: 11, height: 2.2, ahead: 30, lookUp: 2.1, hfov: 60 }, // the classic walk's camera
  high: { around: 0.29, dist: 21, height: 10, ahead: 8, lookUp: 0.5, hfov: 60 }, // up high, over his right shoulder
  shoulder: { around: -0.3, dist: 8, height: 1.3, ahead: 1.5, lookUp: 1.5, hfov: 60 }, // low, over his left shoulder: what lies ahead sits below his head, clear of his bubbles
  crane: { around: 0, dist: 15, height: 8, ahead: 12, lookUp: 0.8, hfov: 60 }, // high, straight behind him
  quarter: { around: 0.45, dist: 12, height: 4.5, ahead: 0, lookUp: 1.4, hfov: 60 }, // three-quarters from behind
  front: { around: Math.PI - 0.17, dist: 8.1, height: 1.7, ahead: 0, lookUp: 1.5, hfov: 50 }, // he talks to you
  farewell: { around: Math.PI - 0.35, dist: 13, height: 4, ahead: 0, lookUp: 1.3, hfov: 55 }, // the invitation
};

export type Camera = { position: [number, number, number]; target: [number, number, number]; fov: number };

const MAX_V_FOV = 75;
const vfov = (hfov: number, aspect: number) =>
  Math.min((2 * Math.atan(Math.tan((hfov * Math.PI) / 360) / aspect) * 180) / Math.PI, MAX_V_FOV);

/** The camera a rig gives at journey position s; yaw is the viewer's own drag around him. Keeps a horizontal field
 * of view, so portrait screens see taller (capped). */
export function place(rig: Rig, s: number, aspect: number, yaw = 0): Camera {
  const w = pointAt(distanceAt(s));
  const f = [-Math.sin(w.heading), -Math.cos(w.heading)]; // ahead, in x/z
  const r = [-f[1], f[0]]; // his right
  const a = rig.around + yaw;
  const back = -Math.cos(a) * rig.dist;
  const side = Math.sin(a) * rig.dist;
  return {
    position: [w.x + f[0] * back + r[0] * side, rig.height, w.z + f[1] * back + r[1] * side],
    target: [w.x + f[0] * rig.ahead, rig.lookUp, w.z + f[1] * rig.ahead],
    fov: vfov(rig.hfov, aspect),
  };
}

/** The signed shortest turn from angle a to b. */
export const turnTo = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

// The sun over the day (daylight.ts): morning, midday, then lower through golden hour to dusk. Degrees; azimuth is
// around Y from −Z (his start heading), toward his left. It sweeps one way all day, from ahead on his left in the
// morning round behind him, so the signs facing him by the road (tools/blender/lowpoly/scene.py) have it on their
// faces, not their backs (Eduardo, 2026-11-06). Past 180 rather than wrapping, so the blend never turns back.
const SUN: Record<StageId, { elevation: number; azimuth: number }> = {
  braga: { elevation: 28, azimuth: 70 },
  porto: { elevation: 58, azimuth: 170 }, // behind his left shoulder: on Deloitte's sign
  jonkoping: { elevation: 24, azimuth: 195 }, // behind him: on Jönköping University's
  stockholm: { elevation: 15, azimuth: 220 },
  personal: { elevation: 11, azimuth: 245 }, // low, but still up: golden sunset light
};

const SUN_KEYS = SEGMENTS.map(({ id, screens }, i) => ({
  at: i === SEGMENTS.length - 1 ? ENDING_START : segmentStart(id) + screens / 2,
  sun: SUN[id],
}));

/** Unit vector toward the sun at journey position s, blending between the stages like the daylight does. */
export function sunAt(s: number): [number, number, number] {
  const i = SUN_KEYS.findIndex((k) => k.at > s);
  const a = SUN_KEYS[Math.max(i - 1, 0)];
  const b = i === -1 ? SUN_KEYS[SUN_KEYS.length - 1] : SUN_KEYS[i];
  const t = a === b ? 0 : Math.min(Math.max((s - a.at) / (b.at - a.at), 0), 1);
  const el = ((a.sun.elevation + (b.sun.elevation - a.sun.elevation) * t) * Math.PI) / 180;
  const az = ((a.sun.azimuth + (b.sun.azimuth - a.sun.azimuth) * t) * Math.PI) / 180;
  return [-Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
}

/** What's in the air: pollen in Portugal, snow in Sweden, fireflies at dusk with his own projects. */
export type Weather = "pollen" | "snow" | "fireflies";
const WEATHER: Record<StageId, Weather> = {
  braga: "pollen", porto: "pollen", jonkoping: "snow", stockholm: "snow", personal: "fireflies",
};
export const weatherAt = (s: number): Weather => WEATHER[segmentAt(s)];
