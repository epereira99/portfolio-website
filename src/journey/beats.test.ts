import { expect, test } from "vitest";
import { bubblesAt, shownProjects } from "./beats";

const blocks = [
  [
    { say: "Deloitte is where I became a professional." },
    { say: "I built an automation for Western Union.", show: "mambu-migration" },
  ],
  [
    { say: "I moved to software." },
    { say: "Jordbruksverket and Jönköpings Södra.", show: ["unet-segmentation", "jonkoping-sodra"] },
  ],
];
const said = (p: number) => bubblesAt(blocks, p).lines.map((b) => b.say);

test("each block gets an equal share of the chapter; its lines come one after another", () => {
  expect(said(0)).toEqual(["Deloitte is where I became a professional."]);
  expect(said(0.25)).toEqual(["Deloitte is where I became a professional.", "I built an automation for Western Union."]);
});

test("a block goes away when it's done, and there's a gap before the next one starts", () => {
  expect(bubblesAt(blocks, 0.36).fade).toBeLessThan(1); // fading out
  expect(said(0.45)).toEqual([]); // the gap: no bubbles
  expect(said(0.5)).toEqual(["I moved to software."]); // the next block starts fresh
  expect(bubblesAt(blocks, 0.5).block).toBe(1);
});

test("a project card comes and goes with its block: from the line that mentions it until the block fades", () => {
  expect(shownProjects(blocks, 0)).toEqual([]);
  expect(shownProjects(blocks, 0.25)).toEqual(["mambu-migration"]);
  expect(shownProjects(blocks, 0.45)).toEqual([]); // the gap: gone with the bubbles
  expect(shownProjects(blocks, 0.5)).toEqual([]); // the next block hasn't named one yet
  expect(shownProjects(blocks, 0.75)).toEqual(["unet-segmentation", "jonkoping-sodra"]); // two at once
});

test("no blocks, nothing", () => {
  expect(bubblesAt([], 0.5).lines).toEqual([]);
  expect(shownProjects([], 0.5)).toEqual([]);
});
