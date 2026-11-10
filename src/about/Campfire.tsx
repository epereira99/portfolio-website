"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, PointMaterial, useGLTF } from "@react-three/drei";
import {
  BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Euler, ExtrudeGeometry, IcosahedronGeometry,
  MeshBasicMaterial, Quaternion, Shape, ShapeGeometry, SRGBColorSpace, Vector2, Vector3,
  type Group, type PointLight, type Points,
} from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { CAMP_ITEMS, CHAT_NOTICE, STARTERS, type CampItemId } from "@/content/about";
import { addFace, toon, toonFigure } from "@/journey/diorama/toon";
import bubbleStyles from "@/ui/JourneyOverlay.module.css";
import { MAX_BUBBLES } from "@/ui/story";
import { PhotoZoom } from "@/ui/ProjectDialog";
import { useOpenProject } from "@/ui/useOpenProject";
import { campSpot, campView, leaveCamp, openThing, useCamp, useOpenThing } from "./camp";
import { MAX_QUESTION, askChat, failLine, linkSlug, type ChatImage, type ChatLink } from "./chat";
import styles from "./Campfire.module.css";

const WALKER_URL = "/models/walker.glb";

// A seeded scatter, so the camp looks the same on every visit.
const rand = (i: number) => {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

/** A paper-flat T-shirt outline in a 0.92 × 0.84 box, for a shirt laid on the grass. */
function shirtGeometry(back: boolean) {
  const pts: [number, number][] = [
    [-0.11, 0.42], [-0.27, 0.38], [-0.46, 0.24], [-0.37, 0.12], [-0.26, 0.2], [-0.26, -0.42],
    [0.26, -0.42], [0.26, 0.2], [0.37, 0.12], [0.46, 0.24], [0.27, 0.38], [0.11, 0.42], [0, back ? 0.4 : 0.34],
  ];
  return new ShapeGeometry(new Shape(pts.map(([x, y]) => new Vector2(x, y))));
}

// Canvas pixels for shirt coordinates: the texture spans the shirt's box (see shirtTexture's repeat/offset).
const px = (x: number) => ((x + 0.46) / 0.92) * 512;
const py = (y: number) => ((0.42 - y) / 0.92) * 512;

function shirtTexture(draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#f4f4f0";
  g.fillRect(0, 0, 512, 512);
  draw(g);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.repeat.set(1 / 0.92, 1 / 0.92); // ShapeGeometry's UVs are its raw x, y
  tex.offset.set(0.46 / 0.92, 0.42 / 0.92);
  return tex;
}

/** Sporting's home shirt: green and white hoops under a dark green yoke, white collar. */
const sportingShirt = () =>
  shirtTexture((g) => {
    g.fillStyle = "#1f6b3a";
    for (let k = 0; k < 8; k += 2) g.fillRect(0, py(0.3 - k * 0.1), 512, (0.1 / 0.92) * 512);
    g.fillStyle = "#17552e";
    g.fillRect(0, 0, 512, py(0.33));
    g.strokeStyle = "#f4f4f0";
    g.lineWidth = 14;
    g.beginPath();
    g.moveTo(px(-0.12), py(0.42));
    g.lineTo(px(0), py(0.33));
    g.lineTo(px(0.12), py(0.42));
    g.stroke();
  });

/** His own kit from behind: the reference's white shirt with its blue turned black, EDUARDO 19. */
const eduardoShirt = () =>
  shirtTexture((g) => {
    for (const side of [-1, 1]) {
      const grad = g.createLinearGradient(0, py(0.05), 0, py(-0.42));
      grad.addColorStop(0, "#f4f4f000");
      grad.addColorStop(1, "#1a1a1a");
      g.fillStyle = grad;
      g.fillRect(px(side < 0 ? -0.26 : 0.19), py(0.05), (0.07 / 0.92) * 512, py(-0.42) - py(0.05));
    }
    g.strokeStyle = "#141414";
    g.lineWidth = 16;
    g.beginPath();
    g.moveTo(px(-0.12), py(0.42));
    g.quadraticCurveTo(px(0), py(0.38), px(0.12), py(0.42));
    g.stroke();
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(px(s * 0.46), py(0.24));
      g.lineTo(px(s * 0.37), py(0.12));
      g.stroke();
    }
    g.fillStyle = "#141414";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "900 44px 'Arial Black', Impact, sans-serif";
    g.fillText("EDUARDO", 256, py(0.26));
    g.font = "900 190px 'Arial Black', Impact, sans-serif";
    g.fillText("19", 256, py(0.02));
  });

