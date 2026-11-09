import { expect, test } from "vitest";
import { reduce, WORLD, type View } from "./view";
const run = (v: View, ...bs: Parameters<typeof reduce>[1][]) => bs.reduce(reduce, v);

test("in the world only Start does something: it opens the menu", () => {
  expect(run(WORLD, "a", "up", "b")).toEqual(WORLD);
  expect(run(WORLD, "start")).toEqual({ kind: "menu", index: 0 });
});

test("dialogue pages forward on A and then hands over to its follow-up view", () => {
  const prompt: View = {
    kind: "dialogue",
    lines: ["Contracts are pinned to the board.", "Read one?"],
    page: 0,
    then: { kind: "board", place: "all", index: 0 },
  };
  expect(run(prompt, "a")).toMatchObject({ page: 1 });
  expect(run(prompt, "a", "a")).toEqual({ kind: "board", place: "all", index: 0 });
  expect(run(prompt, "b")).toEqual(WORLD);
  expect(run({ kind: "dialogue", lines: ["Hi"], page: 0 }, "a")).toEqual(WORLD);
});

test("the board moves on a 3-column grid, ignores moves off its edges, opens on A and leaves on B", () => {
  const all: View = { kind: "board", place: "all", index: 0 };
  expect(run(all, "right", "right", "right")).toMatchObject({ index: 2 });
  expect(run(all, "down")).toMatchObject({ index: 3 });
  expect(run(all, "up", "left")).toMatchObject({ index: 0 });
  expect(run({ kind: "board", place: "deloitte", index: 0 }, "down")).toMatchObject({ index: 0 }); // only 2 papers
  expect(run(all, "a")).toEqual({ kind: "scroll", place: "all", slug: "mambu-migration" });
  expect(run(all, "b")).toEqual(WORLD);
});

test("a scroll rolls back to the board it came from, on the same paper", () => {
  expect(run({ kind: "scroll", place: "ju", slug: "saab-thesis" }, "b")).toEqual({ kind: "board", place: "ju", index: 1 });
  expect(run({ kind: "scroll", place: "ju", slug: "saab-thesis" }, "a", "up")).toEqual({
    kind: "scroll",
    place: "ju",
    slug: "saab-thesis",
  });
});

test("menu items lead to the board, map, hunter and raven, and B or Start closes it", () => {
  const menu = (i: number): View => ({ kind: "menu", index: i });
  expect(run(menu(0), "a")).toEqual({ kind: "board", place: "all", index: 0 });
  expect(run(menu(0), "down", "a")).toEqual({ kind: "map", index: 0 });
  expect(run(menu(0), "down", "down", "a")).toEqual({ kind: "hunter" });
  expect(run(menu(0), "up", "a")).toEqual({ kind: "raven" }); // wraps
  expect(run(menu(2), "b")).toEqual(WORLD);
  expect(run(menu(2), "start")).toEqual(WORLD);
  expect(run({ kind: "hunter" }, "b")).toEqual(menu(2));
});

test("the map fast-travels to the chosen place", () => {
  expect(run({ kind: "map", index: 0 }, "down", "a")).toEqual({ kind: "world", travelTo: "uminho" });
  expect(run({ kind: "map", index: 0 }, "b")).toEqual({ kind: "menu", index: 1 });
});
