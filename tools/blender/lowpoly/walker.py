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


normal_mat = body.matrix_world.to_3x3()
labels = []
for p in me.polygons:
    cw = sum((world[i] for i in p.vertices), world[0] * 0) / len(p.vertices)
    n = normal_mat @ p.normal
    lbl = sample("front" if n.y >= 0 else "back", (cw.x - mnx) / (mxx - mnx), (mxz - cw.z) / (mxz - mnz))
    labels.append("skin" if lbl == "eyes" else lbl)

# Smooth: a face takes its neighbours' majority, so stray triangles at region edges (beard spikes, hem) disappear.
edge_faces = {}
for p in me.polygons:
    for ek in p.edge_keys:
        edge_faces.setdefault(ek, []).append(p.index)
neighbours = [[f for ek in p.edge_keys for f in edge_faces[ek] if f != p.index] for p in me.polygons]
for _ in range(2):
    nxt = labels[:]
    for i, nb in enumerate(neighbours):
        votes = [labels[j] for j in nb]
        best = max(set(votes), key=votes.count) if votes else labels[i]
        if votes.count(best) >= 2 and best != labels[i]:
            nxt[i] = best
    labels = nxt
for p, lbl in zip(me.polygons, labels):
    p.material_index = names.index(lbl)
    p.use_smooth = False
c.tone(body)
arm.data.pose_position = "POSE"

# Drawn unlit with baked tones: normals and UVs would only add weight.
c.export(c.out_path(), animations=True, export_normals=False, export_texcoords=False)
