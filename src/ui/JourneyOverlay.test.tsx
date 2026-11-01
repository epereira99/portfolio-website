import { afterEach, beforeEach, expect, test } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { setScreens } from "@/journey/progress";
import { JourneyOverlay } from "./JourneyOverlay";

beforeEach(() => window.history.replaceState(null, "", "/"));
afterEach(() => act(() => setScreens(0)));

const at = (s: number) => {
  render(<JourneyOverlay />);
  act(() => setScreens(s));
};

test("introduces Eduardo at the start", () => {
  at(0);
  expect(screen.getByRole("heading", { level: 1, name: "Eduardo Pereira" })).toBeInTheDocument();
  expect(screen.getByText("AI / ML / Software Engineer")).toBeInTheDocument();
});

test("shows the current project with a Read more that opens it", () => {
  at(2);
  expect(screen.getByRole("heading", { name: "Mambu migration tool" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /read more/i }));
  expect(window.location.search).toBe("?project=mambu-migration");
});

test("shows nothing between projects", () => {
  at(4);
  expect(screen.queryByRole("heading")).toBeNull();
  expect(screen.queryByRole("button", { name: /read more/i })).toBeNull();
});
