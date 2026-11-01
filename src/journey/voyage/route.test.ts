import { expect, test } from "vitest";
import { ROUTE } from "./europe";
import { ROUTE_D, pointAlong, polylineLength } from "./route";

const pts: [number, number][] = [
  [0, 0],
  [10, 0],
  [10, 10],
];

test("measures a polyline", () => {
  expect(polylineLength(pts)).toBe(20);
});

test("finds points by arc length, with the heading of their segment", () => {
  expect(pointAlong(pts, 0.25)).toEqual({ x: 5, y: 0, angle: 0 });
  expect(pointAlong(pts, 0.75)).toEqual({ x: 10, y: 5, angle: 90 });
});

test("clamps outside the route", () => {
  expect(pointAlong(pts, -1)).toMatchObject({ x: 0, y: 0 });
  expect(pointAlong(pts, 2)).toMatchObject({ x: 10, y: 10 });
});

test("ROUTE_D draws the voyage route", () => {
  expect(ROUTE_D.startsWith(`M${ROUTE[0][0]} ${ROUTE[0][1]}`)).toBe(true);
});
