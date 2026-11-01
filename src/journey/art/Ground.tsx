"use client";

import { useMemo } from "react";
import { BufferGeometry, Color, Float32BufferAttribute } from "three";
import { QUAY_END, UNITS_PER_SCREEN, pathPointExtended, pathTangent, PATH_LENGTH } from "../path";
import { SEGMENTS, segmentStart } from "../timeline";
import { CITY_STYLE } from "./styles";

const BLEND = 10; // path units over which one city's ground turns into the next
const a = new Color();
const b = new Color();

/** A city colour at path distance d, blended across city boundaries. */
function colorAt(d: number, key: "ground" | "walkway"): Color {
  for (let i = 1; i < SEGMENTS.length; i++) {
    const edge = segmentStart(SEGMENTS[i].id) * UNITS_PER_SCREEN;
    if (Math.abs(d - edge) < BLEND) {
      const f = (d - (edge - BLEND)) / (2 * BLEND);
      return a.set(CITY_STYLE[SEGMENTS[i - 1].id][key]).lerp(b.set(CITY_STYLE[SEGMENTS[i].id][key]), f).clone();
    }
  }
  const s = d / UNITS_PER_SCREEN;
  const seg = SEGMENTS.find((g) => s < segmentStart(g.id) + g.screens) ?? SEGMENTS[SEGMENTS.length - 1];
  return a.set(CITY_STYLE[seg.id][key]).clone();
}

/** A strip following the path: rows every `step`, columns at the given lateral offsets. */
function strip(from: number, to: number, step: number, laterals: number[], key: "ground" | "walkway", y: number) {
  const pos: number[] = [];
  const col: number[] = [];
  const index: number[] = [];
  let rows = 0;
  for (let d = from; d <= to + 1e-9; d += step, rows++) {
    const [px, , pz] = pathPointExtended(d);
    const [tx, , tz] = pathTangent(Math.min(d, PATH_LENGTH));
    const len = Math.hypot(tx, tz);
    const c = colorAt(d, key);
    for (const k of laterals) {
      pos.push(px + (-tz / len) * k, y, pz + (tx / len) * k);
      col.push(c.r, c.g, c.b);
    }
  }
  const n = laterals.length;
  for (let r = 0; r < rows - 1; r++) {
    for (let k = 0; k < n - 1; k++) {
      const i = r * n + k;
      index.push(i, i + n, i + 1, i + 1, i + n, i + n + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new Float32BufferAttribute(col, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

export function Ground() {
  const [ground, walkway] = useMemo(
    () => [
      strip(-40, PATH_LENGTH + 60, 2, [-120, -40, -12, -3, 3, 12, 40, 120], "ground", 0),
      strip(0, QUAY_END + 1, 1, [-1.2, 1.2], "walkway", 0.012), // the built path ends at the quay
    ],
    [],
  );
  return (
    <group>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} side={2} />
      </mesh>
      <mesh geometry={walkway} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.9} side={2} />
      </mesh>
    </group>
  );
}
