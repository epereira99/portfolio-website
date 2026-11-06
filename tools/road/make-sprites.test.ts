// @vitest-environment node
import { expect, test } from "vitest";
import { keyBackground } from "./make-sprites.mjs";

// 5×5 white image with a dark subject in the middle and a white snow pixel inside it.
const image = () => {
  const px = Array.from({ length: 25 }, (_, i) => {
    const x = i % 5, y = Math.floor(i / 5);
    const inside = x >= 1 && x <= 3 && y >= 1 && y <= 3;
    return inside && !(x === 2 && y === 2) ? [40, 80, 60, 255] : [255, 255, 255, 255];
  });
  return new Uint8Array(px.flat());
};
const alpha = (data: Uint8Array, x: number, y: number) => data[(y * 5 + x) * 4 + 3];

test("the background around the subject turns transparent", () => {
  const data = keyBackground(image(), 5, 5);
  expect(alpha(data, 0, 0)).toBe(0);
  expect(alpha(data, 4, 2)).toBe(0);
});

test("the subject stays opaque, including white snow it encloses", () => {
  const data = keyBackground(image(), 5, 5);
  expect(alpha(data, 1, 1)).toBe(255);
  expect(alpha(data, 2, 2)).toBe(255);
});
