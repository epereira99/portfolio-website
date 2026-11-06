/** One line of a stage's story (content/stories.ts): a chat bubble, and optionally the project card(s) it mentions. */
export type Beat = { say: string; show?: string | string[] };

// Within a block's share of its chapter: lines arrive one after another until REVEAL_END, all of them stay until
// FADE_FROM, they fade out by GONE, and the rest is a quiet gap before the next block.
const REVEAL_END = 0.6;
const FADE_FROM = 0.7;
const GONE = 0.8;

/** How many of a block's lines have appeared at this point of it (0–1); the first shows at once. */
export function revealedCount(lines: number, progress: number): number {
  if (lines === 0) return 0;
  return Math.max(1, Math.ceil(Math.min(progress / REVEAL_END, 1) * lines));
}

/** Which block is on, and how far through its share of the chapter (0–1). */
function blockAt(blocks: Beat[][], progress: number) {
  const k = Math.min(Math.floor(Math.max(progress, 0) * blocks.length), blocks.length - 1);
  return { k, local: Math.min(progress * blocks.length - k, 1) };
}

/** The bubbles on screen: the current block's lines so far, nothing in the gap after it; fade is their opacity. */
export function bubblesAt(blocks: Beat[][], progress: number): { block: number; lines: Beat[]; fade: number } {
  if (blocks.length === 0) return { block: 0, lines: [], fade: 1 };
  const { k, local } = blockAt(blocks, progress);
  if (local >= GONE) return { block: k, lines: [], fade: 0 };
  const lines = blocks[k].slice(0, revealedCount(blocks[k].length, local));
  return { block: k, lines, fade: Math.min(1, (GONE - local) / (GONE - FADE_FROM)) };
}

/** The project cards on screen: those named by the current block's latest line so far that names any. A card comes
 * and goes with its block: it appears with the line that mentions it and leaves when the block's bubbles do. */
export function shownProjects(blocks: Beat[][], progress: number): string[] {
  const { lines } = bubblesAt(blocks, progress);
  const last = lines.findLast((b) => b.show);
  return last?.show ? [last.show].flat() : [];
}