/** A football: an icosphere with twelve round black patches where an icosahedron's corners would be. */
function footballGeometry() {
  const geo = new IcosahedronGeometry(0.17, 3);
  const phi = (1 + Math.sqrt(5)) / 2;
  const corners = [
    [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi], [1, phi, 0], [-1, phi, 0],
    [1, -phi, 0], [-1, -phi, 0], [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1],
  ].map(([x, y, z]) => new Vector3(x, y, z).normalize());
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    c.set(0, 0, 0);
    for (let j = 0; j < 3; j++) c.add(new Vector3().fromBufferAttribute(pos, i + j));
    c.normalize();
    const black = corners.some((k) => k.dot(c) > 0.94);
    for (let j = 0; j < 3; j++) colors.set(black ? [0.06, 0.06, 0.06] : [0.95, 0.95, 0.93], (i + j) * 3);
  }
  geo.setAttribute("color", new BufferAttribute(colors, 3));
  return geo;
}

function snowboardGeometry() {
  const L = 0.7;
  const W = 0.14;
  const s = new Shape();
  s.moveTo(-W, -L + W);
  s.lineTo(-W, L - W);
  s.absarc(0, L - W, W, Math.PI, 0, true);
  s.lineTo(W, -L + W);
  s.absarc(0, -L + W, W, 0, Math.PI, true);
  return new ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 10 });
}

/** The lean-to's sheet, after the reference (art/references/tent-zelda.png): a worn triangle of dark cloth hung from
 * the top of its pole down to two pegs, sagging between them and drooping along its free edges, patchy with wear. */
function sheetGeometry(apex: Vector3, left: Vector3, right: Vector3) {
  const N = 10;
  const at = (i: number, j: number) => {
    const a = i / N; // from the pegged edge (0) up to the pole (1)
    const b = i === N ? 0.5 : j / (N - i); // across
    const p = new Vector3().lerpVectors(left, right, b).lerp(apex, a);
    p.y -= Math.sin(Math.PI * a) * (0.1 + 0.3 * Math.sin(Math.PI * b));
    return p.toArray();
  };
  const verts: number[] = [];
  const colors: number[] = [];
  const tri = (k: number, ...pts: number[][]) => {
    const tone = 0.78 + rand(k) * 0.3; // patches of faded and darker cloth
    for (const p of pts) {
      verts.push(...p);
      colors.push(tone, tone * 0.97, tone * 0.93);
    }
  };
  let k = 0;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N - i; j++) {
      tri(k++, at(i, j), at(i, j + 1), at(i + 1, j));
      if (j < N - i - 1) tri(k++, at(i, j + 1), at(i + 1, j + 1), at(i + 1, j));
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array(verts), 3));
  geo.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  geo.computeVertexNormals();
  return geo;
}

type ItemProps = {
  id: CampItemId;
  children: ReactNode;
  labelAt: [number, number, number];
  hovered: CampItemId | null;
  setHovered: (id: CampItemId | null) => void;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

/** A thing by the fire you can click while at the camp: it swells a little under the pointer and names itself. */
function Item({ id, children, labelAt, hovered, setHovered, position, rotation }: ItemProps) {
  const group = useRef<Group>(null);
  const on = hovered === id;
  useFrame((_, dt) => {
    const g = group.current!;
    g.scale.setScalar(g.scale.x + ((on ? 1.08 : 1) - g.scale.x) * Math.min(dt * 12, 1));
  });
  const title = CAMP_ITEMS.find((i) => i.id === id)!.title;
  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!campView.shown) return; // walking past, the camp is scenery
        e.stopPropagation();
        openThing(id);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (!campView.shown) return;
        e.stopPropagation();
        setHovered(id);
      }}
      onPointerOut={() => setHovered(null)}
    >
      {children}
      {on && (
        <Html position={labelAt} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
          <span className={styles.label}>{title}</span>
        </Html>
      )}
    </group>
  );
}

