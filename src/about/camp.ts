import { useSyncExternalStore } from "react";
import { pointAt } from "@/journey/lowpoly/path";

/** How far along the road the camp is (world units; he covers 14 a screen and stops at 161: the camp stays just short of it), and how far off its
 * left side: the meadow there is kept clear of trees (tools/blender/lowpoly/scene.py, open_near_path). */
export const CAMP_ALONG = 157;
export const CAMP_OFF = 7.5;

/** The camp's centre (where he sits) and its turn: the camp's own +Z, the way he faces, points back at the road. */
export function campSpot(): { x: number; z: number; yaw: number } {
  const w = pointAt(CAMP_ALONG);
  const right = [Math.cos(w.heading), -Math.sin(w.heading)]; // his right as he walks
  return { x: w.x - right[0] * CAMP_OFF, z: w.z - right[1] * CAMP_OFF, yaw: w.heading + Math.PI / 2 };
}

// About me is the camp, kept in the URL (#about) so the browser's Back button leaves it.
const isCamp = () => typeof window !== "undefined" && window.location.hash === "#about";
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("hashchange", fn);
  window.addEventListener("popstate", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("hashchange", fn);
    window.removeEventListener("popstate", fn);
  };
}

export const useCamp = () => useSyncExternalStore(subscribe, isCamp, () => false);

/** Leaves the camp for the journey, without the jump to the top that clearing the hash by hand would cause. */
export function leaveCamp() {
  if (!isCamp()) return;
  history.pushState(null, "", window.location.pathname + window.location.search);
  listeners.forEach((fn) => fn());
}

/** What the 3D world draws, the camp or the walk: flipped under the fade's black, a beat after the URL changes. */
export const campView = { shown: false };

/** A point in the camp's own frame (+Z toward the road) placed in the world, turned `extra` more around his seat. */
export function campToWorld(x: number, y: number, z: number, extra = 0): [number, number, number] {
  const s = campSpot();
  const a = s.yaw + extra;
  return [s.x + x * Math.cos(a) + z * Math.sin(a), y, s.z - x * Math.sin(a) + z * Math.cos(a)];
}

const H_FOV = 58;
const MAX_V_FOV = 75;

/** The camp's shot: from the road side, facing him over the fire, the tent behind him; `yaw` is the viewer's drag. */
export function campCamera(aspect: number, yaw = 0) {
  const vfov = (2 * Math.atan(Math.tan((H_FOV * Math.PI) / 360) / aspect) * 180) / Math.PI;
  return {
    position: campToWorld(0.6, 3.1, 7.6, yaw),
    target: campToWorld(0.5, 0.75, 0.3),
    fov: Math.min(vfov, MAX_V_FOV),
  };
}

// The thing whose card is open, shared by the 3D camp (clicks) and the page (the card itself).
let opened: string | null = null;
const openers = new Set<() => void>();
export function openThing(id: string | null) {
  opened = id;
  openers.forEach((fn) => fn());
}
export const useOpenThing = () =>
  useSyncExternalStore(
    (fn) => (openers.add(fn), () => void openers.delete(fn)),
    () => opened,
    () => null,
  );
