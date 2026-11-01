"use client";

import { useMemo } from "react";
import type { SegmentId } from "../timeline";
import { buildCityGeometry } from "./buildCity";
import { cityLayout } from "./layout";

const CITIES: SegmentId[] = ["braga", "porto", "jonkoping", "stockholm"];

/** Every city's houses, trees and lamps: one merged mesh per city. */
export function CityArt() {
  const geometries = useMemo(() => CITIES.map((id) => buildCityGeometry(cityLayout(id), id)), []);
  return (
    <group>
      {geometries.map((geometry, i) => (
        <mesh key={CITIES[i]} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
