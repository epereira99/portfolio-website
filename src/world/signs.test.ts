import { expect, test } from "vitest";
import { signNear } from "./signs";

const signs = [
  { tile: { x: 10, y: 5 }, text: "Sweden" },
  { tile: { x: 14, y: 5 }, text: "↑ MSc AI" },
];

test("a sign within two steps reads itself", () => {
  expect(signNear({ x: 10, y: 7 }, signs)).toBe("Sweden");
  expect(signNear({ x: 11, y: 6 }, signs)).toBe("Sweden");
});

test("a sign further away stays quiet", () => {
  expect(signNear({ x: 10, y: 8 }, signs)).toBeNull();
});

test("between two signs, the nearer one reads", () => {
  expect(signNear({ x: 13, y: 6 }, signs)).toBe("↑ MSc AI");
});
