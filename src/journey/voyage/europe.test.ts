import { expect, test } from "vitest";
import { JONKOPING, LAND_PATH, PORTO, ROUTE, VIEWBOX } from "./europe";

const inside = ([x, y]: [number, number]) => x >= 0 && x <= VIEWBOX.w && y >= 0 && y <= VIEWBOX.h;

test("the map is a square 1000-unit canvas with a real coastline", () => {
  expect(VIEWBOX).toEqual({ w: 1000, h: 1000 });
  expect(LAND_PATH.startsWith("M")).toBe(true);
  expect(LAND_PATH.length).toBeGreaterThan(1000);
});

test("Porto sits south-west of Jönköping, both on the map", () => {
  expect(inside(PORTO)).toBe(true);
  expect(inside(JONKOPING)).toBe(true);
  expect(PORTO[0]).toBeLessThan(JONKOPING[0]);
  expect(PORTO[1]).toBeGreaterThan(JONKOPING[1]);
});

test("the route runs from Porto to Jönköping through 9 points on the map", () => {
  expect(ROUTE).toHaveLength(9);
  expect(ROUTE[0]).toEqual(PORTO);
  expect(ROUTE.at(-1)).toEqual(JONKOPING);
  ROUTE.forEach((p) => expect(inside(p)).toBe(true));
});
