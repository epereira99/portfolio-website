import { expect, test } from "vitest";
import { ROUTE } from "./europe";
import { ROUTE_D, pointAlong, polylineLength, shipTransform } from "./route";

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

test("the map's ship stays upright: mirrored when sailing west, tilted at most 15°", () => {
  expect(shipTransform(10, 20, 0)).toBe("translate(10.0 20.0) rotate(0.0)");
  expect(shipTransform(10, 20, -50)).toBe("translate(10.0 20.0) rotate(-15.0)");
  expect(shipTransform(10, 20, -103)).toBe("translate(10.0 20.0) rotate(15.0) scale(-1 1)");
  expect(shipTransform(10, 20, 180)).toBe("translate(10.0 20.0) rotate(0.0) scale(-1 1)");
});

test("ROUTE_D draws the voyage route", () => {
  expect(ROUTE_D.startsWith(`M${ROUTE[0][0]} ${ROUTE[0][1]}`)).toBe(true);
});
