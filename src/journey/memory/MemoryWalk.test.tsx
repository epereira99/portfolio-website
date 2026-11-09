import { afterEach, expect, test, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { setScreens } from "../progress";
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

test("renders the walker on the still frame over the road, aria-hidden", () => {
  const { container } = render(<MemoryWalk />);
  expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  expect(container.querySelector("canvas")).not.toBeNull();
  expect(container.querySelector("img")!.getAttribute("src")).toBe("/walk/walk-000.webp");
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

test("with reduced motion the walk frames are never downloaded", async () => {
  const made: string[] = [];
  vi.stubGlobal("Image", class { set src(v: string) { made.push(v); } });
  const realMatchMedia = window.matchMedia;
  vi.stubGlobal("matchMedia", (q: string) => ({ ...realMatchMedia(q), matches: q.includes("reduce") }));
  render(<MemoryWalk />);
  await twoFrames();
  expect(made).toEqual([]);
});
