import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { PROJECTS, TOPICS, projectsForTopic } from "@/content/projects";
import { BottomBar } from "./BottomBar";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

test("About me takes you to the camp (#about)", () => {
  render(<BottomBar />);
  expect(screen.getByRole("link", { name: "About me" })).toHaveAttribute("href", "#about");
});

test("every project sits in exactly one folder", () => {
  const filed = TOPICS.flatMap((t) => projectsForTopic(t.id).map((p) => p.slug));
  expect(filed.sort()).toEqual(PROJECTS.map((p) => p.slug).sort());
});
