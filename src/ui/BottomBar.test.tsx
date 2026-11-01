import { beforeEach, expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PROJECTS } from "@/content/projects";
import { BottomBar } from "./BottomBar";

beforeEach(() => window.history.replaceState(null, "", "/"));

const projectsButton = () => screen.getByRole("button", { name: "Projects" });

test("Projects fans out one card per project", () => {
  render(<BottomBar />);
  expect(projectsButton()).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(projectsButton());
  expect(projectsButton()).toHaveAttribute("aria-expanded", "true");
  for (const p of PROJECTS) expect(screen.getByRole("button", { name: p.title })).toBeInTheDocument();
});

test("choosing a card opens that project and collapses the fan", () => {
  render(<BottomBar />);
  fireEvent.click(projectsButton());
  fireEvent.click(screen.getByRole("button", { name: "Financial Hub" }));
  expect(window.location.search).toBe("?project=financial-hub");
  expect(projectsButton()).toHaveAttribute("aria-expanded", "false");
});

test("Escape collapses the fan", () => {
  render(<BottomBar />);
  fireEvent.click(projectsButton());
  fireEvent.keyDown(window, { key: "Escape" });
  expect(projectsButton()).toHaveAttribute("aria-expanded", "false");
});

test("About me links to the about page", () => {
  render(<BottomBar />);
  expect(screen.getByRole("link", { name: "About me" })).toHaveAttribute("href", "/about");
});