// Sitting on the log: local bone turns on top of the rest pose, in radians.
const SIT: Record<string, [number, number, number]> = {
  mixamorigSpine: [0.12, 0, 0],
  mixamorigLeftUpLeg: [1.5, 0, -0.12],
  mixamorigRightUpLeg: [1.5, 0, 0.12],
  mixamorigLeftLeg: [-1.45, 0, 0],
  mixamorigRightLeg: [-1.45, 0, 0],
  mixamorigLeftArm: [0.5, 0, 1.0],
  mixamorigRightArm: [0.5, 0, -1.0],
  mixamorigLeftForeArm: [0, 0, 0.6],
  mixamorigRightForeArm: [0, 0, -0.6],
};

/** Him on his log, facing the road (the camera) and turned a little toward the fire; only there while you visit,
 * since on the road he's the one walking. */
function Him() {
  const walker = useGLTF(WALKER_URL);
  const group = useRef<Group>(null);
  const figure = useMemo(() => {
    const s = clone(walker.scene); // his own copy: the journey's walk keeps the original
    toonFigure(s);
    const head = s.getObjectByName("mixamorigHead");
    if (head) addFace(s, head);
    for (const [name, [x, y, z]] of Object.entries(SIT)) {
      s.getObjectByName(name)?.quaternion.multiply(new Quaternion().setFromEuler(new Euler(x, y, z)));
    }
    return s;
  }, [walker.scene]);
  useFrame(() => void (group.current!.visible = campView.shown));
  return (
    <group ref={group}>
      <primitive object={figure} position={[0, -0.3, 0]} rotation={[0, Math.PI + 0.3, 0]} />
    </group>
  );
}

// The flames as a cartoon game draws them: a crown of orange tongues leaning out round a taller yellow heart.
const FLAME = [
  new MeshBasicMaterial({ color: "#ff5a1a", toneMapped: false }),
  new MeshBasicMaterial({ color: "#ff9a1f", toneMapped: false }),
  new MeshBasicMaterial({ color: "#ffe066", toneMapped: false }),
];
const TONGUES = [
  ...Array.from({ length: 7 }, (_, i) => ({ a: (i / 7) * Math.PI * 2, d: 0.13, r: 0.1, h: 0.42 + rand(i) * 0.3, tilt: 0.35, tone: 0 })),
  ...Array.from({ length: 4 }, (_, i) => ({ a: (i / 4) * Math.PI * 2 + 0.4, d: 0.06, r: 0.09, h: 0.62 + rand(i + 20) * 0.25, tilt: 0.15, tone: 1 })),
  { a: 0, d: 0, r: 0.08, h: 0.95, tilt: 0, tone: 1 },
  { a: 0, d: 0, r: 0.06, h: 0.6, tilt: 0, tone: 2 },
  ...Array.from({ length: 3 }, (_, i) => ({ a: (i / 3) * Math.PI * 2, d: 0.05, r: 0.045, h: 0.38 + rand(i + 40) * 0.15, tilt: 0.2, tone: 2 })),
].map((f) => ({ ...f, x: Math.cos(f.a) * f.d, z: Math.sin(f.a) * f.d }));

const EMBERS = 30;

