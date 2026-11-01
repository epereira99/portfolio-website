import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
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

test("leads with the stage title and shows progress through the stage", () => {
  at(2);
  const nav = screen.getByRole("navigation", { name: "Journey" });
  const title = within(nav).getByText("Deloitte");
  expect(title.tagName).toBe("STRONG");
  expect(screen.getByRole("button", { name: "Porto" }).style.getPropertyValue("--progress")).toBe("0.25");
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

test("chapter jumps don't animate when the visitor prefers reduced motion", () => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (q: string) => ({ matches: q.includes("reduce"), media: q }) as MediaQueryList,
  );
  at(2);
  fireEvent.click(screen.getByRole("button", { name: "Stockholm" }));
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 7 * 800, behavior: "auto" });
});

test("stays out of the way during the home intro", () => {
  const { container } = at(0.2);
  expect(container.querySelector("nav")).toHaveAttribute("aria-hidden", "true");
});

test("cities behind you are marked done", () => {
  at(2);
  expect(screen.getByRole("button", { name: "Braga" })).toHaveAttribute("data-done", "true");
  expect(screen.getByRole("button", { name: "Porto" })).not.toHaveAttribute("data-done");
  expect(screen.getByRole("button", { name: "Jönköping" })).not.toHaveAttribute("data-done");
  expect(screen.getByRole("button", { name: "Stockholm" })).not.toHaveAttribute("data-done");
});

test("at the ending every city is done and the header looks ahead", () => {
  at(9);
  for (const city of ["Braga", "Porto", "Jönköping", "Stockholm"]) {
    const button = screen.getByRole("button", { name: city });
    expect(button).toHaveAttribute("data-done", "true");
    expect(button).not.toHaveAttribute("aria-current");
  }
  expect(screen.getByRole("navigation", { name: "Journey" })).toHaveTextContent("Today · Stockholm — the next chapter");
});
