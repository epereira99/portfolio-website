import { CatmullRomCurve3, Vector3 } from "three";
import { TOTAL_SCREENS } from "./timeline";

export type Vec3 = [number, number, number];

export const UNITS_PER_SCREEN = 40;
export const PATH_LENGTH = TOTAL_SCREENS * UNITS_PER_SCREEN;

// Gentle S-bends heading into the screen (−Z).
const xs = [0, 5, -5, 4, -4, 3, 0];
const curve = new CatmullRomCurve3(
  xs.map((x, i) => new Vector3(x, 0, -Math.min(i * 60, PATH_LENGTH))),
);

const t = (d: number) => Math.min(Math.max(d, 0), PATH_LENGTH) / PATH_LENGTH;

export function distanceAt(s: number): number {
  return Math.min(Math.max(s, 0), TOTAL_SCREENS) * UNITS_PER_SCREEN;
}

export function pathPoint(d: number): Vec3 {
  const p = curve.getPointAt(t(d));
  return [p.x, 0, p.z];
}

export function pathTangent(d: number): Vec3 {
  const v = curve.getTangentAt(t(d));
  return [v.x, v.y, v.z];
}

export function cameraPose(d: number): { position: Vec3; target: Vec3 } {
  const [px, , pz] = pathPoint(d);
  const [tx, , tz] = pathTangent(d);
  const [ax, , az] = pathPoint(d + 5);
  return { position: [px - tx * 6, 3, pz - tz * 6], target: [ax, 1.2, az] };
}

export function walkClipTime(d: number, stride: number, duration: number): number {
  return ((((d / stride) % 1) + 1) % 1) * duration;
}
