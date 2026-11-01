import { ROUTE } from "./europe";

type Pt = [number, number];

const seg = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function polylineLength(pts: Pt[]): number {
  return pts.slice(1).reduce((sum, p, i) => sum + seg(pts[i], p), 0);
}

/** Point at fraction t of the arc length; angle in SVG degrees (0 = east, clockwise). */
export function pointAlong(pts: Pt[], t: number): { x: number; y: number; angle: number } {
  let left = Math.min(Math.max(t, 0), 1) * polylineLength(pts);
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const len = seg(a, b);
    const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    if (left <= len || i === pts.length - 1) {
      const f = len === 0 ? 0 : Math.min(left / len, 1);
      return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, angle };
    }
    left -= len;
  }
  return { x: pts[0][0], y: pts[0][1], angle: 0 };
}

export const ROUTE_D = ROUTE.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
