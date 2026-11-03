import type { Button } from "./buttons";
import { contractsFor } from "@/content/contracts";
import { PLACES, type PlaceId } from "@/content/places";

export type Board = PlaceId | "all";

/** What is on screen. Everything but "world" is a React overlay; the scene only walks while it's "world". */
export type View =
  | { kind: "world"; travelTo?: PlaceId }
  | { kind: "dialogue"; lines: string[]; page: number; then?: View }
  | { kind: "board"; place: Board; index: number }
  | { kind: "scroll"; place: Board; slug: string }
  | { kind: "menu"; index: number }
  | { kind: "map"; index: number }
  | { kind: "hunter" }
  | { kind: "raven" }
  | { kind: "degree"; slug: string };

export const WORLD: View = { kind: "world" };
export const MENU_ITEMS = ["Contracts", "Map", "Hunter", "Send a raven"] as const;
export const BOARD_COLUMNS = 3;

const wrap = (i: number, n: number) => (i + n) % n;

function moveOnBoard(index: number, count: number, b: Button): number {
  const col = index % BOARD_COLUMNS;
  const next =
    b === "left" && col > 0 ? index - 1
    : b === "right" && col < BOARD_COLUMNS - 1 ? index + 1
    : b === "up" ? index - BOARD_COLUMNS
    : b === "down" ? index + BOARD_COLUMNS
    : index;
  return next >= 0 && next < count ? next : index;
}

function openMenuItem(index: number): View {
  return [
    { kind: "board", place: "all", index: 0 } as const,
    { kind: "map", index: 0 } as const,
    { kind: "hunter" } as const,
    { kind: "raven" } as const,
  ][index];
}

/** The next view after one button press. Movement and A in the world are the scene's, not this. */
export function reduce(view: View, b: Button): View {
  switch (view.kind) {
    case "world":
      return b === "start" ? { kind: "menu", index: 0 } : view;
    case "dialogue":
      if (b === "b") return WORLD;
      if (b !== "a") return view;
      return view.page + 1 < view.lines.length ? { ...view, page: view.page + 1 } : (view.then ?? WORLD);
    case "board": {
      const papers = contractsFor(view.place);
      if (b === "b") return WORLD;
      if (b === "a") return papers[view.index] ? { kind: "scroll", place: view.place, slug: papers[view.index].slug } : view;
      const index = moveOnBoard(view.index, papers.length, b);
      return index === view.index ? view : { ...view, index };
    }
    case "scroll":
      if (b !== "b") return view;
      return { kind: "board", place: view.place, index: Math.max(0, contractsFor(view.place).findIndex((c) => c.slug === view.slug)) };
    case "menu":
      if (b === "b" || b === "start") return WORLD;
      if (b === "a") return openMenuItem(view.index);
      if (b === "up" || b === "down") return { kind: "menu", index: wrap(view.index + (b === "up" ? -1 : 1), MENU_ITEMS.length) };
      return view;
    case "map":
      if (b === "b") return { kind: "menu", index: 1 };
      if (b === "a") return { kind: "world", travelTo: PLACES[view.index].id };
      if (b === "up" || b === "down") return { kind: "map", index: wrap(view.index + (b === "up" ? -1 : 1), PLACES.length) };
      return view;
    case "hunter":
      return b === "b" ? { kind: "menu", index: 2 } : view;
    case "raven":
      return b === "b" ? { kind: "menu", index: 3 } : view;
    case "degree":
      return b === "b" ? WORLD : view;
  }
}