/** Sparks rising off the fire, drifting as they go, and starting again at the logs. */
function Embers() {
  const points = useRef<Points>(null);
  const positions = useMemo(() => new BufferAttribute(new Float32Array(EMBERS * 3), 3), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < EMBERS; i++) {
      const life = (t * (0.25 + rand(i) * 0.2) + rand(i + 7)) % 1;
      const sway = Math.sin(t * 2 + i) * 0.12 * life;
      positions.setXYZ(i, (rand(i + 3) - 0.5) * 0.4 + sway, 0.4 + life * 2.4, (rand(i + 5) - 0.5) * 0.4 + sway * 0.5);
    }
    // eslint-disable-next-line react-hooks/immutability -- three.js state, not React state
    positions.needsUpdate = true;
  });
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry attributes={{ position: positions }} />
      <PointMaterial transparent depthWrite={false} color="#ffb347" size={0.05} sizeAttenuation toneMapped={false} />
    </points>
  );
}

function Fire({ reduced, position }: { reduced: boolean; position: [number, number, number] }) {
  const light = useRef<PointLight>(null);
  const flames = useRef<Group>(null);
  const stone = useMemo(() => toon({ color: "#7d7f86" }), []);
  const wood = useMemo(() => toon({ color: "#5b3a22" }), []);
  useFrame(({ clock }) => {
    if (reduced) return;
    const t = clock.elapsedTime;
    light.current!.intensity = 6 + Math.sin(t * 11) * 0.6 + Math.sin(t * 17.3) * 0.4;
    flames.current!.children.forEach((f, i) => {
      f.scale.y = 1 + Math.sin(t * (6 + rand(i) * 6) + i * 2) * 0.22; // each tongue licks up on its own beat
      f.scale.x = f.scale.z = 1 - Math.sin(t * 9 + i) * 0.08;
    });
  });
  return (
    <group position={position}>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <mesh key={i} receiveShadow material={stone} position={[Math.cos(a) * 0.62, 0.08, Math.sin(a) * 0.62]} rotation={[rand(i), rand(i + 9) * 3, 0]} scale={[1, 0.75, 1]}>
            <dodecahedronGeometry args={[0.14 + rand(i + 3) * 0.05, 0]} />
          </mesh>
        );
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} castShadow material={wood} position={[Math.cos(a) * 0.2, 0.22, Math.sin(a) * 0.2]} rotation={[0, -a, 0.9]}>
            <cylinderGeometry args={[0.05, 0.06, 0.62, 6]} />
          </mesh>
        );
      })}
      <group ref={flames} position={[0, 0.1, 0]}>
        {TONGUES.map((f, i) => (
          <group key={i} position={[f.x, 0, f.z]} rotation={[f.tilt * Math.sin(f.a), 0, -f.tilt * Math.cos(f.a)]}>
            <mesh position={[0, f.h / 2, 0]} material={FLAME[f.tone]}>
              <coneGeometry args={[f.r, f.h, 5]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* no shadows from the fire: a point light's would redraw the whole world six more times a frame */}
      <pointLight ref={light} position={[0, 0.7, 0]} color="#ff9a4a" intensity={6} distance={8} decay={1.6} />
      {!reduced && <Embers />}
    </group>
  );
}

// The lean-to behind him: a tall pole leaning a little, the sheet's tip tied near its top, its other corners pegged.
const POLE_FOOT = new Vector3(-1.15, 0, -1.0);
const POLE_LEAN = 0.08;
const POLE_H = 2.8;
const APEX = new Vector3(POLE_FOOT.x + Math.sin(POLE_LEAN) * 2.55, 2.55 * Math.cos(POLE_LEAN), POLE_FOOT.z);
const PEG_A = new Vector3(2.1, 0, -1.4);
const PEG_B = new Vector3(0.1, 0, -2.9);

function Tent() {
  const sheet = useMemo(() => sheetGeometry(APEX, PEG_A, PEG_B), []);
  const cloth = useMemo(() => toon({ color: "#5e4b3b", vertexColors: true, side: DoubleSide }), []);
  const wood = useMemo(() => toon({ color: "#6b4a2c" }), []);
  return (
    <group>
      <mesh geometry={sheet} material={cloth} castShadow />
      <mesh
        position={[POLE_FOOT.x + Math.sin(POLE_LEAN) * (POLE_H / 2), (POLE_H / 2) * Math.cos(POLE_LEAN), POLE_FOOT.z]}
        rotation={[0, 0, -POLE_LEAN]}
        castShadow
        material={wood}
      >
        <cylinderGeometry args={[0.04, 0.055, POLE_H, 6]} />
      </mesh>
      {[PEG_A, PEG_B].map((p) => (
        <mesh key={p.x} position={[p.x, 0.06, p.z]} rotation={[0.3, 0, 0]} material={wood}>
          <cylinderGeometry args={[0.025, 0.012, 0.22, 5]} />
        </mesh>
      ))}
    </group>
  );
}

/** Firewood stacked crosswise by the tent, like the pile in the reference. */
function Woodpile({ position }: { position: [number, number, number] }) {
  const bark = useMemo(() => toon({ color: "#7a4a2a" }), []);
  const logs = [
    [-0.18, 0.07, 0, 0], [0, 0.07, 0, 0], [0.18, 0.07, 0, 0],
    [0, 0.2, -0.2, Math.PI / 2], [0, 0.2, 0.2, Math.PI / 2],
    [-0.09, 0.33, 0, 0], [0.09, 0.33, 0, 0],
  ];
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      {logs.map(([x, y, z, turn], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, turn]} castShadow receiveShadow material={bark}>
          <cylinderGeometry args={[0.07, 0.075, 0.8, 7]} />
        </mesh>
      ))}
    </group>
  );
}

