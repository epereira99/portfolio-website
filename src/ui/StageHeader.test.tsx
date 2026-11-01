import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { setScreens } from "@/journey/progress";
import { StageHeader } from "./StageHeader";

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
});
afterEach(() => {
  vi.restoreAllMocks();
  act(() => setScreens(0));
});

const at = (s: number) => {
  const view = render(<StageHeader />);
  act(() => setScreens(s));
  return view;
};

test("highlights the current city and shows its stage", () => {
  at(2);
  expect(screen.getByRole("button", { name: "Porto" })).toHaveAttribute("aria-current", "step");
  expect(screen.getByRole("navigation", { name: "Journey" })).toHaveTextContent("Deloitte · Cloud & DevOps");
});

test("shows the voyage between Porto and Jönköping with no city current", () => {
  at(4);
  expect(screen.getByText("At sea · Porto → Jönköping")).toBeInTheDocument();
  screen.getAllByRole("button").forEach((b) => expect(b).not.toHaveAttribute("aria-current"));
});

test("clicking a city jumps to the start of its stage", () => {
  at(2);
  fireEvent.click(screen.getByRole("button", { name: "Stockholm" }));
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 7 * 800, behavior: "smooth" });
});

test("stays out of the way during the home intro", () => {
  const { container } = at(0.2);
  expect(container.querySelector("nav")).toHaveAttribute("aria-hidden", "true");
});
