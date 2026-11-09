import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { projectsForTopic } from "@/content/projects";
import { ProjectDialog } from "../ProjectDialog";
import { useOpenProject } from "../useOpenProject";
import { TreeMenu as Menu } from "./TreeMenu";

const reduce = (on: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (q: string) => ({ matches: on && q.includes("reduce"), media: q }) as MediaQueryList,
  );

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  reduce(true); // animations jump to their end, so each step can be checked straight away
});
afterEach(() => {
  const { result } = renderHook(() => useOpenProject());
  act(() => result.current.close());
  vi.restoreAllMocks();
});

const projects = () => screen.getByRole("button", { name: "Projects" });
const folder = (label: string) => screen.getByRole("button", { name: new RegExp(`^${label},`) });

describe("the Projects menu", () => {
  test("opens on three folders, and a folder shows its projects", () => {
    render(<Menu />);
    expect(projects()).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(projects());
    expect(projects()).toHaveAttribute("aria-expanded", "true");
    expect(folder("Software")).toHaveAccessibleName("Software, 4 projects");
    expect(folder("AI")).toBeInTheDocument();
    expect(folder("Awards")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Financial Hub" })).toBeNull();

    fireEvent.click(folder("Software"));
    const list = screen.getByRole("list", { name: "Software" });
    const expected = projectsForTopic("software");
    expect(within(list).getAllByRole("button")).toHaveLength(expected.length);
    for (const p of expected) expect(within(list).getByRole("button", { name: p.title })).toBeInTheDocument();
  });

  test("choosing a project opens it and closes the menu", () => {
    render(<Menu />);
    fireEvent.click(projects());
    fireEvent.click(folder("Awards"));
    fireEvent.click(screen.getByRole("button", { name: "JIBS 24h Case Competition" }));
    expect(window.location.search).toBe("?project=jibs-case-competition");
    expect(projects()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /^Awards,/ })).toBeNull();
  });

  test("Escape steps back from a folder, then closes, handing focus back to Projects", () => {
    render(<Menu />);
    fireEvent.click(projects());
    fireEvent.click(folder("AI"));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(projects()).toHaveAttribute("aria-expanded", "true");
    expect(folder("AI")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list", { name: "AI" })).toBeNull();
    expect(document.activeElement).toBe(folder("AI"));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(projects()).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(projects());
  });

  test("a click outside closes it", () => {
    render(<Menu />);
    fireEvent.click(projects());
    fireEvent.pointerDown(document.body);
    expect(projects()).toHaveAttribute("aria-expanded", "false");
  });

  test("closing a project opened from it returns focus to Projects", () => {
    render(
      <>
        <Menu />
        <ProjectDialog />
      </>,
    );
    projects().focus();
    fireEvent.click(projects());
    fireEvent.click(folder("Software"));
    fireEvent.click(screen.getByRole("button", { name: "Financial Hub" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(document.activeElement).toBe(projects());
  });

  test("with animations on, it stays until its exit has played, then goes", async () => {
    vi.restoreAllMocks();
    reduce(false);
    render(<Menu />);
    fireEvent.click(projects());
    fireEvent.click(projects());
    expect(projects()).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByRole("button", { name: /^Software,/ })).toBeNull(), { timeout: 3000 });
  });
});
