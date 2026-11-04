"""blender -b -P tools/blender/lowpoly/walker.py -- public/models/walker.glb

Eduardo as a low-poly figure (dark jacket, jeans), 1.8 tall, feet at the origin, facing Blender +Y (the web's -Z,
down the path). One mesh rigidly skinned to six bones, with a looping 24-frame "Walk" action that covers
STRIDE_UNITS (src/journey/lowpoly/path.ts) of ground per loop; the web scrubs it by distance walked.
"""

import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
import common as c  # noqa: E402

c.setup()
JACKET = c.material("jacket", "#1f2430")
JEANS = c.material("jeans", "#4a6a96")
SHOES = c.material("shoes", "#1a1a1a")
SKIN = c.material("skin", "#d9a988")
HAIR = c.material("hair", "#2a211c")


def box(mat, bone, x0, x1, y0, y1, z0, z1):
    ob = c.primitive("primitive_cube_add", mat, size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    ob.scale = (x1 - x0, y1 - y0, z1 - z0)
    vg = ob.vertex_groups.new(name=bone)
    vg.add(range(len(ob.data.vertices)), 1.0, "REPLACE")
    return ob


parts = []
for side, s in (("L", 1), ("R", -1)):
    x = 0.1 * s
    ax = 0.29 * s  # arms hang just outside the torso
    parts += [
        box(JEANS, f"leg_{side}", x - 0.08, x + 0.08, -0.08, 0.08, 0.08, 0.92),
        box(SHOES, f"leg_{side}", x - 0.08, x + 0.08, -0.09, 0.13, 0.0, 0.08),
        box(JACKET, f"arm_{side}", ax - 0.05, ax + 0.05, -0.06, 0.06, 0.9, 1.42),
        box(SKIN, f"arm_{side}", ax - 0.04, ax + 0.04, -0.04, 0.05, 0.8, 0.9),
    ]
parts += [
    box(JACKET, "torso", -0.22, 0.22, -0.12, 0.12, 0.86, 1.46),
    box(SKIN, "torso", -0.05, 0.05, -0.05, 0.05, 1.46, 1.53),
    box(SKIN, "torso", -0.1, 0.1, -0.1, 0.11, 1.53, 1.76),
    box(HAIR, "torso", -0.11, 0.11, -0.12, 0.08, 1.62, 1.8),  # covers the back and top: we see him from behind
]
body = c.join(parts, "walker")

# Armature: hips (moves the whole body for the bob), torso, two legs from the hips, two arms from the shoulders.
bpy.ops.object.armature_add(location=(0, 0, 0))
arm = bpy.context.active_object
arm.name = arm.data.name = "rig"
bpy.ops.object.mode_set(mode="EDIT")
eb = arm.data.edit_bones
hips = eb[0]
hips.name, hips.head, hips.tail = "hips", (0, 0, 0.9), (0, 0, 1.0)
for name, head, tail in [
    ("torso", (0, 0, 0.9), (0, 0, 1.5)),
    ("leg_L", (0.1, 0, 0.9), (0.1, 0, 0.05)),
    ("leg_R", (-0.1, 0, 0.9), (-0.1, 0, 0.05)),
    ("arm_L", (0.29, 0, 1.4), (0.29, 0, 0.85)),
    ("arm_R", (-0.29, 0, 1.4), (-0.29, 0, 0.85)),
]:
    b = eb.new(name)
    b.head, b.tail, b.parent = head, tail, hips
bpy.ops.object.mode_set(mode="OBJECT")

body.parent = arm
body.modifiers.new("rig", "ARMATURE").object = arm

# Walk: legs swing ±25°, arms opposite ±18°, hips bob 0.03 at each passing pose. Frame 24 repeats frame 0.
FRAMES = 24
scene = bpy.context.scene
scene.render.fps = 24
scene.frame_start, scene.frame_end = 0, FRAMES
arm.animation_data_create()
arm.animation_data.action = bpy.data.actions.new("Walk")
pb = arm.pose.bones
for b in pb:
    b.rotation_mode = "XYZ"
for f in range(0, FRAMES + 1, 3):
    phase = math.sin(2 * math.pi * f / FRAMES)
    for side, s in (("L", 1), ("R", -1)):
        pb[f"leg_{side}"].rotation_euler.x = math.radians(25) * phase * s
        pb[f"arm_{side}"].rotation_euler.x = -math.radians(18) * phase * s
        pb[f"leg_{side}"].keyframe_insert("rotation_euler", index=0, frame=f)
        pb[f"arm_{side}"].keyframe_insert("rotation_euler", index=0, frame=f)
    pb["hips"].location.y = 0.03 * abs(math.cos(2 * math.pi * f / FRAMES))  # the hips bone's Y points up
    pb["hips"].keyframe_insert("location", index=1, frame=f)
scene.frame_set(0)

c.export(c.out_path(), animations=True)
