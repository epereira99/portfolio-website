import { useSyncExternalStore } from "react";

// Journey position in screens: the single input for scene and UI. One screen of the journey takes SCROLL_PER_SCREEN
// viewport heights of scrolling, so the walk feels unhurried (Eduardo, 2026-11-02).
export const SCROLL_PER_SCREEN = 1.5;

let screens = 0;
const listeners = new Set<() => void>();

export function getScreens(): number {
  return screens;
}

export function setScreens(s: number): void {
  if (s === screens || !Number.isFinite(s)) return; // NaN would crash the path math every frame
  screens = s;
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useScreens(): number {
  return useSyncExternalStore(subscribe, getScreens, () => 0);
}

export function scrollToScreens(s: number, behavior: ScrollBehavior = "auto"): void {
  window.scrollTo({ top: s * window.innerHeight * SCROLL_PER_SCREEN, behavior });
}

export function readScreensFromWindow(): number {
  return window.innerHeight > 0 ? window.scrollY / (window.innerHeight * SCROLL_PER_SCREEN) : 0; // zero-height windows (hidden panes) exist
}

/** One frame of smoothing toward the scroll position; big jumps (header clicks, reloads) snap instead of spinning the walk. */
export function easeProgress(current: number, target: number): number {
  const gap = Math.abs(target - current);
  return gap > 1 || gap < 0.0005 ? target : current + (target - current) * 0.12;
}
