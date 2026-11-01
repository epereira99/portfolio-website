"""Placeholder avatar following the avatar contract (spec §8).

Run: Blender -b -P tools/blender/placeholder_avatar.py -- public/models/avatar.glb

Mixamo bone names, rigidly skinned rounded parts, ~1.8 units tall, facing Blender -Y
(exports as glTF +Z), clips: idle, walk, turn.
"""

import math
import sys

import bpy
import bmesh
from mathutils import Matrix, Vector

out = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.render.fps = 24

# name: (head, tail, parent)
BONES = {
    "Hips": ((0, 0, 0.95), (0, 0, 1.05), None),
    "Spine": ((0, 0, 1.05), (0, 0, 1.38), "Hips"),
    "Neck": ((0, 0, 1.38), (0, 0, 1.48), "Spine"),
    "Head": ((0, 0, 1.48), (0, 0, 1.75), "Neck"),
    "LeftUpLeg": ((0.1, 0, 0.95), (0.1, 0, 0.5), "Hips"),
    "LeftLeg": ((0.1, 0, 0.5), (0.1, 0, 0.04), "LeftUpLeg"),
    "RightUpLeg": ((-0.1, 0, 0.95), (-0.1, 0, 0.5), "Hips"),
    "RightLeg": ((-0.1, 0, 0.5), (-0.1, 0, 0.04), "RightUpLeg"),
    "LeftArm": ((0.24, 0, 1.36), (0.27, 0, 1.06), "Spine"),
    "LeftForeArm": ((0.27, 0, 1.06), (0.29, 0, 0.78), "LeftArm"),
    "RightArm": ((-0.24, 0, 1.36), (-0.27, 0, 1.06), "Spine"),
    "RightForeArm": ((-0.27, 0, 1.06), (-0.29, 0, 0.78), "RightArm"),
}
P = "mixamorig:"

arm_data = bpy.data.armatures.new("Armature")
arm = bpy.data.objects.new("Avatar", arm_data)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for name, (head, tail, parent) in BONES.items():
    b = arm_data.edit_bones.new(P + name)
    b.head, b.tail = Vector(head), Vector(tail)
    if parent:
        b.parent = arm_data.edit_bones[P + parent]
bpy.ops.object.mode_set(mode="OBJECT")

# Rounded parts: (bone, center, radii, material index)
PARTS = [
    ("Spine", (0, 0, 1.2), (0.2, 0.13, 0.24), 0),
    ("Hips", (0, 0, 0.97), (0.17, 0.12, 0.1), 1),
    ("Head", (0, 0, 1.62), (0.12, 0.12, 0.13), 2),
    ("LeftUpLeg", (0.1, 0, 0.72), (0.075, 0.075, 0.24), 1),
    ("LeftLeg", (0.1, 0, 0.27), (0.065, 0.065, 0.25), 1),
    ("RightUpLeg", (-0.1, 0, 0.72), (0.075, 0.075, 0.24), 1),
    ("RightLeg", (-0.1, 0, 0.27), (0.065, 0.065, 0.25), 1),
    ("LeftArm", (0.26, 0, 1.21), (0.055, 0.055, 0.17), 0),
    ("LeftForeArm", (0.28, 0, 0.92), (0.05, 0.05, 0.16), 2),
    ("RightArm", (-0.26, 0, 1.21), (0.055, 0.055, 0.17), 0),
    ("RightForeArm", (-0.28, 0, 0.92), (0.05, 0.05, 0.16), 2),
    # A simple face (front is Blender -Y) so the ending's turn toward the viewer reads.
    ("Head", (0, -0.12, 1.6), (0.025, 0.03, 0.03), 2),
    ("Head", (0.045, -0.105, 1.655), (0.018, 0.012, 0.018), 3),
    ("Head", (-0.045, -0.105, 1.655), (0.018, 0.012, 0.018), 3),
]
COLORS = [(0.93, 0.55, 0.45, 1), (0.25, 0.3, 0.5, 1), (0.96, 0.82, 0.68, 1), (0.05, 0.05, 0.07, 1)]  # shirt, trousers, skin, eyes

mesh = bpy.data.meshes.new("Body")
body = bpy.data.objects.new("Body", mesh)
bpy.context.scene.collection.objects.link(body)
for c in COLORS:
    m = bpy.data.materials.new("m")
    m.diffuse_color = c
    m.use_nodes = True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = c
    mesh.materials.append(m)

bm = bmesh.new()
deform = bm.verts.layers.deform.verify()
groups = {name: body.vertex_groups.new(name=P + name).index for name in BONES}
for bone, center, radii, mat in PARTS:
    before = set(bm.verts)
    res = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=1)
    xf = Matrix.Translation(center) @ Matrix.Diagonal((*radii, 1))
    bmesh.ops.transform(bm, matrix=xf, verts=res["verts"])
    for v in set(bm.verts) - before:
        v[deform][groups[bone]] = 1.0
        for f in v.link_faces:
            f.material_index = mat
            f.smooth = True
bm.to_mesh(mesh)
bm.free()

body.parent = arm
mod = body.modifiers.new("Armature", "ARMATURE")
mod.object = arm

for pb in arm.pose.bones:
    pb.rotation_mode = "XYZ"


def make_action(name, keys, length):
    """keys: {bone: [(frame, (x, y, z) degrees), ...]}"""
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    arm.animation_data_create()
    arm.animation_data.action = act
    for bone, frames in keys.items():
        pb = arm.pose.bones[P + bone]
        for frame, rot in frames:
            pb.rotation_euler = [math.radians(a) for a in rot]
            pb.keyframe_insert("rotation_euler", frame=frame)
    act.frame_range = (1, length)
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0)
    arm.animation_data.action = None


def swing(deg):
    return [(1, (deg, 0, 0)), (13, (-deg, 0, 0)), (25, (deg, 0, 0))]


make_action("idle", {"Spine": [(1, (0, 0, 0)), (25, (3, 0, 0)), (49, (0, 0, 0))]}, 49)
make_action(
    "walk",  # one stride of 1.6 units per second
    {
        "LeftUpLeg": swing(30),
        "RightUpLeg": swing(-30),
        "LeftArm": swing(-20),
        "RightArm": swing(20),
    },
    25,
)
make_action("turn", {"Hips": [(1, (0, 0, 0)), (25, (0, 180, 0))]}, 25)

bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_skins=True,
    export_yup=True,
)
print("wrote", out)
