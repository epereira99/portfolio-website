"use client";

import { Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { cameraPoseAt } from "../voyage/poses";
import { getScreens } from "../progress";

const pos = new Vector3();
const look = new Vector3();
const goal = new Vector3();

export function CameraRig() {
  useFrame(({ camera }) => {
    const pose = cameraPoseAt(getScreens());
    camera.position.lerp(pos.set(...pose.position), 0.15);
    look.lerp(goal.set(...pose.target), 0.15);
    camera.lookAt(look);
  });
  return null;
}
