"use client";

import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { getScreens } from "../progress";
import type { SegmentId } from "../timeline";
import { avatarPose } from "../voyage/poses";
import { buildCityGeometry } from "./buildCity";
import { APPROACH, applyApproachFade, approachDepthMaterial } from "./fade";
import { cityLayout } from "./layout";

const CITIES: SegmentId[] = ["braga", "porto", "jonkoping", "stockholm"];

/** Every city's houses, trees and lamps: one merged mesh per city, fading in as the walker approaches. */
export function CityArt() {
  const geometries = useMemo(() => CITIES.map((id) => buildCityGeometry(cityLayout(id), id)), []);
  const material = useMemo(() => {
    const m = new MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    applyApproachFade(m, { alongAttribute: true });
    return m;
  }, []);
  const depth = useMemo(() => approachDepthMaterial({ alongAttribute: true }), []);

  // The shared fade uniform follows the walker (landmarks read it too).
  useFrame(() => {
    APPROACH.value = avatarPose(getScreens()).walk;
  });

  return (
    <group>
      {geometries.map((geometry, i) => (
        <mesh key={CITIES[i]} geometry={geometry} material={material} customDepthMaterial={depth} castShadow receiveShadow />
      ))}
    </group>
  );
}
