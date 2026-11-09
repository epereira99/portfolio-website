import {
  BoxGeometry, DataTexture, LinearFilter, Mesh, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat,
  SphereGeometry, Vector3, type BufferGeometry, type MeshToonMaterialParameters, type Object3D, type SkinnedMesh,
} from "three";
import { SLOTS, type Slot } from "../lowpoly/daylight";

// Three light bands, like a cel-shaded diorama: shade, half-light, full sun.
const BANDS = new DataTexture(new Uint8Array([110, 190, 255]), 3, 1, RedFormat);
BANDS.minFilter = BANDS.magFilter = NearestFilter;
BANDS.needsUpdate = true;

// Faceted, one normal per face like the Blender models; the toon shader honours flatShading though its types omit it.
export const toon = (params: MeshToonMaterialParameters) =>
  Object.assign(new MeshToonMaterial({ ...params, gradientMap: BANDS }), { flatShading: true });

/** Shared clock for the trees' wind, advanced by the scene each frame. */
export const wind = { value: 0 };

// Tree tops sway with the wind, more the higher the vertex, each tree out of step with its neighbours.
function sway(material: MeshToonMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = `uniform float uWind;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 root = instanceMatrix[3].xz;
      #else
        vec2 root = vec2(0.0);
      #endif
      float bend = max(position.y, 0.0) * 0.035;
      transformed.x += sin(uWind * 1.3 + root.x * 0.4 + root.y * 0.3) * bend;
      transformed.z += cos(uWind * 1.1 + root.x * 0.3) * bend * 0.6;`,
    );
  };
}

// The Swedish flag ripples in the same wind: waves run out along the cloth from the pole (its local x, 0 to 1.8),
// growing toward the free end, so the edge on the pole and the ball on top stay still.
function flutter(material: MeshToonMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = wind;
    shader.vertexShader = `uniform float uWind;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      float along = max(position.x, 0.0);
      transformed.z += sin(uWind * 4.0 - along * 3.5) * along * 0.12;
      transformed.y += sin(uWind * 3.0 - along * 2.5) * along * 0.03;`,
    );
  };
}

// The signs' lettering and Deloitte's green dot: painted, not lit from within, but their shade stays light, so a sign
// facing away from the sun still reads.
const LETTERING = new DataTexture(new Uint8Array([185, 225, 255]), 3, 1, RedFormat);
LETTERING.minFilter = LETTERING.magFilter = NearestFilter;
LETTERING.needsUpdate = true;
const PAINTED: Slot[] = ["letters", "sign_green"];

// Blender exports both models without normals, since the classic walk draws them unlit (tools/blender/lowpoly).
const lit = (m: Mesh) => m.geometry.attributes.normal || m.geometry.computeVertexNormals();

/** The scene lit and cel-shaded: Blender's baked tones stay in the vertex colours, the time of day sets each slot's
 * colour, and the sun now shades and shadows them. Safe to run twice on the same model, like lowpoly/materials.ts. */
export function toonScene(root: Object3D): Map<Slot, MeshToonMaterial> {
  const bySlot = new Map<Slot, MeshToonMaterial>();
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const name = (m.material as MeshToonMaterial).name as Slot;
    if (!SLOTS.includes(name)) return;
    lit(m);
    if (!bySlot.has(name)) {
      const reuse = (m.material as MeshToonMaterial).isMeshToonMaterial ? (m.material as MeshToonMaterial) : null;
      const material = reuse ?? toon({ name, vertexColors: true });
      if (!reuse && PAINTED.includes(name)) material.gradientMap = LETTERING;
      if (!reuse && name === "tree") sway(material);
      if (!reuse && (name === "flag_blue" || name === "flag_yellow")) flutter(material);
      bySlot.set(name, material);
    }
    m.material = bySlot.get(name)!;
    m.castShadow = name !== "cloud" && !name.startsWith("ridge");
    m.receiveShadow = true;
  });
  return bySlot;
}

