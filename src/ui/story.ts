import { revealedCount } from "@/journey/beats";

export const MAX_BUBBLES = 3;

/** The bubbles on screen at this point of the chapter (0–1), each with its place in the story: they appear one after
 * another (see revealedCount), at most MAX_BUBBLES at a time; when a new one comes, the oldest goes. */
export function revealed(bubbles: string[], progress: number): { index: number; text: string }[] {
  return bubbles
    .slice(0, revealedCount(bubbles.length, progress))
    .map((text, index) => ({ index, text }))
    .slice(-MAX_BUBBLES);
}
