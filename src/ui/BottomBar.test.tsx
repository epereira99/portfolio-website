import { beforeEach, expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PROJECTS } from "@/content/projects";
import { BottomBar } from "./BottomBar";
import { ProjectDialog } from "./ProjectDialog";

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

test("closing a project opened from the fan returns focus to Projects", () => {
  render(
    <>
      <BottomBar />
      <ProjectDialog />
    </>,
  );
  projectsButton().focus();
  fireEvent.click(projectsButton());
  const card = screen.getByRole("button", { name: "Financial Hub" });
  card.focus();
  fireEvent.click(card);
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(document.activeElement).toBe(projectsButton());
});

test("About me links to the about page", () => {
  render(<BottomBar />);
  expect(screen.getByRole("link", { name: "About me" })).toHaveAttribute("href", "/about");
});