// He's shaded softly, not in hard facets: two wide bands blended at the edge, light enough that his dark jacket and
// hair keep their shape in shade.
const SOFT = new DataTexture(new Uint8Array([150, 205, 255]), 3, 1, RedFormat);
SOFT.minFilter = SOFT.magFilter = LinearFilter;
SOFT.needsUpdate = true;

/** Smooth normals across the AI mesh's split vertices (same place, same normal), so light rolls over him. */
function smooth(g: BufferGeometry) {
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const sums = new Map<string, Vector3>();
  const key = (i: number) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    if (!sums.has(k)) sums.set(k, new Vector3());
    sums.get(k)!.add(new Vector3(nor.getX(i), nor.getY(i), nor.getZ(i)));
  }
  for (let i = 0; i < pos.count; i++) {
    const n = sums.get(key(i))!.clone().normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
}

/** The walker in his own flat colours, softly shaded and casting his shadow. The baked two-tone patchwork (vertex
 * colours, for the unlit classic walk) is left out: the light does that job here. */
export function toonFigure(root: Object3D): void {
  const meshes: SkinnedMesh[] = [];
  root.traverse((o) => {
    if ((o as SkinnedMesh).isSkinnedMesh) meshes.push(o as SkinnedMesh);
  });
  for (const m of meshes) {
    m.frustumCulled = false; // skinned: its bind-pose bounds don't follow the walk
    m.castShadow = true;
    const current = m.material as MeshToonMaterial;
    if (current.userData.figure) continue; // done on an earlier run (React runs this twice in development)
    smooth(m.geometry);
    m.material = new MeshToonMaterial({ name: current.name, color: current.color, gradientMap: SOFT });
    m.material.userData.figure = true;
  }
}

const EYE = new MeshBasicMaterial({ color: "#1a1214" });
const BROW = new MeshBasicMaterial({ color: "#2a1c16" });

/** Eyes and brows: the model has none (too small for its mesh, tools/blender/lowpoly/walker.py), which left a blank
 * face. Placed by measuring the face in the rest pose, while he stands at the origin facing −Z, and carried by the
 * head bone from then on. */
export function addFace(root: Object3D, head: Object3D): void {
  if (head.userData.face) return;
  head.userData.face = true;
  root.updateMatrixWorld(true);
  const skin: Vector3[] = [];
  root.traverse((o) => {
    const m = o as SkinnedMesh;
    if (!m.isSkinnedMesh || (m.material as MeshToonMaterial).name !== "skin") return;
    const pos = m.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      skin.push(m.applyBoneTransform(i, new Vector3().fromBufferAttribute(pos, i)).applyMatrix4(m.matrixWorld));
    }
  });
  const top = Math.max(...skin.map((v) => v.y));
  const face = skin.filter((v) => v.y > top - 0.7 && Math.abs(v.x) < 0.15);
  if (face.length === 0) return;
  const front = Math.min(...face.map((v) => v.z));
  const frontal = face.filter((v) => v.z < front + 0.06);
  const yTop = Math.max(...frontal.map((v) => v.y));
  const yBot = Math.min(...frontal.map((v) => v.y));
  const eyeY = yBot + 0.58 * (yTop - yBot);
  const row = skin.filter((v) => Math.abs(v.y - eyeY) < 0.03 && v.z < front + 0.1);
  const half = (Math.max(...row.map((v) => v.x)) - Math.min(...row.map((v) => v.x))) / 2;
  const r = half * 0.17;
  for (const side of [-1, 1]) {
    const x = side * half * 0.46;
    const near = skin.filter((v) => Math.abs(v.x - x) < 0.03 && Math.abs(v.y - eyeY) < 0.03);
    const z = near.length ? Math.min(...near.map((v) => v.z)) : front;
    const eye = new Mesh(new SphereGeometry(r, 12, 8), EYE);
    eye.position.set(x, eyeY, z + r * 0.35); // half sunk into the face
    eye.scale.set(1, 1.25, 0.6);
    const brow = new Mesh(new BoxGeometry(r * 2.4, r * 0.8, r * 0.8), BROW);
    brow.position.set(x, eyeY + r * 2.1, z + r * 0.15);
    brow.rotation.z = side * -0.12;
    head.attach(eye);
    head.attach(brow);
  }
}
