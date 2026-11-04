"""blender -b -P tools/blender/lowpoly/walker.py -- public/models/walker.glb

Eduardo's walker for the low-poly walk, from art/raw/walker-walking.fbx: his AI-generated model (Hunyuan3D from
art/references/character.png) rigged with a Mixamo walk. This script puts the walk in place, turns him to face
Blender +Y (the web's -Z, down the path), recolours him in flat colours by projecting the reference sheet's regions
(art/raw/walker-labels.json) onto him, bakes the scene's two tones (common.tone), and exports the loop as "Walk".
"""

import json
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
import common as c  # noqa: E402

SOURCE = os.path.join(c.ROOT, "art", "raw", "walker-walking.fbx")
LABELS = os.path.join(c.ROOT, "art", "raw", "walker-labels.json")
# Flat colours per region; the web tints them by time of day. Eyes are smaller than a face at this mesh density.
COLOURS = {"hair": "#3b2a22", "skin": "#e2b48f", "jacket": "#1d2236", "jeans": "#3f66a3", "shoes": "#23263a",
           "sole": "#8d8fa3"}

c.setup()
bpy.ops.import_scene.fbx(filepath=SOURCE)
for ob in [o for o in bpy.data.objects if o.type == "EMPTY"]:
    bpy.data.objects.remove(ob)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
body = next(o for o in bpy.data.objects if o.type == "MESH")
arm.name, body.name = "rig", "walker"
action = arm.animation_data.action
action.name = "Walk"

# In place: Mixamo's walk travels forward; take the drift out of the hips so the loop stays put (the web moves him).
for fc in [f for f in c.fcurves(action) if "Hips" in f.data_path and f.data_path.endswith("location")]:
    k = fc.keyframe_points
    first, last = k[0].co[1], k[-1].co[1]
    for p in k:
        t = (p.co[0] - k[0].co[0]) / (k[-1].co[0] - k[0].co[0])
        shift = first + (last - first) * t - first
        p.co[1] -= shift
        p.handle_left[1] -= shift
        p.handle_right[1] -= shift
arm.rotation_euler.z += math.pi  # Mixamo faces -Y; the scene walks toward +Y

# Recolour in the rest pose (the T-pose the labels were drawn from), in world space.
arm.data.pose_position = "REST"
bpy.context.view_layer.update()
me = body.data
me.materials.clear()
for m in list(bpy.data.materials):  # the FBX's own, so ours keep their plain names
    bpy.data.materials.remove(m)
names = list(COLOURS)
for n in names:
    me.materials.append(c.material(n, COLOURS[n]))
world = [body.matrix_world @ v.co for v in me.vertices]
xs, zs = [w.x for w in world], [w.z for w in world]
mnx, mxx, mnz, mxz = min(xs), max(xs), min(zs), max(zs)
lab = json.load(open(LABELS))


def sample(view, u, v):
    g, (x0, y0, x1, y1) = lab[view]["grid"], lab[view]["bbox"]
    # He now faces +Y: the front view sees him from +Y, so image x runs against world x.
    px, py = x0 + ((1 - u) if view == "front" else u) * (x1 - x0), y0 + v * (y1 - y0)
    for r in range(10):
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                x, y = int(px) + dx, int(py) + dy
                if 0 <= x < 256 and 0 <= y < 256 and g[y][x]:
                    return g[y][x]
    return "jacket"


# The body is coloured by where a face is, with lines measured on the reference sheet (as a fraction of his height
# from the top): projecting the image there bled colours across the seams, since the AI mesh doesn't match it exactly.
# Only the head, where hair, beard and skin meet in no straight line, is projected.
NECK, HEM, SHOE = 0.36, 0.656, 0.931
CUFF = 0.8  # of the arm span from the centre; the hands start there

# Cut the mesh along those lines first, so each seam is a straight edge instead of triangles zigzagging across it
# (bmesh carries the skin weights over to the new vertices).
import bmesh  # noqa: E402
from mathutils import Vector  # noqa: E402

