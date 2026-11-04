"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { BackSide, Color, Fog, type DirectionalLight, type Group, type HemisphereLight, type Mesh, type PerspectiveCamera } from "three";
import { getScreens } from "../progress";
import { DAY, daylightAt } from "./daylight";
import { cameraAt, distanceAt, pointAt } from "./path";
import { Quiet } from "./Quiet";
import { nextPosition, walkTime } from "./rig";
import styles from "./LowpolyWalk.module.css";

const SCENE_URL = "/models/walk-scene.glb";
const WALKER_URL = "/models/walker.glb";
// Only upright things cast shadows: the near-flat ground and path would only shadow themselves (acne). Mountains
// and clouds are too far to be worth shadow-map resolution.
const CASTS = ["trees", "rocks"];
const RECEIVES = ["ground", "path", "trees", "rocks"];

// A two-colour vertical gradient on a sphere around the camera.
const SKY_VERTEX = `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAGMENT = `uniform vec3 top; uniform vec3 horizon; varying vec3 vDir;
void main() { gl_FragColor = vec4(mix(horizon, top, pow(max(vDir.y, 0.0), 0.6)), 1.0);
#include <colorspace_fragment>
}`;

// three lights are physical (no π in the BRDF): this brings the DAY intensities to their intended brightness.
const LIGHT_SCALE = Math.PI * 0.75;
const rad = (deg: number) => (deg * Math.PI) / 180;

function World() {
  const land = useGLTF(SCENE_URL);
  const walker = useGLTF(WALKER_URL);
  const { actions } = useAnimations(walker.animations, walker.scene);
  const { camera, scene, size } = useThree();
  const sky = useRef<Mesh>(null);
  const sun = useRef<DirectionalLight>(null);
  const ambient = useRef<HemisphereLight>(null);
  const him = useRef<Group>(null);
  const shown = useRef(getScreens());
  const [reduced, small] = useMemo(
    () => ["(prefers-reduced-motion: reduce)", "(max-width: 640px)"].map((q) => window.matchMedia(q).matches),
    [],
  );
  const uniforms = useMemo(() => ({ top: { value: new Color() }, horizon: { value: new Color() } }), []);

  useEffect(() => {
    land.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const part = m.parent?.name && m.parent.name !== "Scene" ? m.parent.name : m.name; // multi-material parts are groups
      m.castShadow = CASTS.includes(part);
      m.receiveShadow = RECEIVES.includes(part);
    });
    walker.scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.frustumCulled = false; // skinned: its bind-pose bounds don't follow the walk
      }
    });
    scene.fog = new Fog(DAY.braga.fogColor, DAY.braga.fogNear, DAY.braga.fogFar);
    scene.add(sun.current!.target);
    const walk = actions.Walk;
    if (walk) {
      walk.play();
      walk.paused = true; // scrubbed by distance below, never by the clock
    }
    return () => {
      scene.fog = null;
    };
  }, [land, walker, actions, scene]);

  useFrame(() => {
    const p = (shown.current = nextPosition(shown.current, getScreens(), reduced));
    const w = pointAt(distanceAt(p));
    him.current!.position.set(w.x, 0, w.z);
    him.current!.rotation.y = w.heading;
    const walk = actions.Walk;
    if (walk) walk.time = walkTime(p) * walk.getClip().duration;

    const cam = cameraAt(p, size.width / size.height);
    camera.position.set(...cam.position);
    camera.lookAt(...cam.target);
    (camera as PerspectiveCamera).fov = cam.fov;
    (camera as PerspectiveCamera).updateProjectionMatrix();
    sky.current!.position.copy(camera.position);

    const d = daylightAt(p);
    uniforms.top.value.set(d.skyTop);
    uniforms.horizon.value.set(d.skyHorizon);
    const fog = scene.fog as Fog;
    fog.color.set(d.fogColor);
    fog.near = d.fogNear;
    fog.far = d.fogFar;

    // Small screens keep the midday sun angle: the shadows hold still while the colours still follow the day.
    const angle = small ? DAY.porto : d;
    const el = rad(angle.sunElevation);
    const az = rad(angle.sunAzimuth);
    const s = sun.current!;
    s.position.set(w.x + 60 * Math.cos(el) * Math.sin(az), 60 * Math.sin(el), w.z + 60 * Math.cos(el) * Math.cos(az));
    s.target.position.set(w.x, 0, w.z);
    s.color.set(d.sunColor);
    s.intensity = d.sunIntensity * LIGHT_SCALE;
    ambient.current!.color.set(d.ambientColor);
    ambient.current!.intensity = d.ambientIntensity * LIGHT_SCALE;
  });

  return (
    <>
      <mesh ref={sky} scale={400} renderOrder={-1}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial
          side={BackSide}
          depthWrite={false}
          fog={false}
          uniforms={uniforms}
          vertexShader={SKY_VERTEX}
          fragmentShader={SKY_FRAGMENT}
        />
      </mesh>
      <hemisphereLight ref={ambient} groundColor="#4a5a3e" />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.08}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={150}
      />
      <primitive object={land.scene} />
      <group ref={him}>
        <primitive object={walker.scene} />
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
        <Canvas shadows="percentage" flat dpr={[1, 2]} camera={{ near: 0.1, far: 1000 }}>
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
