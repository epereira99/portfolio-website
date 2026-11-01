import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Shape,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { SegmentId } from "../timeline";
import { rng, type HouseSpec } from "./houses";
import type { CityLayout, LampSpec, TreeSpec } from "./layout";

const WINDOW = "#3b4152";
const GLOW = "#ffd28a";
const AZULEJO = ["#2f5fa8", "#f4f7fb"];
const TRUNK = "#7a5a3c";
const LEAVES = ["#7fae6a", "#6c9c5c", "#8dbb73"];
const PINE = ["#3f6b55", "#4c7a62"];
const SNOW = "#f6f9fc";
const LAMP_POST = "#3e3a36";

const color = new Color();

/** Bakes a flat colour into a non-indexed copy of `g` and places it with `m`. */
function piece(g: BufferGeometry, hex: string, m: Matrix4): BufferGeometry {
  const out = g.index ? g.toNonIndexed() : g;
  out.deleteAttribute("uv");
  color.set(hex);
  const n = out.getAttribute("position").count;
  out.setAttribute("color", new Float32BufferAttribute(new Float32Array(n * 3).map((_, i) => [color.r, color.g, color.b][i % 3]), 3));
  return out.applyMatrix4(m);
}

const place = (x: number, y: number, z: number, heading = 0, sx = 1, sy = 1, sz = 1) =>
  new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), heading), new Vector3(sx, sy, sz));

function roof(h: HouseSpec, height: number): BufferGeometry[] {
  const eave = 0.12;
  if (h.roof === "gable") {
    // Triangular prism, ridge parallel to the front; extruded along local X.
    const half = h.d / 2 + eave;
    const rise = Math.tan((35 * Math.PI) / 180) * half;
    const shape = new Shape([new Vector2(-half, 0), new Vector2(half, 0), new Vector2(0, rise)]);
    const g = new ExtrudeGeometry(shape, { depth: h.w + eave * 2, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 });
    g.translate(0, 0, -(h.w + eave * 2) / 2);
    g.rotateY(Math.PI / 2);
    return [g.translate(0, height, 0)];
  }
  if (h.roof === "hip") {
    const g = new ConeGeometry(Math.SQRT1_2, 1, 4, 1);
    g.rotateY(Math.PI / 4);
    g.scale(h.w + eave * 2, 0.9, h.d + eave * 2);
    return [g.translate(0, height + 0.45, 0)];
  }
  if (h.roof === "stepped") {
    // Gamla Stan stepped gable: three narrowing tiers.
    return [0.95, 0.65, 0.35].map((f, i) => new BoxGeometry(h.w * f, 0.42, h.d * 0.98).translate(0, height + 0.21 + i * 0.42, 0));
  }
  return [new BoxGeometry(h.w + eave, 0.18, h.d + eave).translate(0, height + 0.09, 0)];
}

function house(h: HouseSpec, id: SegmentId, rand: () => number): BufferGeometry[] {
  const height = h.floors * h.floorHeight;
  const m = place(h.x, 0, h.z, h.heading);
  const parts = [piece(new RoundedBoxGeometry(h.w, height, h.d, 2, 0.18).translate(0, height / 2, 0), h.wall, m)];
  for (const r of roof(h, height)) parts.push(piece(r, h.roofColor, m));

  const front = h.d / 2 + 0.02;
  if (h.azulejo) {
    // Blue-and-white tiles on the lower two floors of the front.
    const size = 0.3;
    const cols = Math.floor((h.w - 0.3) / size);
    const rows = Math.floor(Math.min(height, 2.2) / size);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * size;
        parts.push(piece(new PlaneGeometry(size * 0.92, size * 0.92).translate(x, 0.15 + r * size + size / 2, front - 0.005), AZULEJO[(r + c) % 2], m));
      }
    }
  }
  for (let f = 0; f < h.floors; f++) {
    const y = f * h.floorHeight + 0.62;
    const xs = f === 0 ? [-h.w / 3, h.w / 3] : [-h.w / 4, h.w / 4];
    for (const x of xs) {
      const lit = id === "stockholm" && rand() < 0.4;
      parts.push(piece(new BoxGeometry(0.32, 0.42, 0.05).translate(x, y, front), lit ? GLOW : WINDOW, m));
    }
  }
  parts.push(piece(new BoxGeometry(0.42, 0.75, 0.05).translate(0, 0.375, front), h.trim === "#f7f4ee" ? "#5a3a2a" : "#6b4a34", m));
  return parts;
}

function tree(t: TreeSpec, rand: () => number): BufferGeometry[] {
  const m = place(t.x, 0, t.z);
  if (t.kind === "round") {
    return [
      piece(new CylinderGeometry(0.12, 0.16, 0.9, 6).translate(0, 0.45, 0), TRUNK, m),
      piece(new SphereGeometry(t.size, 10, 8).translate(0, 0.9 + t.size * 0.85, 0), LEAVES[Math.floor(rand() * LEAVES.length)], m),
    ];
  }
  const green = PINE[Math.floor(rand() * PINE.length)];
  const parts = [piece(new CylinderGeometry(0.1, 0.13, 0.6, 6).translate(0, 0.3, 0), TRUNK, m)];
  [1, 0.75, 0.5].forEach((f, i) => {
    const r = t.size * f;
    const y = 0.6 + i * t.size * 0.7 + r * 0.7;
    parts.push(piece(new ConeGeometry(r, r * 1.4, 8).translate(0, y, 0), green, m));
    if (t.snow) parts.push(piece(new ConeGeometry(r * 0.45, r * 0.5, 8).translate(0, y + r * 0.47, 0), SNOW, m));
  });
  return parts;
}

function lamp(l: LampSpec): BufferGeometry[] {
  const m = place(l.x, 0, l.z);
  return [
    piece(new CylinderGeometry(0.05, 0.06, 2.1, 6).translate(0, 1.05, 0), LAMP_POST, m),
    piece(new SphereGeometry(0.16, 8, 6).translate(0, 2.2, 0), l.glow ? GLOW : "#e8e2d0", m),
  ];
}

/** One merged, vertex-coloured geometry for a whole city: about one draw call. */
export function buildCityGeometry(layout: CityLayout, id: SegmentId): BufferGeometry {
  const rand = rng(7);
  const parts = [
    ...layout.houses.flatMap((h) => house(h, id, rand)),
    ...layout.trees.flatMap((t) => tree(t, rand)),
    ...layout.lamps.flatMap(lamp),
  ];
  if (parts.length === 0) return new BufferGeometry();
  return mergeGeometries(parts)!;
}