to_local = body.matrix_world.inverted()
bm = bmesh.new()
bm.from_mesh(me)
cuts = [((0, 0, mxz - f * (mxz - mnz)), (0, 0, 1)) for f in (HEM, SHOE)]
cuts += [((side * CUFF * (mxx - mnx) / 2 + (mnx + mxx) / 2, 0, 0), (1, 0, 0)) for side in (-1, 1)]
for co, no in cuts:
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=to_local @ Vector(co),
                           plane_no=(to_local.to_3x3() @ Vector(no)).normalized())
bmesh.ops.triangulate(bm, faces=bm.faces[:])
bm.to_mesh(me)
bm.free()
world = [body.matrix_world @ v.co for v in me.vertices]
normal_mat = body.matrix_world.to_3x3()
labels, head = [], []
for p in me.polygons:
    cw = sum((world[i] for i in p.vertices), world[0] * 0) / len(p.vertices)
    u, fz = (cw.x - mnx) / (mxx - mnx), (mxz - cw.z) / (mxz - mnz)
    if fz > SHOE:
        lbl = "sole" if fz > 0.985 else "shoes"
    elif fz > HEM:
        lbl = "jeans"
    elif fz > NECK:
        lbl = "skin" if abs(u - 0.5) * 2 > CUFF else "jacket"
    elif (normal_mat @ p.normal).y < 0:
        # The back of the head, which the camera sees all the time, by shape too: hair down to the collar, skin only
        # at the ears (measured on the sheet's back view).
        if fz > 0.318:
            lbl = "jacket"
        else:
            lbl = "skin" if 0.16 < fz < 0.29 and abs(u - 0.5) * 2 > 0.27 else "hair"
    else:
        lbl = sample("front", u, fz)
        lbl = "skin" if lbl in ("eyes", "skin") else "hair"  # the beard is hair-coloured too
        head.append(p.index)
    labels.append(lbl)

# Smooth the head: a face takes its neighbours' majority, so stray triangles where hair meets skin disappear.
in_head = set(head)
edge_faces = {}
for p in me.polygons:
    for ek in p.edge_keys:
        edge_faces.setdefault(ek, []).append(p.index)
neighbours = {i: [f for ek in me.polygons[i].edge_keys for f in edge_faces[ek] if f != i and f in in_head] for i in head}
for _ in range(4):
    nxt = labels[:]
    for i, nb in neighbours.items():
        votes = [labels[j] for j in nb]
        best = max(set(votes), key=votes.count) if votes else labels[i]
        if votes.count(best) >= 2 and best != labels[i]:
            nxt[i] = best
    labels = nxt
# Small islands of hair on the face (what's left of the eyes and brows) become skin.
seen = set()
for start in head:
    if start in seen or labels[start] != "hair":
        continue
    island, todo = [], [start]
    seen.add(start)
    while todo:
        i = todo.pop()
        island.append(i)
        for j in neighbours[i]:
            if j not in seen and labels[j] == "hair":
                seen.add(j)
                todo.append(j)
    if len(island) < 40:
        for i in island:
            labels[i] = "skin"
for p, lbl in zip(me.polygons, labels):
    p.material_index = names.index(lbl)
    p.use_smooth = False
c.tone(body)

if os.environ.get("WALKER_PREVIEW"):  # a dir: front, back and three-quarter renders of the colours, in the rest pose
    from mathutils import Vector
    sc = bpy.context.scene
    sc.render.engine, sc.display.shading.light, sc.display.shading.color_type = "BLENDER_WORKBENCH", "FLAT", "MATERIAL"
    sc.render.resolution_x, sc.render.resolution_y = 600, 700
    cam = bpy.data.objects.new("preview", bpy.data.cameras.new("preview"))
    sc.collection.objects.link(cam)
    sc.camera, cam.data.type, cam.data.ortho_scale = cam, "ORTHO", 2.1
    for name, d in (("front", (0, 1, 0)), ("back", (0, -1, 0)), ("quarter", (0.6, -1, 0.4))):
        d = Vector(d).normalized()
        cam.location, cam.rotation_euler = Vector((0, 0, 0.9)) + d * 5, (-d).to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = os.path.join(os.environ["WALKER_PREVIEW"], f"walker-{name}.png")
        bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)
arm.data.pose_position = "POSE"

# Drawn unlit with baked tones: normals and UVs would only add weight.
c.export(c.out_path(), animations=True, export_normals=False, export_texcoords=False)
