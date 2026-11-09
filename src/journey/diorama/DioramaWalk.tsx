"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PointMaterial, Sparkles, useAnimations, useGLTF } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, TiltShift2, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import {
  BackSide, BufferAttribute, Color, Quaternion, Vector3,
  type DirectionalLight, type Fog, type Group, type HemisphereLight, type Mesh, type Object3D, type PerspectiveCamera,
  type Points,
} from "three";
import { getScreens } from "../progress";
import { DAY, daylightAt } from "../lowpoly/daylight";
import { distanceAt, pointAt } from "../lowpoly/path";
import { Quiet } from "../lowpoly/Quiet";
import { nextPosition, walkTime } from "../lowpoly/rig";
import { RIGS, place, shotAt, sunAt, turnTo, weatherAt, type Rig, type Weather } from "./shots";
import { addFace, toonFigure, toonScene, wind } from "./toon";
import { Camp } from "@/about/Campfire";
import { campCamera, campSpot, campToWorld, campView } from "@/about/camp";
import { TOTAL_SCREENS } from "../timeline";
import styles from "./DioramaWalk.module.css";

const SCENE_URL = "/models/walk-scene.glb";
const WALKER_URL = "/models/walker.glb";

// The classic walk's sky (lowpoly/LowpolyWalk.tsx): a three-stop gradient on a sphere around the camera.
const SKY_VERTEX = `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAGMENT = `uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; varying vec3 vDir;
void main() { float h = max(vDir.y, 0.0);
  vec3 c = h < 0.12 ? mix(horizon, mid, h / 0.12) : mix(mid, top, smoothstep(0.12, 0.6, h));
  gl_FragColor = vec4(c, 1.0);
#include <colorspace_fragment>
}`;

/** The viewer's look around him: dragged or arrowed yaw, sprung back to the directed shot when they scroll on. */
type Look = { yaw: number; target: number; dragging: boolean };

const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);
const TURN = Math.PI * 2;

// His head turns toward the camera when it's in front or beside him, split between neck and head.
const HEAD_YAW = 1.1;
const HEAD_PITCH = 0.35;
const HEAD_HEIGHT = 1.6; // his face, where the bubbles' tail points
const SEATED_HEAD = 1.05; // the same, sitting on his log at the camp (about/Campfire.tsx)
const UP = new Vector3(0, 1, 0);
const _q = new Quaternion();
const _parent = new Quaternion();
const _world = new Quaternion();
const _forward = new Vector3();
const _to = new Vector3();
const _head = new Vector3();

/** A bone's pose from the walk, and what we last wrote over it. */
type Turned = { bone: Object3D; pose: Quaternion; written: Quaternion };
const turned = (bone: Object3D): Turned => ({ bone, pose: bone.quaternion.clone(), written: new Quaternion(NaN, 0, 0, 1) });

/** Turns a bone by a world-space rotation on top of the walk's pose. The mixer only rewrites a bone when its pose
 * changes, so while he stands still the last turn is still there: turn from the remembered pose, never on top. */
function turnBone(t: Turned, delta: Quaternion) {
  if (!t.bone.quaternion.equals(t.written)) t.pose.copy(t.bone.quaternion);
  t.bone.quaternion.copy(t.pose);
  t.bone.getWorldQuaternion(_world);
  t.bone.parent!.getWorldQuaternion(_parent);
  t.bone.quaternion.copy(_parent.invert().multiply(_world.premultiply(delta)));
  t.written.copy(t.bone.quaternion);
}

function World({ look }: { look: React.RefObject<Look> }) {
  const land = useGLTF(SCENE_URL);
  const walker = useGLTF(WALKER_URL);
  const { actions } = useAnimations(walker.animations, walker.scene);
  const sky = useRef<Mesh>(null);
  const him = useRef<Group>(null);
  const sun = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const fog = useRef<Fog>(null);
  const shown = useRef(getScreens());
  const scrolled = useRef(getScreens());
  const rig = useRef<Rig | null>(null);
  const anchor = useRef("");
  const gaze = useRef(new Quaternion());
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const uniforms = useMemo(() => ({ top: { value: new Color() }, mid: { value: new Color() }, horizon: { value: new Color() } }), []);
  const slots = useMemo(() => toonScene(land.scene), [land.scene]);
  const bones = useMemo(() => {
    toonFigure(walker.scene);
    const neck = walker.scene.getObjectByName("mixamorigNeck");
    const head = walker.scene.getObjectByName("mixamorigHead");
    if (head) addFace(walker.scene, head);
    return neck && head ? { neck: turned(neck), head: turned(head) } : null;
  }, [walker.scene]);
  const white = useMemo(() => new Color("#ffffff"), []);
  const spot = useMemo(() => campSpot(), []);

  useEffect(() => {
    const walk = actions.Walk;
    if (walk) {
      walk.play();
      // eslint-disable-next-line react-hooks/immutability -- three.js state, not React state
      walk.paused = true; // scrubbed by distance below, never by the clock
    }
  }, [actions]);

  useEffect(() => {
    sun.current!.target = him.current!; // the sun's shadow box follows him down the road
    const root = document.documentElement.style;
    return () => {
      root.removeProperty("--head-x"); // the bubbles go back to their classic place
      root.removeProperty("--head-y");
    };
  }, []);

  // eslint-disable-next-line react-hooks/immutability -- scrubs three.js state every frame, not React state
  useFrame(({ camera, size }, delta) => {
    const dt = Math.min(delta, 0.1);
    const prev = shown.current;
    const p = (shown.current = nextPosition(shown.current, getScreens(), reduced));
    const w = pointAt(distanceAt(p));
    // At the camp (About me), his seated self there takes over: the walker hides, and the sun's shadow box and the
    // air, which follow this group, move to the camp.
    const camping = campView.shown;
    him.current!.visible = !camping;
    him.current!.position.set(camping ? spot.x : w.x, 0, camping ? spot.z : w.z);
    him.current!.rotation.y = w.heading;
    const walk = actions.Walk;
    // eslint-disable-next-line react-hooks/immutability -- three.js state, not React state
    if (walk) walk.time = walkTime(p) * walk.getClip().duration;
    if (!reduced) wind.value += dt;

    // Scrolling on hands the camera back to the director.
    const l = look.current!;
    if (getScreens() !== scrolled.current) {
      scrolled.current = getScreens();
      // eslint-disable-next-line react-hooks/immutability -- a ref the pointer handlers share, not React state
      if (!l.dragging) l.target = 0;
    }
    l.yaw += (l.target - l.yaw) * (reduced ? 1 : damp(6, dt));

    // The directed shot, swung round him between shots; a jump along the journey (or reduced motion) cuts to it.
    const want = RIGS[shotAt(p)];
    if (camping || !rig.current || reduced || Math.abs(p - prev) > 0.9) rig.current = { ...want }; // cuts, under the fade
    else {
      const r = rig.current;
      const k = damp(1.6, dt); // unhurried, so turning to face him reads as a moment
      r.around += turnTo(r.around, want.around) * k;
      for (const key of ["dist", "height", "ahead", "lookUp", "hfov"] as const) r[key] += (want[key] - r[key]) * k;
    }
    const cam = camping ? campCamera(size.width / size.height, l.yaw) : place(rig.current, p, size.width / size.height, l.yaw);
    camera.position.set(...cam.position);
    camera.lookAt(...cam.target);
    (camera as PerspectiveCamera).fov = cam.fov;
    (camera as PerspectiveCamera).updateProjectionMatrix();
    sky.current!.position.copy(camera.position);

    // Daylight: the classic palette, now lit by a moving sun and the sky's own light, fading into the horizon.
    const lit = camping ? TOTAL_SCREENS : p; // the camp sits in the journey's last light, whatever the scroll
    const d = daylightAt(lit);
    uniforms.top.value.set(d.skyTop);
    uniforms.mid.value.set(d.skyMid);
    uniforms.horizon.value.set(d.skyHorizon);
    for (const [slot, material] of slots) material.color.set(d.palette[slot]);
    fog.current!.color.set(d.skyHorizon);
    const toSun = sunAt(lit);
    const c = him.current!.position;
    sun.current!.position.set(c.x + toSun[0] * 60, toSun[1] * 60, c.z + toSun[2] * 60);
    sun.current!.color.set(d.skyHorizon).lerp(white, Math.min(toSun[1] * 1.6, 0.85));
    sun.current!.intensity = 1.2 + 1.4 * Math.min(toSun[1] * 2, 1);
    hemi.current!.color.set(d.skyTop);
    hemi.current!.groundColor.set(d.palette.ground);

    // He looks at you when you're in front of or beside him, and down the road when you're behind.
    if (bones && !camping) {
      bones.head.bone.getWorldPosition(_head);
      _forward.set(-Math.sin(w.heading), 0, -Math.cos(w.heading));
      _to.copy(camera.position).sub(_head);
      const flat = Math.hypot(_to.x, _to.z);
      let yaw = Math.atan2(_forward.z * _to.x - _forward.x * _to.z, _forward.x * _to.x + _forward.z * _to.z);
      yaw = Math.abs(yaw) > 2.2 ? 0 : Math.max(-HEAD_YAW, Math.min(HEAD_YAW, yaw));
      const pitch = Math.max(-HEAD_PITCH, Math.min(HEAD_PITCH, Math.atan2(_to.y, flat)));
      _to.copy(_forward).applyAxisAngle(UP, yaw);
      _to.y = Math.tan(pitch);
      _q.setFromUnitVectors(_forward, _to.normalize());
      gaze.current.slerp(_q, reduced ? 1 : damp(4, dt));
      const half = new Quaternion().slerp(gaze.current, 0.5);
      turnBone(bones.neck, half);
      turnBone(bones.head, half);
    }

    // Where his head is on screen, for the bubbles beside him (ui/JourneyOverlay.module.css reads these): on the road,
    // or sitting by the fire, where he speaks about the things you click.
    camera.updateMatrixWorld();
    if (camping) _head.set(...campToWorld(0, SEATED_HEAD, 0));
    else _head.set(w.x, HEAD_HEIGHT, w.z);
    _head.project(camera);
    if (_head.z < 1) {
      const at = `${Math.round(((_head.x + 1) / 2) * size.width)},${Math.round(((1 - _head.y) / 2) * size.height)}`;
      if (at !== anchor.current) {
        anchor.current = at;
        const [x, y] = at.split(",");
        document.documentElement.style.setProperty("--head-x", `${x}px`);
        document.documentElement.style.setProperty("--head-y", `${y}px`);
      }
    }
  });

  return (
    <>
      <fog ref={fog} attach="fog" args={["#ffffff", 40, 260]} />
      <hemisphereLight ref={hemi} intensity={1.5} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-camera-near={1}
        shadow-camera-far={140}
      />
      <mesh ref={sky} scale={900} renderOrder={-1}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial side={BackSide} depthWrite={false} fog={false} uniforms={uniforms} vertexShader={SKY_VERTEX} fragmentShader={SKY_FRAGMENT} />
      </mesh>
      <primitive object={land.scene} />
      <group ref={him}>
        <primitive object={walker.scene} />
      </group>
      <Camp />
      {!reduced && <Air him={him} />}
    </>
  );
}

// Wrapped around him so the air never runs out, but fixed to the world so he walks through it.
const SPAN = 32;
const HEIGHT = 12;
const wrap = (v: number) => ((((v + SPAN / 2) % SPAN) + SPAN) % SPAN) - SPAN / 2;

type DriftProps = { kind: Weather; count: number; color: string; size: number; fall: number; shown: React.RefObject<Weather> };

function Drift({ kind, count, color, size, fall, shown }: DriftProps) {
  const points = useRef<Points>(null);
  const seeds = useMemo(
    // eslint-disable-next-line react-hooks/purity -- random once per mount, a scatter of flakes
    () => Array.from({ length: count }, () => [Math.random() * SPAN, Math.random() * HEIGHT, Math.random() * SPAN, Math.random()]),
    [count],
  );
  const positions = useMemo(() => new BufferAttribute(new Float32Array(count * 3), 3), [count]);
  // eslint-disable-next-line react-hooks/immutability -- moves the flakes every frame: three.js state, not React state
  useFrame(({ clock }, delta) => {
    const pts = points.current!;
    pts.visible = shown.current === kind;
    if (!pts.visible) return;
    const t = clock.elapsedTime;
    const c = pts.parent!.position; // the Air group sits on him
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      // eslint-disable-next-line react-hooks/immutability -- the flakes' own positions, not React state
      s[1] -= Math.min(delta, 0.1) * fall * (0.6 + s[3]);
      if (s[1] < 0) s[1] += HEIGHT;
      const sway = Math.sin(t * 0.7 + s[3] * 9) * 0.6;
      positions.setXYZ(i, wrap(s[0] + sway - c.x), s[1] + Math.sin(t + s[3] * 6) * 0.15, wrap(s[2] - c.z));
    }
    // eslint-disable-next-line react-hooks/immutability -- three.js state, not React state
    positions.needsUpdate = true;
  });
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry attributes={{ position: positions }} />
      <PointMaterial transparent depthWrite={false} color={color} size={size} sizeAttenuation />
    </points>
  );
}

function Air({ him }: { him: React.RefObject<Group | null> }) {
  const group = useRef<Group>(null);
  const fireflies = useRef<Points>(null);
  const shown = useRef<Weather>(weatherAt(getScreens()));
  useFrame(() => {
    shown.current = weatherAt(getScreens());
    group.current!.position.copy(him.current!.position);
    fireflies.current!.visible = shown.current === "fireflies";
  });
  return (
    <group ref={group}>
      <Drift kind="pollen" count={260} color="#fff3c4" size={0.09} fall={0.15} shown={shown} />
      <Drift kind="snow" count={900} color="#ffffff" size={0.06} fall={1.1} shown={shown} />
      <Sparkles ref={fireflies} count={45} scale={[18, 3, 18]} position-y={1.4} size={5} speed={0.5} color="#f2ff9e" noise={1} />
    </group>
  );
}

function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.82} />
      {/* a diorama's shallow focus: sharp across his height, soft toward the sky and the bottom edge */}
      <TiltShift2 blur={0.1} taper={0.7} start={[0, 0.42]} end={[1, 0.42]} />
      <Vignette offset={0.28} darkness={0.45} />
      <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.2} />
    </EffectComposer>
  );
}

/** The Journey's world as a lit diorama: toon-shaded land under a moving sun, directed camera shots, weather per place,
 * and a drag (or ←/→) to look around him that springs back when you scroll on. */
export function DioramaWalk() {
  const { skyTop, skyHorizon } = DAY.braga;
  const look = useRef<Look>({ yaw: 0, target: 0, dragging: false });
  const scene = useRef<HTMLDivElement>(null);
  const [looked, setLooked] = useState(false);

  useEffect(() => {
    const el = scene.current!;
    let x = 0;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      look.current.dragging = true;
      x = e.clientX;
      el.dataset.dragging = "";
    };
    const move = (e: PointerEvent) => {
      if (!look.current.dragging) return;
      look.current.target -= (e.clientX - x) * 0.008;
      x = e.clientX;
      setLooked(true);
    };
    const up = () => {
      if (!look.current.dragging) return;
      look.current.dragging = false;
      delete el.dataset.dragging;
      // Unwind whole turns so springing back never spins him round and round.
      const turns = Math.round(look.current.target / TURN) * TURN;
      look.current.target -= turns;
      look.current.yaw -= turns;
    };
    const key = (e: KeyboardEvent) => {
      if (document.activeElement !== document.body || e.altKey || e.metaKey || e.ctrlKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      look.current.target += e.key === "ArrowLeft" ? 0.5 : -0.5;
      setLooked(true);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <>
      {/* The morning sky shows before WebGL draws, and stays if it never can. */}
      <div ref={scene} className={styles.scene} style={{ background: `linear-gradient(${skyTop}, ${skyHorizon})` }} aria-hidden>
        <Quiet>
          <Canvas flat shadows dpr={[1, 1.75]} camera={{ near: 0.1, far: 2000 }}>
            <Suspense fallback={null}>
              <World look={look} />
              <Effects />
            </Suspense>
          </Canvas>
        </Quiet>
      </div>
      <p className={styles.hint} data-hidden={looked || undefined}>
        Drag or use ← → to look around
      </p>
    </>
  );
}

useGLTF.preload(SCENE_URL);
useGLTF.preload(WALKER_URL);
