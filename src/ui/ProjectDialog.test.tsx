import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { ProjectDialog } from "./ProjectDialog";
import { useOpenProject } from "./useOpenProject";

const goTo = (url: string) => window.history.replaceState(null, "", url);

beforeEach(() => goTo("/"));
afterEach(() => {
  const { result } = renderHook(() => useOpenProject());
  act(() => result.current.close());
  vi.restoreAllMocks();
});

test("a shared link opens that project's dialog", () => {
  goTo("/?project=financial-hub");
  render(<ProjectDialog />);
  expect(screen.getByRole("dialog", { name: "Financial Hub" })).toBeInTheDocument();
});

test("an unknown or empty project link is ignored", () => {
  goTo("/?project=does-not-exist");
  const { unmount } = render(<ProjectDialog />);
  expect(screen.queryByRole("dialog")).toBeNull();
  unmount();
  goTo("/?project=");
  render(<ProjectDialog />);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("open and close keep the URL in sync", () => {
  const { result } = renderHook(() => useOpenProject());
  act(() => result.current.open("saab-thesis"));
  expect(window.location.search).toBe("?project=saab-thesis");
  act(() => result.current.close());
  expect(window.location.search).toBe("");
});

test("Escape and the close button both close it", () => {
  goTo("/?project=financial-hub");
  render(<ProjectDialog />);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();

  const { result } = renderHook(() => useOpenProject());
  act(() => result.current.open("financial-hub"));
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("opening a project pauses the walk and closing resumes from the same spot", () => {
  const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(window, "scrollY", { configurable: true, value: 1600 });
  render(<ProjectDialog />);
  const { result } = renderHook(() => useOpenProject());
  act(() => result.current.open("mambu-migration"));
  expect(document.documentElement.style.overflow).toBe("hidden");
  act(() => result.current.close());
  expect(document.documentElement.style.overflow).toBe("");
  expect(scrollTo).not.toHaveBeenCalled();
});

test("a degree opens with its description and every subject", () => {
  goTo("/?project=msc-ai-engineering");
  render(<ProjectDialog />);
  const dialog = screen.getByRole("dialog", { name: "MSc AI Engineering" });
  expect(dialog).toHaveTextContent("AI Driven Sensor Optimization For Marksman Posture Analysis");
  expect(screen.getByRole("list", { name: "Courses" }).querySelectorAll("li")).toHaveLength(12);
});

test("degree cards have no image on top; the BSc logo sits at the top right, beside the title", () => {
  goTo("/?project=bsc-computer-science");
  render(<ProjectDialog />);
  const dialog = screen.getByRole("dialog", { name: "BSc Computer Science" });
  expect(dialog.querySelector("[data-graphic]")).toBeNull();
  const logo = screen.getByRole("img", { name: "University of Minho" });
  expect(logo).toHaveAttribute("src", "/degrees/uminho-symbol.png");
  expect(logo.closest("header")).toContainElement(screen.getByRole("heading", { name: "BSc Computer Science" }));
});

test("project cards keep their graphic on top", () => {
  goTo("/?project=financial-hub");
  render(<ProjectDialog />);
  expect(screen.getByRole("dialog", { name: "Financial Hub" }).querySelector("[data-graphic]")).not.toBeNull();
});
