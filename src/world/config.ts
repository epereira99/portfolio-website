// The one place that fixes the screen, the tile size, the walking pace and the world's URLs.
export const TILE = 16;
export const SCREEN_W = 240; // a GBA screen, in pixels
export const SCREEN_H = 160;
export const STEP_MS = 160; // one tile per step, constant speed
export const WORLD_PATH = "/world"; // becomes "/" when the world replaces the 3D journey

export function contractPath(slug: string): string {
  return `/contracts/${slug}`;
}
