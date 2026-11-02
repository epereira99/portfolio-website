export type MemoryId =
  | "arcada"
  | "bom-jesus"
  | "uminho"
  | "clerigos"
  | "dom-luis"
  | "nau"
  | "jonkoping-university"
  | "stadshuset";

/** at: journey position in screens where the walker is alongside it. src: unset until Eduardo's painting exists. */
export type Memory = { id: MemoryId; label: string; at: number; layout: "side" | "centre"; src?: string };

// Positions follow the 3D landmarks' path distances ÷ 40, with the nau at the voyage's start and Stadshuset behind the ending.
export const MEMORIES: Memory[] = [
  { id: "arcada", label: "Arcada", at: 0.3, layout: "side" },
  { id: "bom-jesus", label: "Bom Jesus do Monte", at: 0.75, layout: "side" },
  { id: "uminho", label: "Universidade do Minho", at: 1.2, layout: "side" },
  { id: "clerigos", label: "Clérigos", at: 2.2, layout: "side" },
  { id: "dom-luis", label: "Ponte Dom Luís I", at: 2.95, layout: "side" },
  { id: "nau", label: "A nau", at: 3.7, layout: "centre" },
  { id: "jonkoping-university", label: "Jönköping University", at: 5.4, layout: "side" },
  { id: "stadshuset", label: "Stadshuset", at: 8.6, layout: "side" },
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
  const opacity = clamp(smooth(1.0, 0.5, d) * (1 - smooth(0, -0.4, d)), 0, 1);
  const k = reducedMotion ? 1 : clamp(1 - d, -0.5, 1.3); // 0 far ahead → 1 alongside
  return m.layout === "side" ? { opacity, x: k * 30, scale: 0.35 + k * 0.75 } : { opacity, x: 0, scale: 0.5 + k * 0.9 };
}
