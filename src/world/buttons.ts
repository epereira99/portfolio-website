// The handheld's buttons. Keyboard and touch controls both press them; the scene and the overlays read them.
export type Dir = "up" | "down" | "left" | "right";
export type Button = Dir | "a" | "b" | "start";

const DIRS: readonly string[] = ["up", "down", "left", "right"];
const KEYS: Record<string, Button> = {
  arrowup: "up", w: "up",
  arrowdown: "down", s: "down",
  arrowleft: "left", a: "left",
  arrowright: "right", d: "right",
  z: "a", enter: "a", " ": "a",
  x: "b", escape: "b", backspace: "b",
  shift: "start", m: "start",
};

let held: Dir[] = []; // in press order; the last one wins
const listeners = new Set<(b: Button) => void>();

export function press(b: Button): void {
  if (DIRS.includes(b)) held = [...held.filter((d) => d !== b), b as Dir];
  listeners.forEach((fn) => fn(b));
}

export function release(b: Button): void {
  held = held.filter((d) => d !== b);
}

export function heldDir(): Dir | null {
  return held.at(-1) ?? null;
}

export function onPress(fn: (b: Button) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function bindKeyboard(target: Window): () => void {
  let shiftAlone = false; // Shift is Start only when tapped on its own, so Shift+Tab stays the browser's
  const down = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    shiftAlone = key === "shift";
    if (e.metaKey || e.ctrlKey || e.altKey) return; // browser shortcuts (Cmd+D, Ctrl+A…)
    if ((key === "enter" || key === " ") && e.target instanceof HTMLAnchorElement) return; // let a focused link open
    const b = KEYS[key];
    if (!b || key === "shift") return;
    e.preventDefault(); // arrows and space would scroll the page
    if (!e.repeat) press(b);
  };
  const up = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === "shift" && shiftAlone) press("start");
    const b = KEYS[key];
    if (b) release(b);
  };
  const blur = () => (held = []);
  target.addEventListener("keydown", down);
  target.addEventListener("keyup", up);
  target.addEventListener("blur", blur);
  return () => {
    target.removeEventListener("keydown", down);
    target.removeEventListener("keyup", up);
    target.removeEventListener("blur", blur);
  };
}

export function resetButtons(): void {
  held = [];
  listeners.clear();
}
