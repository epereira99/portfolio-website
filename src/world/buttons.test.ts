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
  window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
  expect(seen).toEqual(["a", "b", "start"]);
  off();
  unbind();
});

test("browser shortcuts and Shift+Tab stay the browser's", () => {
  const seen: string[] = [];
  const off = onPress((b) => seen.push(b));
  const unbind = bindKeyboard(window);
  const ctrlA = new KeyboardEvent("keydown", { key: "a", ctrlKey: true, cancelable: true });
  window.dispatchEvent(ctrlA);
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", metaKey: true }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" }));
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true }));
  window.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }));
  expect(seen).toEqual([]);
  expect(ctrlA.defaultPrevented).toBe(false);
  off();
  unbind();
});

test("Enter on a focused link follows the link instead of pressing A", () => {
  const seen: string[] = [];
  const off = onPress((b) => seen.push(b));
  const unbind = bindKeyboard(window);
  const link = document.body.appendChild(document.createElement("a"));
  link.href = "mailto:x@example.com";
  const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
  link.dispatchEvent(enter);
  expect(seen).toEqual([]);
  expect(enter.defaultPrevented).toBe(false);
  link.remove();
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
