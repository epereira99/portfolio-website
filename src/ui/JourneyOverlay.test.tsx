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

test("announces the stage with a chapter title as you enter Porto", () => {
  at(1.6);
  expect(screen.getByText("Chapter 2 · Porto")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 2, name: "Deloitte" })).toBeInTheDocument();
  expect(screen.getByText("Cloud & DevOps → Integration Software · 2022–2024")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /read more/i })).toBeNull();
});

test("the chapter title shrinks up and away as you walk on", () => {
  at(1.5);
  const start = screen.getByRole("heading", { name: "Deloitte" }).parentElement!.style;
  expect(start.opacity).toBe("1");
  act(() => setScreens(1.79));
  const late = screen.getByRole("heading", { name: "Deloitte" }).parentElement!.style;
  expect(Number(late.opacity)).toBeLessThan(0.6);
  expect(late.transform).toMatch(/scale\(0\.[0-9]+\)/);
});

test("shows nothing between projects", () => {
  at(4);
  expect(screen.queryByRole("heading")).toBeNull();
  expect(screen.queryByRole("button", { name: /read more/i })).toBeNull();
});
