"use client";

import { useEffect, useRef } from "react";
import type { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { walkClipTime } from "../path";
import { avatarPose } from "../voyage/poses";
import { getScreens } from "../progress";

const URL = "/models/avatar.glb";
const STRIDE = 1.6;

export function Avatar() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(URL);
  const { actions } = useAnimations(animations, group);
  const last = useRef({ d: -1, movedAt: 0 });

  useEffect(() => {
    const { walk, idle } = actions;
    if (!walk || !idle) return;
    walk.play().paused = true; // driven by scroll distance, not time
    idle.play();
  }, [actions]);

  // three.js animation actions are mutated every frame by design (R3F pattern)
  // eslint-disable-next-line react-hooks/immutability
  useFrame(({ clock }) => {
    const { walk, idle } = actions;
    const g = group.current;
    if (!g || !walk || !idle) return;
    const pose = avatarPose(getScreens()); // path walk, boarding, deck, or Jönköping
    g.position.set(...pose.position);
    g.rotation.y = pose.heading; // model faces +Z

    const now = clock.elapsedTime;
    if (Math.abs(pose.walk - last.current.d) > 1e-4) last.current = { d: pose.walk, movedAt: now };
    // eslint-disable-next-line react-hooks/immutability
    walk.time = walkClipTime(pose.walk, STRIDE, walk.getClip().duration);
    const walking = now - last.current.movedAt < 0.3 ? 1 : 0;
    const w = walk.getEffectiveWeight() + (walking - walk.getEffectiveWeight()) * 0.2;
    walk.setEffectiveWeight(w);
    idle.setEffectiveWeight(1 - w);
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(URL);