function Tv({ reduced }: { reduced: boolean }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 48;
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  const last = useRef(-1);
  const body = useMemo(() => toon({ color: "#7a5a3a" }), []);
  const dark = useMemo(() => toon({ color: "#2a2622" }), []);
  // Snow on the screen, redrawn a dozen times a second (once, and still, under reduced motion).
  // eslint-disable-next-line react-hooks/immutability -- three.js state, not React state
  useFrame(({ clock }) => {
    if (reduced && last.current >= 0) return;
    if (clock.elapsedTime - last.current < 0.08) return;
    last.current = clock.elapsedTime;
    const g = (tex.image as HTMLCanvasElement).getContext("2d")!;
    const img = g.createImageData(64, 48);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 90 + Math.random() * 165;
      img.data.set([v * 0.85, v * 0.92, v, 255], i);
    }
    g.putImageData(img, 0, 0);
    // eslint-disable-next-line react-hooks/immutability -- three.js state, not React state
    tex.needsUpdate = true;
  });
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow material={body}>
        <boxGeometry args={[0.78, 0.56, 0.58]} />
      </mesh>
      <mesh position={[-0.08, 0.31, 0.291]} material={dark}>
        <planeGeometry args={[0.56, 0.44]} />
      </mesh>
      <mesh position={[-0.08, 0.31, 0.293]}>
        <planeGeometry args={[0.5, 0.38]} />
        <meshBasicMaterial map={tex} toneMapped={false} color="#cfe3ff" />
      </mesh>
      {[0.36, 0.24].map((y) => (
        <mesh key={y} position={[0.3, y, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={dark}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 8]} />
        </mesh>
      ))}
      {[-0.45, 0.45].map((tilt) => (
        <mesh key={tilt} position={[Math.sin(tilt) * 0.22, 0.58 + Math.cos(tilt) * 0.22, -0.05]} rotation={[0, 0, -tilt]} material={dark}>
          <cylinderGeometry args={[0.008, 0.008, 0.46, 4]} />
        </mesh>
      ))}
    </group>
  );
}

/** His camp in the 3D world, off the road near the journey's end: fire, lean-to and his things, in the camp's own
 * frame (he sits at the origin, +Z toward the road and the camera). Drawn inside DioramaWalk's canvas. */
