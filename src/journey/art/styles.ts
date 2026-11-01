import { Color } from "three";
import type { Vec3 } from "../path";
import { SEGMENTS, segmentStart, type SegmentId } from "../timeline";

export type Lighting = {
  sky: string;
  fog: [near: number, far: number];
  sun: { color: string; intensity: number; dir: Vec3 };
  ambient: { sky: string; ground: string; intensity: number };
};

export type CityStyle = Lighting & {
  ground: string;
  walkway: string;
  walls: string[];
  roofs: string[];
  trim: string;
  water: -1 | 0 | 1 | null; // side of the walker: -1 left, 1 right, 0 open sea
  waterColor: string;
};

// City moods from spec §6.
export const CITY_STYLE: Record<SegmentId, CityStyle> = {
  braga: {
    sky: "#f6dcb0",
    fog: [30, 110],
    sun: { color: "#ffe2b8", intensity: 1.7, dir: [-0.6, 0.55, 0.55] },
    ambient: { sky: "#fff4e2", ground: "#c9b897", intensity: 0.9 },
    ground: "#d8c9a8",
    walkway: "#efe4cd",
    walls: ["#efe6d4", "#e3d6bf", "#cfc2ab", "#f4ecdc"],
    roofs: ["#c8674a", "#b85a3e"],
    trim: "#f8f4ec",
    water: null,
    waterColor: "#7fb3cf",
  },
  porto: {
    sky: "#f4a970",
    fog: [28, 100],
    sun: { color: "#ffb56b", intensity: 1.9, dir: [0.7, 0.35, 0.6] },
    ambient: { sky: "#ffe0c2", ground: "#b88f6a", intensity: 0.85 },
    ground: "#d9b892",
    walkway: "#ecd9bd",
    walls: ["#f6efe2", "#e9c48a", "#7fa7d6", "#f0d7a8"],
    roofs: ["#e2703f", "#d35f33"],
    trim: "#fbf6ee",
    water: 1,
    waterColor: "#5f93b8",
  },
  voyage: {
    sky: "#9cc3df",
    fog: [35, 120],
    sun: { color: "#fff1dc", intensity: 1.6, dir: [0.4, 0.7, 0.3] },
    ambient: { sky: "#e4f0fa", ground: "#7d9db3", intensity: 0.9 },
    ground: "#d6cbb3",
    walkway: "#e6dcc6",
    walls: [],
    roofs: [],
    trim: "#ffffff",
    water: 0,
    waterColor: "#5c8fb5",
  },
  jonkoping: {
    sky: "#c7dbea",
    fog: [30, 105],
    sun: { color: "#eef4ff", intensity: 1.3, dir: [-0.5, 0.45, 0.6] },
    ambient: { sky: "#f2f7fd", ground: "#b9c6d3", intensity: 1.0 },
    ground: "#f3f6fa",
    walkway: "#dfe5ec",
    walls: ["#b23a2e", "#9c2f25", "#a8382c"],
    roofs: ["#3d3a3a", "#4a4545"],
    trim: "#f7f4ee",
    water: -1,
    waterColor: "#6f97b4",
  },
  stockholm: {
    sky: "#2e3a63",
    fog: [26, 95],
    sun: { color: "#ff9a5c", intensity: 0.6, dir: [0.8, 0.2, -0.4] },
    ambient: { sky: "#6d7bb0", ground: "#4a3a3a", intensity: 0.75 },
    ground: "#8f8577",
    walkway: "#b8ab98",
    walls: ["#d9a441", "#b5562f", "#e7c27d", "#c97b4a"],
    roofs: ["#5b3a2e", "#6a4535"],
    trim: "#f1e3c8",
    water: 1,
    waterColor: "#34507a",
  },
};

const lightingOf = ({ sky, fog, sun, ambient }: CityStyle): Lighting => ({ sky, fog, sun, ambient });

const BLEND = 0.25; // screens on each side of a boundary
const a = new Color();
const b = new Color();
const mixHex = (x: string, y: string, f: number) => `#${a.set(x).lerp(b.set(y), f).getHexString()}`;
const mix = (x: number, y: number, f: number) => x + (y - x) * f;

function blend(p: Lighting, q: Lighting, f: number): Lighting {
  return {
    sky: mixHex(p.sky, q.sky, f),
    fog: [mix(p.fog[0], q.fog[0], f), mix(p.fog[1], q.fog[1], f)],
    sun: {
      color: mixHex(p.sun.color, q.sun.color, f),
      intensity: mix(p.sun.intensity, q.sun.intensity, f),
      dir: [0, 1, 2].map((i) => mix(p.sun.dir[i], q.sun.dir[i], f)) as Vec3,
    },
    ambient: {
      sky: mixHex(p.ambient.sky, q.ambient.sky, f),
      ground: mixHex(p.ambient.ground, q.ambient.ground, f),
      intensity: mix(p.ambient.intensity, q.ambient.intensity, f),
    },
  };
}

/** Each city's light, blended linearly over ±0.25 screens around every city boundary. */
export function lightingAt(s: number): Lighting {
  for (let i = 1; i < SEGMENTS.length; i++) {
    const boundary = segmentStart(SEGMENTS[i].id);
    if (Math.abs(s - boundary) < BLEND) {
      const f = (s - (boundary - BLEND)) / (2 * BLEND);
      return blend(lightingOf(CITY_STYLE[SEGMENTS[i - 1].id]), lightingOf(CITY_STYLE[SEGMENTS[i].id]), f);
    }
  }
  const index = SEGMENTS.findIndex((seg) => s < segmentStart(seg.id) + seg.screens);
  return lightingOf(CITY_STYLE[SEGMENTS[index === -1 ? SEGMENTS.length - 1 : index].id]);
}
