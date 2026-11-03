// The one place that fixes the screen, the tile size, the walking pace and the world's URLs.
export const TILE = 16;
// The view, in game pixels: 20×13 tiles, a little wider than a GBA screen (15×10) so more of the world shows.
export const SCREEN_W = 320;
export const SCREEN_H = 208;
export const STEP_MS = 160; // one tile per step, constant speed
// The art pack: swap these files (made by tools/art/*) to restyle the world without touching game code.
export const ART_DIR = "/world/art";
export const HUNTER_FRAME = { w: 32, h: 32 };
export const HUNTER_ROWS = ["up", "down", "left", "right"] as const; // hunter.png: one row per Dir, column 0 stands
export const WALK_FRAMES = 6; // hunter.png columns 1..6
export const WORLD_PATH = "/world"; // becomes "/" when the world replaces the 3D journey

export function contractPath(slug: string): string {
  return `/contracts/${slug}`;
}
