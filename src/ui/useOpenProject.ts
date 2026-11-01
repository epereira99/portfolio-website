import { useSyncExternalStore } from "react";
import { projectBySlug } from "@/content/projects";

// Which project's dialog is open, mirrored to ?project=<slug> so it can be shared.
let slug: string | null = null;
const listeners = new Set<() => void>();

function set(next: string | null) {
  slug = next;
  const url = new URL(window.location.href);
  if (next) url.searchParams.set("project", next);
  else url.searchParams.delete("project");
  window.history.replaceState(window.history.state, "", url);
  listeners.forEach((fn) => fn());
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
  return {
    slug: current,
    open: (next: string) => set(next),
    close: () => set(null),
  };
}
