import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { heldDir, resetButtons } from "../buttons";
import { TouchControls } from "./TouchControls";

test("holding the D-pad holds a direction until the finger lifts", () => {
  resetButtons();
  const original = window.matchMedia;
  window.matchMedia = ((q: string) => ({ ...original(q), matches: q.includes("coarse") })) as typeof window.matchMedia;
  render(<TouchControls />);
  fireEvent.pointerDown(screen.getByRole("button", { name: "Left" }));
  expect(heldDir()).toBe("left");
  fireEvent.pointerUp(screen.getByRole("button", { name: "Left" }));
  expect(heldDir()).toBeNull();
  window.matchMedia = original;
});

test("without a touch screen there are no on-screen controls", () => {
  const { container } = render(<TouchControls />);
  expect(container).toBeEmptyDOMElement();
});