export function Camp() {
  const [hovered, setHovered] = useState<CampItemId | null>(null);
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const spot = useMemo(() => campSpot(), []);
  const m = useMemo(
    () => ({
      dirt: toon({ color: "#6b5640" }),
      log: toon({ color: "#6b4a2c" }),
      sporting: toon({ map: sportingShirt() }),
      kit: toon({ map: eduardoShirt() }),
      ball: toon({ vertexColors: true }),
      board: toon({ color: "#2b7a9a" }),
      binding: toon({ color: "#1b1b1b" }),
    }),
    [],
  );
  const geo = useMemo(
    () => ({ front: shirtGeometry(false), back: shirtGeometry(true), ball: footballGeometry(), board: snowboardGeometry() }),
    [],
  );
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => void (document.body.style.cursor = "");
  }, [hovered]);
  const item = { hovered, setHovered };

  return (
    <group position={[spot.x, 0, spot.z]} rotation={[0, spot.yaw, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.5, 0.02, 0.3]} receiveShadow material={m.dirt}>
        <circleGeometry args={[2.4, 20]} />
      </mesh>
      <Fire reduced={reduced} position={[1.15, 0, 0.95]} />
      <Tent />
      <Woodpile position={[-1.9, 0, -0.2]} />
      <mesh position={[0, 0.13, -0.05]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={m.log}>
        <cylinderGeometry args={[0.13, 0.14, 1.1, 8]} />
      </mesh>
      <Him />

      <Item id="sporting" {...item} position={[1.7, 0.03, 2.2]} rotation={[0, -0.3, 0]} labelAt={[0, 0.5, 0]}>
        <mesh geometry={geo.front} material={m.sporting} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      </Item>
      <Item id="kit" {...item} position={[2.7, 0.03, 1.5]} rotation={[0, 0.35, 0]} labelAt={[0, 0.5, 0]}>
        <mesh geometry={geo.back} material={m.kit} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
      </Item>
      <mesh geometry={geo.ball} material={m.ball} position={[2.3, 0.17, 2.6]} castShadow />
      <Item id="snowboard" {...item} position={[2.3, 0.62, -1.1]} rotation={[0, -0.3, -0.15]} labelAt={[0, 0.95, 0]}>
        <mesh geometry={geo.board} material={m.board} castShadow />
        {[-0.25, 0.25].map((y) => (
          <mesh key={y} position={[0, y, 0.05]} material={m.binding}>
            <boxGeometry args={[0.2, 0.08, 0.06]} />
          </mesh>
        ))}
      </Item>
      <Item id="tv" {...item} position={[-1.9, 0, 1.3]} rotation={[0, 0.5, 0]} labelAt={[0, 1.0, 0]}>
        <Tv reduced={reduced} />
      </Item>
    </group>
  );
}

type Answer = { bubbles: string[]; links: ChatLink[]; images: ChatImage[] };

/** The page's side of the camp: the fade there and back, the way back to the journey, the things as buttons (for
 * keyboards and screen readers), his bubble about whichever thing you last clicked, and asking him anything: his
 * answer in speech bubbles, the photos it mentions (or his thinking) in a thought bubble. */
