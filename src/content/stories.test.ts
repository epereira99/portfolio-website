import { expect, test } from "vitest";
import { projectBySlug } from "./projects";
import { STAGES } from "./stages";
import { STORIES } from "./stories";

test("every stage has a story", () => {
  expect(Object.keys(STORIES).sort()).toEqual(STAGES.map((s) => s.id).sort());
});

test("every project a line brings in exists, so no card silently fails to appear", () => {
  for (const beat of Object.values(STORIES).flat(2))
    for (const slug of [beat.show ?? []].flat()) expect(projectBySlug(slug), slug).toBeDefined();
});
