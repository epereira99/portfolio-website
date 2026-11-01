"use client";

import { useMemo } from "react";
import { BufferGeometry, Color, Float32BufferAttribute, Fog } from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { SEGMENTS, segmentAt } from "../timeline";
import { PATH_LENGTH, QUAY_END, pathPoint, pathTangent } from "../path";
import { getScreens } from "../progress";
import { standInBlocks } from "./standIn";

const target = new Color();

function Walkway() {
  const geometry = useMemo(() => {
    const pos: number[] = [];
    for (let d = 0; d < QUAY_END + 1; d += 1) { // the built path ends at the quay
      for (const dd of [d, d + 1]) {
        const [px, , pz] = pathPoint(dd);
        const [tx, , tz] = pathTangent(dd);
        pos.push(px + tz * 1.2, 0.01, pz - tx * 1.2, px - tz * 1.2, 0.01, pz + tx * 1.2);
      }
    }
    const index: number[] = [];
    for (let i = 0; i < pos.length / 3 - 2; i += 4) index.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#e8dcc4" side={2} />
    </mesh>
  );
}

export function StandInCities() {
  const cities = useMemo(() => SEGMENTS.map((s) => ({ id: s.id, ...standInBlocks(s.id) })), []);

  // Sky and fog drift toward the current city's mood.
  useFrame(({ scene }) => {
    target.set(cities.find((c) => c.id === segmentAt(getScreens()))!.sky);
    if (scene.background instanceof Color) scene.background.lerp(target, 0.04);
    if (scene.fog instanceof Fog) scene.fog.color.lerp(target, 0.04);
  });

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -PATH_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[200, PATH_LENGTH + 120]} />
        <meshStandardMaterial color="#cdbf9f" />
      </mesh>
      <Walkway />
      {cities.map(({ id, blocks, water }) => (
        <group key={id}>
          {water && (
            <mesh rotation-x={-Math.PI / 2} position={[water.x, 0.02, water.z]}>
              <planeGeometry args={[water.w, water.d]} />
              <meshStandardMaterial color="#6fa8c9" roughness={0.2} />
            </mesh>
          )}
          {blocks.map((b, i) => (
            <RoundedBox
              key={i}
              args={[b.w, b.h, b.d]}
              radius={0.15}
              position={[b.x, b.h / 2, b.z]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={b.color} roughness={0.8} />
            </RoundedBox>
          ))}
        </group>
      ))}
    </group>
  );
}
