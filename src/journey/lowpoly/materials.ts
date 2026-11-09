import { Color, MeshBasicMaterial, type Mesh, type MeshStandardMaterial, type Object3D } from "three";
import { SLOTS, type Slot } from "./daylight";

// Both are safe to run twice on the same model (React does, in development): a second run reuses what the first put
// on the meshes, so the materials returned are always the ones being worn.

/** Flat, unlit colour per slot (the mockup's look): Blender baked each face's tone into its vertex colour. */
export function flatMaterials(root: Object3D): Map<Slot, MeshBasicMaterial> {
  const bySlot = new Map<Slot, MeshBasicMaterial>();
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const current = m.material as MeshStandardMaterial | MeshBasicMaterial;
    const name = current.name as Slot;
    if (!SLOTS.includes(name)) return;
    if (!bySlot.has(name)) {
      const reuse = (current as MeshBasicMaterial).isMeshBasicMaterial ? (current as MeshBasicMaterial) : null;
      bySlot.set(name, reuse ?? new MeshBasicMaterial({ name, vertexColors: true }));
    }
    m.material = bySlot.get(name)!;
  });
  return bySlot;
}

/** The walker keeps his own colours and baked tones, unlit; the time of day tints them (color = base × tint). */
export function figureMaterials(root: Object3D): { material: MeshBasicMaterial; base: Color }[] {
  const out: { material: MeshBasicMaterial; base: Color }[] = [];
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    m.frustumCulled = false; // skinned: its bind-pose bounds don't follow the walk
    const current = m.material as MeshStandardMaterial | MeshBasicMaterial;
    if (current.userData.base) {
      out.push({ material: current as MeshBasicMaterial, base: current.userData.base });
      return;
    }
    const base = current.color.clone();
    const material = new MeshBasicMaterial({ color: base, vertexColors: true });
    material.userData.base = base;
    m.material = material;
    out.push({ material, base });
  });
  return out;
}
