import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { getScreens, readScreensFromWindow, scrollToScreens, setScreens, subscribe } from "./progress";
import { ScrollDriver } from "./ScrollDriver";
import { TOTAL_SCREENS } from "./timeline";

let scrollTo: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
});
afterEach(() => {
  vi.restoreAllMocks();
  setScreens(0);
});

describe("progress store", () => {
  test("stores the value and notifies subscribers", () => {
    const fn = vi.fn();
    const off = subscribe(fn);
    setScreens(2);
    off();
    expect(getScreens()).toBe(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("a zero-height window reads as the start, never NaN", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 0 });
    expect(readScreensFromWindow()).toBe(0);
  });

  test("ignores non-finite positions so the scene never receives NaN", () => {
    setScreens(3);
    setScreens(NaN);
    setScreens(Infinity);
    expect(getScreens()).toBe(3);
  });

  test("scrollToScreens converts screens to pixels", () => {
    scrollToScreens(3);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 2400 }));
  });
});

describe("ScrollDriver", () => {
  test("the scroll area always reaches the ending, even with mobile toolbars collapsed", () => {
    // innerHeight can exceed svh on phones; lvh is never smaller than innerHeight.
    const { container } = render(createElement(ScrollDriver));
    expect((container.firstChild as HTMLElement).style.height).toBe(`${(TOTAL_SCREENS + 1) * 100}lvh`);
  });

  test("keeps the walker in place when the window is resized", () => {
    render(createElement(ScrollDriver));
    setScreens(5);
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 400 });
    window.dispatchEvent(new Event("resize"));
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 2000 }));
  });
});
