import { useSyncExternalStore } from "react";
import { onPress } from "./buttons";
import { contractPath, WORLD_PATH } from "./config";
import { reduce, WORLD, type View } from "./view";
import { contractBySlug } from "@/content/contracts";

// The view on screen, mirrored to /contracts/<slug> while a scroll is open so it can be shared.
let view: View = WORLD;
let started = false;
const listeners = new Set<() => void>();

const slugOf = (v: View) => (v.kind === "scroll" ? v.slug : null);

function apply(next: View, fromHistory: boolean) {
  const prevSlug = slugOf(view);
  const nextSlug = slugOf(next);
  view = next;
  if (!fromHistory) {
    if (nextSlug && nextSlug !== prevSlug) {
      window.history.pushState({ contract: nextSlug }, "", contractPath(nextSlug));
    } else if (prevSlug && !nextSlug) {
      // Undo our own push so Back doesn't reopen the scroll; a deep link has nothing to undo.
      if (window.history.state?.contract) window.history.back();
      else window.history.replaceState(null, "", WORLD_PATH);
    }
  }
  listeners.forEach((fn) => fn());
}

export function getView(): View {
  return view;
}

export function setView(next: View): void {
  apply(next, false);
}

export { initialViewFor } from "./view";

function onPopState() {
  const slug = window.location.pathname.match(/^\/contracts\/([^/]+)$/)?.[1];
  if (slug && contractBySlug(slug)) apply({ kind: "scroll", place: view.kind === "board" ? view.place : "all", slug }, true);
  else if (view.kind === "scroll") apply(reduce(view, "b"), true);
}

const worldA = new Set<() => void>();

/** A pressed while the world was already on screen (not the A that just closed a dialogue). For the scene. */
export function onWorldA(fn: () => void): () => void {
  worldA.add(fn);
  return () => worldA.delete(fn);
}

export function startStore(initial: View): () => void {
  view = initial;
  started = true;
  listeners.forEach((fn) => fn());
  const off = onPress((b) => {
    const before = view;
    setView(reduce(before, b));
    if (b === "a" && before.kind === "world") worldA.forEach((fn) => fn());
  });
  window.addEventListener("popstate", onPopState);
  return () => {
    off();
    window.removeEventListener("popstate", onPopState);
    started = false;
  };
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// The sign the hunter stands near, read out without an A press. Set by the scene.
let nearbySign: string | null = null;

export function setNearbySign(text: string | null): void {
  if (text === nearbySign) return;
  nearbySign = text;
  listeners.forEach((fn) => fn());
}

export function useNearbySign(): string | null {
  return useSyncExternalStore(subscribe, () => nearbySign, () => null);
}

/** initial: the view the page was rendered with, used on the server and until the store starts. */
export function useView(initial: View): View {
  return useSyncExternalStore(subscribe, () => (started ? view : initial), () => initial);
}
