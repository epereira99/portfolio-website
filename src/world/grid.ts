import type { Dir } from "./buttons";
import { SCREEN_H, SCREEN_W } from "./config";

export type Tile = { x: number; y: number };

const DELTA: Record<Dir, Tile> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };

export function ahead(t: Tile, d: Dir): Tile {
  return { x: t.x + DELTA[d].x, y: t.y + DELTA[d].y };
}

/** One tile towards d, or stay put when that tile is blocked (walls, water, objects, the map edge). */
export function step(t: Tile, d: Dir, blocked: (t: Tile) => boolean): Tile {
  const next = ahead(t, d);
  return blocked(next) ? t : next;
}

/** The largest scale at which the GBA screen fits with a whole number of device pixels per game pixel,
 * so pixels stay square and sharp. dpr: window.devicePixelRatio. Never below one CSS pixel per game pixel. */
export function integerZoom(w: number, h: number, dpr = 1): number {
  return Math.max(1, Math.floor(Math.min((w * dpr) / SCREEN_W, (h * dpr) / SCREEN_H)) / dpr);
}
