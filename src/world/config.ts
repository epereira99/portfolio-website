// The one place that fixes the screen, the tile size, the walking pace and the world's URLs.
export const TILE = 16;
// The view, in game pixels: 20×13 tiles, a little wider than a GBA screen (15×10) so more of the world shows.
export const SCREEN_W = 320;
export const SCREEN_H = 208;
export const STEP_MS = 160; // one tile per step, constant speed
export const WORLD_PATH = "/world"; // becomes "/" when the world replaces the 3D journey

export function contractPath(slug: string): string {
  return `/contracts/${slug}`;
}
