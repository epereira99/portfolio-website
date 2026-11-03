import { afterEach, beforeEach, expect, test } from "vitest";
import { press, resetButtons } from "./buttons";
import { getView, initialViewFor, setView, startStore } from "./store";
import { WORLD } from "./view";

let stop: () => void;
beforeEach(() => {
  resetButtons();
  window.history.replaceState(null, "", "/world");
  stop = startStore(WORLD);
});
afterEach(() => stop());

const popped = () => new Promise((r) => window.addEventListener("popstate", r, { once: true }));

test("opening a scroll pushes its contract URL, and closing it returns to the world path", async () => {
  setView({ kind: "board", place: "all", index: 3 });
  press("a");
  expect(window.location.pathname).toBe("/contracts/saab-thesis");
  const back = popped();
  press("b");
  await back;
  expect(getView()).toMatchObject({ kind: "board", index: 3 });
  expect(window.location.pathname).toBe("/world");
});

test("browser Back from an open scroll goes back to its board", async () => {
  setView({ kind: "board", place: "all", index: 3 });
  press("a");
  const back = popped();
  window.history.back();
  await back;
  expect(getView()).toMatchObject({ kind: "board", index: 3 });
});

test("closing a deep-linked scroll replaces the URL instead of leaving the site", () => {
  stop();
  window.history.replaceState(null, "", "/contracts/saab-thesis");
  stop = startStore(initialViewFor("saab-thesis"));
  press("b");
  expect(window.location.pathname).toBe("/world");
  expect(getView()).toMatchObject({ kind: "board", place: "all", index: 3 });
});

test("a deep link opens straight on its scroll; an unknown slug opens the world", () => {
  expect(initialViewFor("saab-thesis")).toEqual({ kind: "scroll", place: "all", slug: "saab-thesis" });
  expect(initialViewFor("nope")).toEqual(WORLD);
});
