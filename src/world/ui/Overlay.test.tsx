import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { press } from "../buttons";
import { Overlay } from "./Overlay";
import type { View } from "../view";

const show = (v: View) => render(<Overlay initial={v} />);

test("the world shows no overlay", () => {
  expect(show({ kind: "world" }).container).toBeEmptyDOMElement();
});

test("the main board pins all six contracts with the selected one marked", () => {
  show({ kind: "board", place: "all", index: 3 });
  const papers = screen.getAllByRole("button", { name: / · / });
  expect(papers).toHaveLength(6);
  expect(papers[3]).toHaveAttribute("aria-current", "true");
  expect(papers[3]).toHaveAccessibleName(/^Saab · Jönköping · /);
});

test("a scroll shows the header fields and body in order", () => {
  show({ kind: "scroll", place: "all", slug: "saab-thesis" });
  expect(screen.getByRole("heading", { name: "Predicting shooting performance from motion" })).toBeVisible();
  expect(screen.getByText("Saab · Jönköping")).toBeVisible();
  expect(screen.getAllByRole("term").map((t) => t.textContent)).toEqual(["Village", "Date", "Duration", "Reason", "Goal", "Work"]);
  expect(screen.getByLabelText("Contract completed")).toBeVisible();
});

test("the Start menu lists its four items in order", () => {
  show({ kind: "menu", index: 0 });
  expect(screen.getAllByRole("listitem").map((li) => li.textContent?.replace("▶", "").trim())).toEqual([
    "Contracts",
    "Map",
    "Hunter",
    "Send a raven",
  ]);
});

test("Up and Down scroll a long degree for keyboard players", () => {
  const scrollBy = vi.fn();
  HTMLElement.prototype.scrollBy = scrollBy;
  show({ kind: "degree", slug: "bsc-computer-science" });
  press("down");
  expect(scrollBy).toHaveBeenCalledWith({ top: 64 });
});

test("an open scroll sits over its board, which is inert", () => {
  const { container } = show({ kind: "scroll", place: "ju", slug: "saab-thesis" });
  expect(container.querySelector("[inert] [aria-current]")).toHaveAttribute("aria-label", "Saab · Jönköping · Predicting shooting performance from motion");
});

test("the raven panel links to email and LinkedIn", () => {
  show({ kind: "raven" });
  expect(screen.getByRole("link", { name: /eduardoluisvp99@gmail.com/ })).toHaveAttribute("href", "mailto:eduardoluisvp99@gmail.com");
  expect(screen.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute("href", "https://www.linkedin.com/in/eduardopereira-/");
});
