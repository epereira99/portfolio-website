"""1500s Portuguese nau, Townscaper-soft (spec §6, §7).

Run: Blender -b -P tools/blender/nau.py -- public/models/nau.glb

Bow faces Blender -Y (exports as glTF +Z). Deck surface at z = 2.2 (DECK_HEIGHT in
src/journey/voyage/poses.ts), marked by the DeckSpot empty.
"""

import math
import sys

import bpy

out = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
DECK = 2.2


def material(name, rgb):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*rgb, 1)
    m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.8
    return m


def hex_rgb(h):
    # sRGB hex -> linear, as Blender stores colors
    return tuple(((int(h[i : i + 2], 16) / 255) ** 2.2) for i in (1, 3, 5))


MAT = {
    "hull": material("Hull", hex_rgb("#8a5a35")),
    "castle": material("Castle", hex_rgb("#a8744a")),
    "mast": material("Mast", hex_rgb("#4a3018")),
    "sail": material("Sail", hex_rgb("#f1e6cc")),
    "cross": material("Cross", hex_rgb("#b3261e")),
}


def finish(obj, name, mat, bevel=0.0):
    obj.name = name
    obj.data.materials.append(MAT[mat])
    if bevel:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width, mod.segments, mod.limit_method = bevel, 4, "NONE"
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.shade_smooth()
    # Bake transforms into the mesh so exported bounds are in ship space.
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def box(name, size, loc, mat, bevel):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return finish(obj, name, mat, bevel)


def cylinder(name, radius, height, loc, mat):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=height, location=loc, vertices=12)
    return finish(bpy.context.active_object, name, mat)


# Hull: a rounded, high-sided tub from the keel (z -1.2) to the deck (z 2.2).
box("Hull", (3.2, 11.0, DECK + 1.2), (0, 0, (DECK - 1.2) / 2), "hull", 0.9)
box("Castle_Aft", (3.0, 3.2, 1.7), (0, 4.0, DECK + 0.85), "castle", 0.35)  # stern is +Y
box("Castle_Fore", (2.6, 2.4, 1.1), (0, -4.3, DECK + 0.55), "castle", 0.3)

MASTS = {"Fore": (-2.8, 7.0, 3.0, 2.4), "Main": (0.2, 9.0, 4.0, 3.2), "Mizzen": (2.9, 6.4, 2.6, 2.1)}
for name, (y, height, w, h) in MASTS.items():
    cylinder(f"Mast_{name}", 0.13, height, (0, y, DECK + height / 2), "mast")
    sail_z = DECK + height * 0.62
    # Square sail facing the bow (-Y), slightly in front of the mast.
    box(f"Sail_{name}", (w, 0.08, h), (0, y - 0.25, sail_z), "sail", 0.06)
    # Red cross of the Order of Christ on both faces (the camera mostly sees the stern side).
    bar = min(w, h) * 0.16
    for face, dy in (("Front", -0.32), ("Back", -0.18)):
        box(f"Cross_{name}_{face}_V", (bar, 0.04, h * 0.72), (0, y + dy, sail_z), "cross", 0.02)
        box(f"Cross_{name}_{face}_H", (w * 0.62, 0.04, bar), (0, y + dy, sail_z), "cross", 0.02)

deck_spot = bpy.data.objects.new("DeckSpot", None)
deck_spot.location = (0, 0, DECK)
bpy.context.scene.collection.objects.link(deck_spot)

bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_animations=False)
print("wrote", out)
