"""Renders a quick 3/4 preview of a landmark glb (for eyeballing, not for the site).

Run: Blender -b -P tools/blender/landmarks/preview.py -- public/models/landmarks/arcada.glb out.png
"""

import math
import sys

import bpy
from mathutils import Vector

src, out = sys.argv[sys.argv.index("--") + 1 : sys.argv.index("--") + 3]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)

objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
lo = Vector((min(v[i] for o in objs for v in (o.matrix_world @ Vector(c) for c in o.bound_box)) for i in range(3)))
hi = Vector((max(v[i] for o in objs for v in (o.matrix_world @ Vector(c) for c in o.bound_box)) for i in range(3)))
centre = (lo + hi) / 2
size = max(hi - lo)

cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
bpy.context.scene.collection.objects.link(cam)
# Front faces Blender -Y: look from the front-left, a little above.
cam.location = centre + Vector((-0.7, -1.4, 0.55)) * size * 1.15
direction = centre - cam.location
cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
bpy.context.scene.camera = cam

sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.rotation_euler = (math.radians(50), 0, math.radians(-40))
bpy.context.scene.collection.objects.link(sun)

scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.light = "STUDIO"
scene.display.shading.color_type = "MATERIAL"
scene.display.shading.show_shadows = True
scene.render.resolution_x, scene.render.resolution_y = 900, 600
scene.render.filepath = out
world = bpy.data.worlds.new("w")
scene.world = world
bpy.ops.render.render(write_still=True)
print("rendered", out)
