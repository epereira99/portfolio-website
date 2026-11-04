import type { StageId } from "@/content/stages";
import { ENDING_START, SEGMENTS, segmentStart } from "../timeline";

/** The light at one moment of the day. Colours are sRGB hex, angles in degrees. */
export type Daylight = {
  skyTop: string;
  skyHorizon: string;
  sunColor: string;
  sunIntensity: number;
  sunElevation: number;
  sunAzimuth: number;
  ambientColor: string;
  ambientIntensity: number;
  fogColor: string;
  fogNear: number;
  fogFar: number;
};

// One day across the career (Eduardo, 2026-11-04): it starts in the morning with the BSc and ends at dusk, today.
export const DAY: Record<StageId, Daylight> = {
  braga: {
    skyTop: "#6f8fb8", skyHorizon: "#f4d6b8", sunColor: "#ffd8a8", sunIntensity: 1.6, sunElevation: 10, sunAzimuth: 70,
    ambientColor: "#b8c4d8", ambientIntensity: 0.6, fogColor: "#e8d8cc", fogNear: 20, fogFar: 140,
  },
  porto: {
    skyTop: "#4f86c6", skyHorizon: "#cfe4f2", sunColor: "#fff6e8", sunIntensity: 2.4, sunElevation: 55, sunAzimuth: 160,
    ambientColor: "#c8d8e8", ambientIntensity: 0.8, fogColor: "#d6e4ee", fogNear: 30, fogFar: 170,
  },
  jonkoping: {
    skyTop: "#5a7fb0", skyHorizon: "#f0dcb4", sunColor: "#ffe2b0", sunIntensity: 2.0, sunElevation: 30, sunAzimuth: 230,
    ambientColor: "#c8c4c0", ambientIntensity: 0.7, fogColor: "#e8dcc4", fogNear: 25, fogFar: 160,
  },
  stockholm: {
    skyTop: "#3b3a63", skyHorizon: "#f2c38f", sunColor: "#ff9a6a", sunIntensity: 1.4, sunElevation: 4, sunAzimuth: 260,
    ambientColor: "#6f5a7e", ambientIntensity: 0.5, fogColor: "#d98a6c", fogNear: 15, fogFar: 120,
  },
};

// Each stage's light is fullest mid-stage; dusk lands where he stops.
const KEYS = SEGMENTS.map(({ id, screens }) => ({
  at: id === "stockholm" ? ENDING_START : segmentStart(id) + screens / 2,
  day: DAY[id],
}));

const toLinear = (hex: string) =>
  [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255) ** 2.2);
const toHex = (rgb: number[]) =>
  "#" + rgb.map((c) => Math.round(Math.min(Math.max(c, 0), 1) ** (1 / 2.2) * 255).toString(16).padStart(2, "0")).join("");

function mix(a: Daylight, b: Daylight, t: number): Daylight {
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof Daylight)[]) {
    const va = a[k];
    const vb = b[k];
    (out as Record<string, string | number>)[k] =
      typeof va === "number"
        ? va + ((vb as number) - va) * t
        : toHex(toLinear(va).map((c, i) => c + (toLinear(vb as string)[i] - c) * t));
  }
  return out;
}

/** The light at journey position s, blending continuously between the stages' times of day. */
export function daylightAt(s: number): Daylight {
  if (!(s > KEYS[0].at)) return { ...KEYS[0].day };
  const last = KEYS[KEYS.length - 1];
  if (s >= last.at) return { ...last.day };
  const i = KEYS.findIndex((k) => k.at > s);
  const a = KEYS[i - 1];
  const b = KEYS[i];
  return mix(a.day, b.day, (s - a.at) / (b.at - a.at));
}
