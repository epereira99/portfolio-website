import { segmentStart } from "../timeline";

export type MemoryId =
  | "arcada"
  | "bom-jesus"
  | "uminho"
  | "porto-ribeira"
  | "porto-riverside"
  | "porto-douro"
  | "nau"
  | "jonkoping-university"
  | "jonkoping-stora-hotellet"
  | "stockholm-gamla-stan"
  | "stadshuset";

/** at: journey position in screens where the walker is alongside it. hold: screens it stays fully visible after that.
 * src: unset until Eduardo's painting exists. */
export type Memory = { id: MemoryId; label: string; at: number; layout: "side" | "centre"; hold?: number; src?: string };

// Eduardo's set (art/memory-prompts.md), half a screen apart: each is gone before the next appears. The nau closes
// Porto and holds while he boards it (boarding.ts); Stadshuset stays behind the ending. Memories without a src aren't
// shown yet.
const img = (id: MemoryId) => `/memories/${id}.webp`;
const braga = segmentStart("braga");
const porto = segmentStart("porto");
const jonkoping = segmentStart("jonkoping");
const stockholm = segmentStart("stockholm");
export const MEMORIES: Memory[] = [
  { id: "arcada", label: "Arcada", at: braga + 0.3, layout: "side", src: img("arcada") },
  { id: "bom-jesus", label: "Bom Jesus do Monte", at: braga + 0.8, layout: "side", src: img("bom-jesus") },
  { id: "uminho", label: "Universidade do Minho", at: braga + 1.3, layout: "side", src: img("uminho") },
  { id: "porto-ribeira", label: "Ribeira", at: porto + 0.3, layout: "side", src: img("porto-ribeira") },
  { id: "porto-riverside", label: "Ribeira riverside", at: porto + 0.8, layout: "side" },
  { id: "porto-douro", label: "The Douro", at: porto + 1.3, layout: "side" },
  { id: "nau", label: "A nau", at: segmentStart("voyage") - 0.2, layout: "centre", hold: 0.55, src: img("nau") },
  { id: "jonkoping-university", label: "Jönköping University", at: jonkoping + 0.4, layout: "side" },
  { id: "jonkoping-stora-hotellet", label: "Stora Hotellet", at: jonkoping + 1.2, layout: "side" },
  { id: "stockholm-gamla-stan", label: "Gamla Stan", at: stockholm + 0.6, layout: "side" },
  { id: "stadshuset", label: "Stadshuset", at: stockholm + 1.9, layout: "side" },
];

/** x: how far a side memory has slid from the path ahead to its place on the right (0 → 1); centre memories stay 0. */
export type MemoryPose = { opacity: number; x: number; scale: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (edge0: number, edge1: number, v: number) => {
  const t = clamp((v - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export function memoryPose(m: Memory, s: number, reducedMotion: boolean): MemoryPose {
  const d = m.at - s; // screens still ahead; negative once passed
  const out = Math.min(0, d + (m.hold ?? 0)); // the fade-out starts once the hold is over
  const opacity = clamp(smooth(0.3, 0.15, d) * (1 - smooth(0, -0.12, out)), 0, 1); // visible ≈ at − 0.3 … at + 0.12
  const k = reducedMotion ? 1 : clamp(1 - d / 0.3, 0, 1.3); // 0 far ahead → 1 alongside
  return m.layout === "side" ? { opacity, x: k, scale: 0.35 + k * 0.65 } : { opacity, x: 0, scale: 0.6 + k * 0.36 };
}
