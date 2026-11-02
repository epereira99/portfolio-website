import { readFileSync } from "node:fs";
import { afterEach, expect, test, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { setScreens } from "../progress";
import { MEMORIES } from "./memories";
import { MemoryWalk } from "./MemoryWalk";
import { walkFrame, walkFrameUrl } from "./walk";

afterEach(() => {
  act(() => setScreens(0));
  vi.unstubAllGlobals();
});

// Every preload settles on the next microtask, as loaded or failed.
const stubImages = (ok: boolean) =>
  vi.stubGlobal(
    "Image",
    class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        queueMicrotask(() => (ok ? this.onload : this.onerror)?.());
      }
    },
  );

const twoFrames = () => act(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

test("renders the walker on the still frame, one node per memory, aria-hidden", () => {
  const { container } = render(<MemoryWalk />);
  expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  expect(container.querySelector("img")!.getAttribute("src")).toBe("/walk/walk-000.webp");
  expect(container.querySelectorAll("[data-memory]")).toHaveLength(MEMORIES.length);
});

test("a memory without an image shows its name as a placeholder", () => {
  const pending = MEMORIES.find((m) => !m.src)!;
  const { container } = render(<MemoryWalk />);
  expect(container.querySelector(`[data-memory="${pending.id}"]`)!.textContent).toContain(pending.label);
});

test("scrubs to the frame for the current position once every frame has loaded", async () => {
  stubImages(true);
  act(() => setScreens(1.234));
  const { container } = render(<MemoryWalk />);
  await twoFrames();
  expect(container.querySelector("img")!.getAttribute("src")).toBe(walkFrameUrl(walkFrame(1.234)));
});

test("keeps the still frame when frames fail to load", async () => {
  stubImages(false);
  act(() => setScreens(1.234));
  const { container } = render(<MemoryWalk />);
  await twoFrames();
  expect(container.querySelector("img")!.getAttribute("src")).toBe("/walk/walk-000.webp");
});

test("a memory alongside the walker is visible, one far ahead is not", async () => {
  const bom = MEMORIES.find((m) => m.id === "bom-jesus")!;
  act(() => setScreens(bom.at));
  const { container } = render(<MemoryWalk />);
  await twoFrames();
  expect((container.querySelector('[data-memory="bom-jesus"]') as HTMLElement).style.opacity).toBe("1");
  expect((container.querySelector('[data-memory="stadshuset"]') as HTMLElement).style.opacity).toBe("0");
});

test("does not pull in three.js", () => {
  const src = readFileSync("src/journey/memory/MemoryWalk.tsx", "utf8");
  expect(src).not.toMatch(/three|@react-three|\/scene\/|\/art\/|\.\.\/path/);
});

test("with reduced motion the walk frames are never downloaded", async () => {
  const made: string[] = [];
  vi.stubGlobal("Image", class { set src(v: string) { made.push(v); } });
  const realMatchMedia = window.matchMedia;
  vi.stubGlobal("matchMedia", (q: string) => ({ ...realMatchMedia(q), matches: q.includes("reduce") }));
  render(<MemoryWalk />);
  await twoFrames();
  expect(made).toEqual([]);
});
