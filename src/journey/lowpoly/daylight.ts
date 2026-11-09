import type { StageId } from "@/content/stages";
import { ENDING_START, SEGMENTS, segmentStart } from "../timeline";

/** The scene's parts by material name (tools/blender/lowpoly): each gets one flat colour per time of day. */
export const SLOTS = [
  "ground", "path", "tree", "trunk", "rock", "ridge_near", "ridge_mid", "ridge_far", "cloud", "figure", "wall", "roof", "sign", "sign_dark", "sign_green", "letters", "ju", "flag_blue", "flag_yellow",
] as const;
export type Slot = (typeof SLOTS)[number];

/** The look at one moment of the day: a three-stop sky and a flat colour for every part. sRGB hex. */
export type Daylight = { skyTop: string; skyMid: string; skyHorizon: string; palette: Record<Slot, string> };

// One day across the career (Eduardo, 2026-11-04): morning with the BSc, golden hour at Effektify, sunset with his
// personal projects, where the journey ends at sunset.
// Flat, hand-picked colours like the approved mockup (sunset started from mockup A's dusk), never lit: Blender bakes two tones per
// face into the models, these set what those tones are. `figure` tints the walker's own colours.
export const DAY: Record<StageId, Daylight> = {
  braga: {
    skyTop: "#7d9cc4", skyMid: "#e8b8a8", skyHorizon: "#f8e2c8",
    palette: {
      ground: "#6f8c6a", path: "#d0a77e", tree: "#3f6656", trunk: "#5a4434", rock: "#9a9aa0",
      ridge_near: "#85849f", ridge_mid: "#9d9ab8", ridge_far: "#b7b3cc", cloud: "#fbe9de", figure: "#e8e0e0", wall: "#f4ebe2", roof: "#c0634a", sign: "#d93a32", sign_dark: "#22232a", sign_green: "#8cbf2e", letters: "#e4e0dc", ju: "#9a2386", flag_blue: "#0a6fae", flag_yellow: "#fdd00e",
    },
  },
  porto: {
    skyTop: "#4f86c6", skyMid: "#8fbbe0", skyHorizon: "#d8ecf6",
    palette: {
      ground: "#7fa865", path: "#d9b48a", tree: "#3f6b4f", trunk: "#5a4434", rock: "#a0a0a0",
      ridge_near: "#6f88ad", ridge_mid: "#8aa2c4", ridge_far: "#a9bcd6", cloud: "#ffffff", figure: "#ffffff", wall: "#fbf8f2", roof: "#c4613f", sign: "#e0392c", sign_dark: "#1d1f24", sign_green: "#86bc25", letters: "#e6e6e6", ju: "#961b81", flag_blue: "#006aa7", flag_yellow: "#fecc02",
    },
  },
  jonkoping: {
    skyTop: "#5a7fb0", skyMid: "#d9b38a", skyHorizon: "#f4dcb0",
    palette: {
      ground: "#6f8a58", path: "#c99a6c", tree: "#36594a", trunk: "#4e3a2c", rock: "#908a88",
      ridge_near: "#7f6c80", ridge_mid: "#9a8496", ridge_far: "#b49fa8", cloud: "#f8e6cc", figure: "#f0e0d0", wall: "#f2e4d2", roof: "#b25a3f", sign: "#c93a31", sign_dark: "#1f1f24", sign_green: "#80b026", letters: "#e2ddd6", ju: "#8f1f7d", flag_blue: "#0a649e", flag_yellow: "#f4c414",
    },
  },
  stockholm: {
    skyTop: "#4b618c", skyMid: "#d99e7b", skyHorizon: "#f3cf9f",
    palette: {
      ground: "#5d7459", path: "#c09269", tree: "#325146", trunk: "#44342b", rock: "#7d7a7c",
      ridge_near: "#6e5c78", ridge_mid: "#846f89", ridge_far: "#998497", cloud: "#f0c7ac", figure: "#c0b1ae", wall: "#e6d2c2", roof: "#a24f3b", sign: "#b13a31", sign_dark: "#1c1b20", sign_green: "#76a326", letters: "#d8d0c9", ju: "#83207a", flag_blue: "#145b8f", flag_yellow: "#e8b81e",
    },
  },
  // A golden sunset, not night: the land glows warm under a low sun (Eduardo, 2026-11-06).
  personal: {
    skyTop: "#5a5683", skyMid: "#ec9a6a", skyHorizon: "#ffc98a",
    palette: {
      ground: "#96924e", path: "#e6aa6c", tree: "#4d6a44", trunk: "#5a422c", rock: "#a49486",
      ridge_near: "#8a6476", ridge_mid: "#a87a86", ridge_far: "#c49690", cloud: "#ffbf92", figure: "#f2d6bd", wall: "#f0d6bc", roof: "#b05a3c", sign: "#c4432f", sign_dark: "#1f1b1c", sign_green: "#86a82a", letters: "#e8d6c4", ju: "#8f2a74", flag_blue: "#1f5a88", flag_yellow: "#f0b62a",
    },
  },
};

// Each stage's look is fullest mid-stage; the last one's (sunset) lands where the ending begins.
const KEYS = SEGMENTS.map(({ id, screens }, i) => ({
  at: i === SEGMENTS.length - 1 ? ENDING_START : segmentStart(id) + screens / 2,
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
