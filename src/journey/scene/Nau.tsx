"use client";

import { useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useGLTF } from "@react-three/drei";
import { getScreens } from "../progress";
import { GANGPLANK_ENDS, nauPose } from "../voyage/poses";

const URL = "/models/nau.glb";

// Static gangplank from the end of Porto's path up to the moored nau's deck.
const [A, B] = GANGPLANK_ENDS;
const [dx, dy, dz] = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
const LENGTH = Math.hypot(dx, dy, dz);
const MID: [number, number, number] = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
const YAW = Math.atan2(dx, dz);
const PITCH = -Math.atan2(dy, Math.hypot(dx, dz));

export function Nau() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(URL);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const { position, heading } = nauPose(getScreens());
    g.position.set(...position);
    g.rotation.y = heading;
  });

  return (
    <>
      <group ref={group}>
        <primitive object={scene} />
      </group>
      <RoundedBox args={[0.9, 0.12, LENGTH]} radius={0.05} position={MID} rotation={[PITCH, YAW, 0, "YXZ"]} castShadow>
        <meshStandardMaterial color="#9a7048" roughness={0.9} />
      </RoundedBox>
    </>
  );
}

useGLTF.preload(URL);
