import type { StageId } from "@/content/stages";
import { ENDING_START, SEGMENTS, segmentStart } from "../timeline";

/** The scene's parts by material name (tools/blender/lowpoly): each gets one flat colour per time of day. */
export const SLOTS = [
  "ground", "path", "tree", "trunk", "rock", "ridge_near", "ridge_mid", "ridge_far", "cloud", "figure",
] as const;
export type Slot = (typeof SLOTS)[number];

/** The look at one moment of the day: a three-stop sky and a flat colour for every part. sRGB hex. */
export type Daylight = { skyTop: string; skyMid: string; skyHorizon: string; palette: Record<Slot, string> };

// One day across the career (Eduardo, 2026-11-04): it starts in the morning with the BSc and ends at dusk, today.
// Flat, hand-picked colours like the approved mockup (dusk is mockup A's), never lit: Blender bakes two tones per
// face into the models, these set what those tones are. `figure` tints the walker's own colours.
export const DAY: Record<StageId, Daylight> = {
  braga: {
    skyTop: "#7d9cc4", skyMid: "#e8b8a8", skyHorizon: "#f8e2c8",
    palette: {
      ground: "#6f8c6a", path: "#d0a77e", tree: "#3f6656", trunk: "#5a4434", rock: "#9a9aa0",
      ridge_near: "#85849f", ridge_mid: "#9d9ab8", ridge_far: "#b7b3cc", cloud: "#fbe9de", figure: "#e8e0e0",
    },
  },
  porto: {
    skyTop: "#4f86c6", skyMid: "#8fbbe0", skyHorizon: "#d8ecf6",
    palette: {
      ground: "#7fa865", path: "#d9b48a", tree: "#3f6b4f", trunk: "#5a4434", rock: "#a0a0a0",
      ridge_near: "#6f88ad", ridge_mid: "#8aa2c4", ridge_far: "#a9bcd6", cloud: "#ffffff", figure: "#ffffff",
    },
  },
  jonkoping: {
    skyTop: "#5a7fb0", skyMid: "#d9b38a", skyHorizon: "#f4dcb0",
    palette: {
      ground: "#6f8a58", path: "#c99a6c", tree: "#36594a", trunk: "#4e3a2c", rock: "#908a88",
      ridge_near: "#7f6c80", ridge_mid: "#9a8496", ridge_far: "#b49fa8", cloud: "#f8e6cc", figure: "#f0e0d0",
    },
  },
  stockholm: {
    skyTop: "#3b3a63", skyMid: "#d98a6c", skyHorizon: "#f2c38f",
    palette: {
      ground: "#4b5e5a", path: "#b98b66", tree: "#2f4a42", trunk: "#3a2f2a", rock: "#6b6a72",
      ridge_near: "#5d4c70", ridge_mid: "#6f5a7e", ridge_far: "#7d6788", cloud: "#e9a88a", figure: "#8a7a8a",
    },
  },
};

// Each stage's look is fullest mid-stage; dusk lands where he stops.
const KEYS = SEGMENTS.map(({ id, screens }) => ({
  at: id === "stockholm" ? ENDING_START : segmentStart(id) + screens / 2,
  day: DAY[id],
}));

const toLinear = (hex: string) => [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255) ** 2.2);
const toHex = (rgb: number[]) =>
  "#" + rgb.map((c) => Math.round(Math.min(Math.max(c, 0), 1) ** (1 / 2.2) * 255).toString(16).padStart(2, "0")).join("");
const mixHex = (a: string, b: string, t: number) => {
  const lb = toLinear(b);
  return toHex(toLinear(a).map((c, i) => c + (lb[i] - c) * t));
};

function mix(a: Daylight, b: Daylight, t: number): Daylight {
  const palette = Object.fromEntries(SLOTS.map((k) => [k, mixHex(a.palette[k], b.palette[k], t)])) as Record<Slot, string>;
  return {
    skyTop: mixHex(a.skyTop, b.skyTop, t),
    skyMid: mixHex(a.skyMid, b.skyMid, t),
    skyHorizon: mixHex(a.skyHorizon, b.skyHorizon, t),
    palette,
  };
}

/** The look at journey position s, blending continuously between the stages' times of day. */
export function daylightAt(s: number): Daylight {
  if (!(s > KEYS[0].at)) return structuredClone(KEYS[0].day);
  const last = KEYS[KEYS.length - 1];
  if (s >= last.at) return structuredClone(last.day);
  const i = KEYS.findIndex((k) => k.at > s);
  const a = KEYS[i - 1];
  const b = KEYS[i];
  return mix(a.day, b.day, (s - a.at) / (b.at - a.at));
}
