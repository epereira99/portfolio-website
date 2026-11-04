"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { BackSide, Color, type Group, type Mesh, type PerspectiveCamera } from "three";
import { getScreens } from "../progress";
import { DAY, daylightAt } from "./daylight";
import { figureMaterials, flatMaterials } from "./materials";
import { cameraAt, distanceAt, pointAt } from "./path";
import { Quiet } from "./Quiet";
import { nextPosition, walkTime } from "./rig";
import styles from "./LowpolyWalk.module.css";

const SCENE_URL = "/models/walk-scene.glb";
const WALKER_URL = "/models/walker.glb";

// A three-stop vertical gradient on a sphere around the camera: horizon, a warm band, then the top.
const SKY_VERTEX = `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAGMENT = `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; varying vec3 vDir;
void main() { float h = max(vDir.y, 0.0);
  vec3 c = h < 0.12 ? mix(horizon, mid, h / 0.12) : mix(mid, top, smoothstep(0.12, 0.6, h));
  gl_FragColor = vec4(c, 1.0);
#include <colorspace_fragment>
}`;

function World() {
  const land = useGLTF(SCENE_URL);
  const walker = useGLTF(WALKER_URL);
  const { actions } = useAnimations(walker.animations, walker.scene);
  const sky = useRef<Mesh>(null);
  const him = useRef<Group>(null);
  const shown = useRef(getScreens());
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const uniforms = useMemo(() => ({ top: { value: new Color() }, mid: { value: new Color() }, horizon: { value: new Color() } }), []);
  const flat = useMemo(() => flatMaterials(land.scene), [land.scene]);
  const figure = useMemo(() => figureMaterials(walker.scene), [walker.scene]);
  const tint = useMemo(() => new Color(), []);

  useEffect(() => {
    const walk = actions.Walk;
    if (walk) {
      walk.play();
      // eslint-disable-next-line react-hooks/immutability -- three.js state, not React state
      walk.paused = true; // scrubbed by distance below, never by the clock
    }
  }, [actions]);

  // eslint-disable-next-line react-hooks/immutability -- scrubs the walk action's time: three.js state, not React state
  useFrame(({ camera, size }) => {
    const p = (shown.current = nextPosition(shown.current, getScreens(), reduced));
    const w = pointAt(distanceAt(p));
    him.current!.position.set(w.x, 0, w.z);
    him.current!.rotation.y = w.heading;
    const walk = actions.Walk;
    // eslint-disable-next-line react-hooks/immutability -- three.js state, not React state
    if (walk) walk.time = walkTime(p) * walk.getClip().duration;

    const cam = cameraAt(p, size.width / size.height);
    camera.position.set(...cam.position);
    camera.lookAt(...cam.target);
    (camera as PerspectiveCamera).fov = cam.fov;
    (camera as PerspectiveCamera).updateProjectionMatrix();
    sky.current!.position.copy(camera.position);

    const d = daylightAt(p);
    uniforms.top.value.set(d.skyTop);
    uniforms.mid.value.set(d.skyMid);
    uniforms.horizon.value.set(d.skyHorizon);
    for (const [slot, material] of flat) material.color.set(d.palette[slot]);
    tint.set(d.palette.figure);
    for (const { material, base } of figure) material.color.copy(base).multiply(tint);
  });

  return (
    <>
      <mesh ref={sky} scale={900} renderOrder={-1}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial side={BackSide} depthWrite={false} uniforms={uniforms} vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} />
      </mesh>
      <primitive object={land.scene} />
      <group ref={him}>
        <primitive object={walker.scene} />
        <mesh rotation-x={-Math.PI / 2} position-y={0.05}>
          <circleGeometry args={[0.45, 16]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

/** The Journey's world: a low-poly landscape he walks through as the day passes, driven by scroll. */
export function LowpolyWalk() {
  const { skyTop, skyHorizon } = DAY.braga;
  return (
    // The morning sky shows before WebGL draws, and stays if it never can.
    <div className={styles.scene} style={{ background: `linear-gradient(${skyTop}, ${skyHorizon})` }} aria-hidden>
      <Quiet>
        <Canvas flat dpr={[1, 2]} camera={{ near: 0.1, far: 2000 }}>
          <Suspense fallback={null}>
            <World />
          </Suspense>
        </Canvas>
      </Quiet>
    </div>
  );
}

useGLTF.preload(SCENE_URL);
useGLTF.preload(WALKER_URL);
