"use client";

import { useRef, useState } from "react";
import { Color, Fog, Object3D, type DirectionalLight, type HemisphereLight } from "three";
import { useFrame } from "@react-three/fiber";
import { getScreens } from "../progress";
import { avatarPose } from "../voyage/poses";
import { lightingAt } from "./styles";

/** Sky, fog, sun and ambient light for wherever the walker is, blended between cities. */
export function CityLighting() {
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const [target] = useState(() => new Object3D());

  useFrame(({ scene }) => {
    const s = getScreens();
    const l = lightingAt(s);
    if (scene.background instanceof Color) scene.background.set(l.sky);
    if (scene.fog instanceof Fog) {
      scene.fog.color.set(l.sky);
      [scene.fog.near, scene.fog.far] = l.fog;
    }
    if (hemi.current) {
      hemi.current.color.set(l.ambient.sky);
      hemi.current.groundColor.set(l.ambient.ground);
      hemi.current.intensity = l.ambient.intensity;
    }
    if (sun.current) {
      // The sun follows the walker so the shadow map stays sharp around them.
      const [x, y, z] = avatarPose(s).position;
      target.position.set(x, y, z);
      sun.current.position.set(x + l.sun.dir[0] * 40, y + l.sun.dir[1] * 40, z + l.sun.dir[2] * 40);
      sun.current.color.set(l.sun.color);
      sun.current.intensity = l.sun.intensity;
    }
  });

  const first = lightingAt(0);
  return (
    <>
      <color attach="background" args={[first.sky]} />
      <fog attach="fog" args={[first.sky, ...first.fog]} />
      <hemisphereLight ref={hemi} args={[first.ambient.sky, first.ambient.ground, first.ambient.intensity]} />
      <primitive object={target} />
      <directionalLight
        ref={sun}
        target={target}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={120}
        shadow-bias={-0.0005}
      />
    </>
  );
}
