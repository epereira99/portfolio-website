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

// Eduardo's set (art/memory-prompts.md), spaced along each stage. The nau closes Porto and holds while he boards it
// (boarding.ts); Stadshuset stays behind the ending. Memories without a src aren't shown yet.
const img = (id: MemoryId) => `/memories/${id}.webp`;
export const MEMORIES: Memory[] = [
  { id: "arcada", label: "Arcada", at: 0.3, layout: "side", src: img("arcada") },
  { id: "bom-jesus", label: "Bom Jesus do Monte", at: 0.8, layout: "side", src: img("bom-jesus") },
  { id: "uminho", label: "Universidade do Minho", at: 1.3, layout: "side", src: img("uminho") },
  { id: "porto-ribeira", label: "Ribeira", at: 1.8, layout: "side", src: img("porto-ribeira") },
  { id: "porto-riverside", label: "Ribeira riverside", at: 2.2, layout: "side" },
  { id: "porto-douro", label: "The Douro", at: 2.6, layout: "side" },
  { id: "nau", label: "A nau", at: 3.3, layout: "centre", hold: 0.55, src: img("nau") },
  { id: "jonkoping-university", label: "Jönköping University", at: 5.4, layout: "side" },
  { id: "jonkoping-stora-hotellet", label: "Stora Hotellet", at: 6.2, layout: "side" },
  { id: "stockholm-gamla-stan", label: "Gamla Stan", at: 7.6, layout: "side" },
  { id: "stadshuset", label: "Stadshuset", at: 8.9, layout: "side" },
];

/** x in vw, relative to the memory's base box. */
export type MemoryPose = { opacity: number; x: number; scale: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (edge0: number, edge1: number, v: number) => {
  const t = clamp((v - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export function memoryPose(m: Memory, s: number, reducedMotion: boolean): MemoryPose {
  const d = m.at - s; // screens still ahead; negative once passed
  const out = Math.min(0, d + (m.hold ?? 0)); // the fade-out starts once the hold is over
  const opacity = clamp(smooth(0.7, 0.35, d) * (1 - smooth(0, -0.3, out)), 0, 1);
  const k = reducedMotion ? 1 : clamp(1 - d / 0.7, -0.5, 1.3); // 0 far ahead → 1 alongside
  return m.layout === "side" ? { opacity, x: k * 30, scale: 0.35 + k * 0.75 } : { opacity, x: 0, scale: 0.6 + k * 0.36 };
}
