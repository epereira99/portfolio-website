import { afterEach, beforeEach, describe, expect, test } from "vitest";
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

describe("the ending", () => {
  test("invites the visitor into the next chapter with ways to get in touch", () => {
    at(9);
    expect(screen.getByRole("heading", { name: "The next chapter starts here." })).toBeInTheDocument();
    expect(screen.getByText("Want to be part of it?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Email me" })).toHaveAttribute("href", "mailto:eduardoluisvp99@gmail.com");
  });

  test("LinkedIn opens in a new tab without access to this page", () => {
    at(9);
    const link = screen.getByRole("link", { name: "LinkedIn" });
    expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/eduardopereira-/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toMatch(/noopener/);
    expect(link.getAttribute("rel")).toMatch(/noreferrer/);
  });

  test("no CV button until there is a CV to download", () => {
    at(9);
    expect(screen.queryByRole("link", { name: "Download CV" })).toBeNull();
  });

  test("fades in with scroll as the avatar turns", () => {
    at(8.5);
    const block = () => screen.getByRole("heading", { name: "The next chapter starts here." }).parentElement!;
    expect(block().style.opacity).toBe("0");
    act(() => setScreens(8.75));
    expect(block().style.opacity).toBe("1");
  });
});
