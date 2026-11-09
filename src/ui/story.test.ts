import { expect, test } from "vitest";
import { revealed } from "./story";

const bubbles = ["This is where it all started.", "I was 17, and I jumped in.", "Was it worth it?", "Yes."];

const texts = (shown: { text: string }[]) => shown.map((b) => b.text);

test("the first bubble shows at once; the rest follow as he walks, the last by 70% of the stage", () => {
  expect(texts(revealed(bubbles, 0))).toEqual(["This is where it all started."]);
  expect(revealed(bubbles, 0.3)).toHaveLength(2);
  expect(revealed(bubbles, 0.7).at(-1)!.text).toBe("Yes.");
});

test("at most three on screen: when the fourth appears, the first goes", () => {
  expect(texts(revealed(bubbles, 1))).toEqual(["I was 17, and I jumped in.", "Was it worth it?", "Yes."]);
  expect(revealed(bubbles, 1).map((b) => b.index)).toEqual([1, 2, 3]); // each keeps its place in the story
});

test("each bubble is exactly what was written: sentences are never split or joined", () => {
  expect(texts(revealed(["One. Two. Three.", "Four"], 1))).toEqual(["One. Two. Three.", "Four"]);
});

test("no bubbles, nothing to show", () => {
  expect(revealed([], 1)).toEqual([]);
});
