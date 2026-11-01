import { useSyncExternalStore } from "react";
import { projectBySlug } from "@/content/projects";

// Which project's dialog is open, mirrored to ?project=<slug> so it can be shared.
let slug: string | null = null;
let returnFocus: HTMLElement | null = null;
const listeners = new Set<() => void>();

function set(next: string | null) {
  slug = next;
  const url = new URL(window.location.href);
  if (next) url.searchParams.set("project", next);
  else url.searchParams.delete("project");
  window.history.replaceState(window.history.state, "", url);
  listeners.forEach((fn) => fn());
}

/** returnTo: where focus goes on close, for openers that disappear (e.g. a fan card). */
export function openProject(next: string, returnTo?: HTMLElement | null): void {
  returnFocus = returnTo ?? null;
  set(next);
}

export function closeProject(): void {
  set(null);
}

export function takeReturnFocus(): HTMLElement | null {
  const el = returnFocus;
  returnFocus = null;
  return el;
}

export function syncOpenProjectFromUrl(): void {
  const fromUrl = new URLSearchParams(window.location.search).get("project");
  const next = fromUrl && projectBySlug(fromUrl) ? fromUrl : null;
  if (next !== slug) {
    slug = next;
    listeners.forEach((fn) => fn());
  }
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function useOpenProject() {
  const current = useSyncExternalStore(subscribe, () => slug, () => null);
  return { slug: current, open: openProject, close: closeProject };
}
