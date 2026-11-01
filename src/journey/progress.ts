import { useSyncExternalStore } from "react";

// Journey position in screens (scrollY / innerHeight): the single input for scene and UI.
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
  window.scrollTo({ top: s * window.innerHeight, behavior });
}

export function readScreensFromWindow(): number {
  return window.innerHeight > 0 ? window.scrollY / window.innerHeight : 0; // zero-height windows (hidden panes) exist
}
