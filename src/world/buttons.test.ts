import { beforeEach, expect, test } from "vitest";
import { bindKeyboard, heldDir, onPress, press, release, resetButtons } from "./buttons";
beforeEach(resetButtons);

test("the latest held direction wins, and releasing it falls back to the earlier one", () => {
  press("left");
  press("up");
  expect(heldDir()).toBe("up");
  release("up");
  expect(heldDir()).toBe("left");
});

test("presses notify listeners once, and auto-repeat does not re-fire", () => {
  const seen: string[] = [];
  const off = onPress((b) => seen.push(b));
  const unbind = bindKeyboard(window);
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "z" }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", repeat: true }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
  expect(seen).toEqual(["a", "b", "start"]);
  off();
  unbind();
});

test("losing window focus releases every held direction", () => {
  const unbind = bindKeyboard(window);
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
  window.dispatchEvent(new Event("blur"));
  expect(heldDir()).toBeNull();
  unbind();
});
