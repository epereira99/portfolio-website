import { ENDING_START } from "../timeline";
import path from "./path.json";

// The low-poly walk's ground path, shared with tools/blender/lowpoly (the scene is built along these same points).
// World units: Y up, the path starts at the origin and runs toward −Z.
export const UNITS_PER_SCREEN = 6;
/** Ground covered by one loop of the walker's Walk action: the Mixamo walk's own travel (tools/blender/lowpoly/walker.py). */
export const STRIDE_UNITS = 1.06;

const POINTS = path.points as [number, number][];
const LENGTHS = POINTS.reduce<number[]>((acc, p, i) => {
  if (i === 0) return [0];
  const [x0, z0] = POINTS[i - 1];
  return [...acc, acc[i - 1] + Math.hypot(p[0] - x0, p[1] - z0)];
}, []);

/** Distance walked at journey position s (screens); he stops at the ending. */
export function distanceAt(s: number): number {
  if (!Number.isFinite(s)) return 0;
  return Math.min(Math.max(s, 0), ENDING_START) * UNITS_PER_SCREEN;
}

/** The point d units along the path, and the yaw (around Y) that faces along it: 0 faces −Z. */
export function pointAt(d: number): { x: number; z: number; heading: number } {
  let i = 1;
  while (i < LENGTHS.length - 1 && LENGTHS[i] < d) i++;
  const [x0, z0] = POINTS[i - 1];
  const [x1, z1] = POINTS[i];
  const t = Math.min(Math.max((d - LENGTHS[i - 1]) / (LENGTHS[i] - LENGTHS[i - 1]), 0), 1);
  return { x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, heading: Math.atan2(-(x1 - x0), -(z1 - z0)) };
}

const BACK = 11;
const UP = 3.2;
const LOOK_AHEAD = 30;
const LOOK_UP = 3;
const H_FOV = 60;
const MAX_V_FOV = 75;

/** Camera pulled back and up behind him; keeps a 60° horizontal view, so portrait screens see wider (capped). */
export function cameraAt(s: number, aspect: number) {
  const w = pointAt(distanceAt(s));
  const fx = -Math.sin(w.heading);
  const fz = -Math.cos(w.heading);
  const vfov = (2 * Math.atan(Math.tan((H_FOV * Math.PI) / 360) / aspect) * 180) / Math.PI;
  return {
    position: [w.x - fx * BACK, UP, w.z - fz * BACK] as [number, number, number],
    target: [w.x + fx * LOOK_AHEAD, LOOK_UP, w.z + fz * LOOK_AHEAD] as [number, number, number],
    fov: Math.min(vfov, MAX_V_FOV),
  };
}