export function CampScreen() {
  const camp = useCamp();
  const openId = useOpenThing();
  const item = camp ? CAMP_ITEMS.find((i) => i.id === openId) : undefined;
  const { open } = useOpenProject();
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [big, setBig] = useState<ChatImage | null>(null); // the photo enlarged, as on a project's polaroids
  const pending = useRef<AbortController | null>(null);

  async function ask(q: string) {
    q = q.trim();
    if (!q || thinking) return;
    openThing(null); // his answer takes the place of whatever thing he was talking about
    setQuestion("");
    setAsked(true);
    setThinking(true);
    setAnswer({ bubbles: [], links: [], images: [] });
    const ctrl = (pending.current = new AbortController());
    try {
      await askChat(
        q,
        (e) => {
          if (e.event === "bubble") setThinking(false);
          setAnswer((a) =>
            e.event === "bubble" ? { ...a!, bubbles: [...a!.bubbles, e.data.text] }
            : e.event === "links" ? { ...a!, links: e.data }
            : e.event === "images" ? { ...a!, images: e.data }
            : a,
          );
        },
        ctrl.signal,
      );
    } catch (err) {
      if (!ctrl.signal.aborted) setAnswer({ bubbles: [failLine((err as { status?: number }).status)], links: [], images: [] });
    } finally {
      setThinking(false);
    }
  }

  const said = item ? [item.body] : (answer?.bubbles ?? []);
  const links = item ? [] : (answer?.links ?? []);
  const images = item ? [] : (answer?.images ?? []);
  // A fade to black and back each time the camp comes or goes; the world swaps what it draws under the black.
  const [seen, setSeen] = useState(camp);
  const [fades, setFades] = useState(0);
  if (seen !== camp) {
    setSeen(camp);
    setFades((f) => f + 1);
  }

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const swap = setTimeout(() => (campView.shown = camp), reduced ? 0 : 450);
    if (!camp) return () => clearTimeout(swap);
    const root = document.documentElement;
    root.style.overflow = "hidden"; // the journey holds its place while you sit by the fire
    return () => {
      clearTimeout(swap);
      root.style.overflow = "";
      openThing(null);
      pending.current?.abort(); // leaving mid-answer: drop it
    };
  }, [camp]);

  return (
    <>
      {fades > 0 && <div key={fades} className={styles.fade} aria-hidden />}
      {camp && (
        <>
          <h1 className={styles.hidden}>About me</h1>
          <button type="button" className={styles.back} onClick={leaveCamp}>
            ← Back to the journey
          </button>
          {/* the things as buttons for keyboards and screen readers only: on screen, you click the things themselves */}
          <nav className={styles.things} aria-label="Things by the fire">
            {CAMP_ITEMS.map((i) => (
              <button key={i.id} type="button" className={styles.thing} onClick={() => openThing(i.id)}>
                {i.title}
              </button>
            ))}
          </nav>
          {/* he tells you about the thing you clicked, in a bubble beside him like on the road */}
          {/* ...and answers what you ask him there, a sentence a bubble */}
          <aside className={`${bubbleStyles.bubbles} ${styles.campBubbles}`} aria-live="polite">
            {said.slice(-MAX_BUBBLES).map((text, i, shown) => (
              <p className={bubbleStyles.bubble} data-testid="bubble" key={`${item?.id ?? "a"}-${said.length - shown.length + i}`}>
                {text}
                {i === shown.length - 1 &&
                  links.map((l) => {
                    const slug = linkSlug(l.url);
                    return (
                      slug && (
                        <button key={l.url} type="button" className={styles.readMore} onClick={() => open(slug)}>
                          Read more: {l.title}
                        </button>
                      )
                    );
                  })}
              </p>
            ))}
          </aside>
          {/* what he's picturing: the photos his answer mentions, or the dots while he thinks */}
          <aside className={styles.thought} aria-live="polite" hidden={!thinking && images.length === 0}>
            {thinking ? (
              <span className={styles.dots} role="status" aria-label="Thinking">
                <i />
                <i />
                <i />
              </span>
            ) : (
              images.map((img) => (
                // the button carries keyboard and screen-reader use; the figure catches clicks on the caption too
                <figure key={img.src} className={styles.photo} onClick={() => setBig(img)}>
                  <button type="button" aria-label="Enlarge photo">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a photo the API picked, already sized webp */}
                    <img src={img.src} alt={img.alt} />
                  </button>
                  {img.caption && <figcaption>{img.caption}</figcaption>}
                </figure>
              ))
            )}
          </aside>
          {big && <PhotoZoom photo={big} onClose={() => setBig(null)} />}
          <form
            className={styles.chat}
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
          >
            {!asked && (
              <div className={styles.starters}>
                {STARTERS.map((q) => (
                  <button key={q} type="button" className={styles.thing} onClick={() => ask(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div className={styles.ask}>
              <label htmlFor="camp-ask" className={styles.hidden}>
                Ask me anything
              </label>
              <input
                id="camp-ask"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={MAX_QUESTION}
                placeholder="Ask me anything…"
                autoComplete="off"
                enterKeyHint="send"
              />
              <button type="submit" disabled={thinking || !question.trim()}>
                Ask
              </button>
            </div>
            <p className={styles.notice}>{CHAT_NOTICE}</p>
          </form>
        </>
      )}
    </>
  );
}

useGLTF.preload(WALKER_URL);
