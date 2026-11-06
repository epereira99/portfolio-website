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
# SHOE is at the jeans' hem, the lip ~14 cm up where they overhang the shoe (measured on the mesh, Eduardo,
# 2026-11-06): higher, the hem's bottom read as shoe.
NECK, HEM, SHOE, SOLE = 0.36, 0.656, 0.922, 0.985
CUFF = 0.735  # of the arm span from the centre: the hands start there, just before the thumb's bones do
# The arms slope down about 33° in the rest pose, so the cuffs are cut square to the forearm, not to the arm span:
# through the forearm's middle where it reaches CUFF, along its direction (measured on the mesh, Eduardo, 2026-11-06).
CUFF_AT, FOREARM = (-0.05, 0.91), (0.836, -0.073, -0.543)  # (y, z) of that middle; direction for his left arm (+x)


SLEEVE_END = 0.03  # past that, along the forearm, the sleeve physically ends: the arm steps from ~13 to ~10 cm thick


def cuff(side):
    """The cuff's plane on that side (+1 left, -1 right), at the sleeve's end: a point on it, and its normal toward
    the hand."""
    x = side * CUFF * (mxx - mnx) / 2 + (mnx + mxx) / 2
    toward = Vector((side * FOREARM[0], FOREARM[1], FOREARM[2])).normalized()
    return Vector((x, *CUFF_AT)) + toward * SLEEVE_END, toward
# The moustache, and the skin under it (lip and chin), as clean outlines on his face seen from the front: (x, z) in
# cm from the middle of his face at z = MOUTH_Z, traced from the painted shape without its spikes (Eduardo,
# 2026-11-06). Symmetric, so both sides match.
MOUTH_Z = 1.37
MOUSTACHE = [(-8.14, -6.43), (-4.93, -2.49), (0, -2.74), (4.93, -2.49), (8.14, -6.43), (4.29, -6.0), (0, -5.14),
             (-4.29, -6.0)]
LIP = [(-8.14, -6.43), (-4.29, -6.0), (0, -5.14), (4.29, -6.0), (8.14, -6.43), (7.71, -9.0), (6.43, -10.71),
       (0, -10.84), (-6.43, -10.71), (-7.71, -9.0)]
# His neck (Eduardo, 2026-11-06; measured around it on the mesh): the narrow upright ring between his head and the
# jacket. Above it is the head's underside, beard in front and hair behind; it starts at the jaw, 1.215 m just behind
# the beard, rising to 1.235 m at the back. The collar's line is level at the front and sides and rises at the back,
# where the collar stands up to about 1.22 m.
COLLAR_Z = 1.165  # the collar's line at the front and sides
COLLAR_BACK = (-0.05, -0.19, 1.215)  # it rises from y = -0.05 to this height at y = -0.19, the back of the collar
NAPE_Z = 1.235  # the hair's line at the back of his neck
BEARD_BACK_Y = 0.10  # the beard hangs in front of the neck, forward of this
JAW = (1.215, -0.05)  # the jaw's line: this height at the beard's back edge, rising to NAPE_Z by this y


def collar_z(y):
    y0, y1, z1 = COLLAR_BACK
    return COLLAR_Z if y >= y0 else COLLAR_Z + (z1 - COLLAR_Z) * min((y0 - y) / (y0 - y1), 1)


def jaw_z(y):
    z0, y1 = JAW
    return NAPE_Z if y <= y1 else z0 + (NAPE_Z - z0) * min((BEARD_BACK_Y - y) / (BEARD_BACK_Y - y1), 1)
# His hairline across the forehead: a smooth arc, highest in the middle and dropping toward the temples, where the
# painting left spikes (Eduardo, 2026-11-06). Measured on a front render.
HAIR_TOP, HAIR_DROP, HAIR_X = 1.645, 0.6, 0.2  # height (m) in the middle; drop per m² of x; out to the temples


def hairline_z(x):
    return HAIR_TOP - HAIR_DROP * x * x


CHEEK = (12.4, -8.1)  # where the cheek's beard line meets the moustache's outline, out from its tips


def beard_top(x):
    """The beard's top edge across the mouth: level with the moustache's tips, then down along the cheek."""
    ax = abs(x)
    tip_x, tip_z = MOUSTACHE[4]
    return tip_z if ax <= tip_x else tip_z + (CHEEK[1] - tip_z) * (ax - tip_x) / (CHEEK[0] - tip_x)


def mouth_xz(w):
    return (w.x * 100, (w.z - MOUTH_Z) * 100)


def inside(pt, poly):
    x, y, hit = pt[0], pt[1], False
    for (x0, y0), (x1, y1) in zip(poly, poly[1:] + poly[:1]):
        if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
            hit = not hit
    return hit

# Cut the mesh along those lines first, so each seam is a straight edge instead of triangles zigzagging across it
# (bmesh carries the skin weights over to the new vertices).
import bmesh  # noqa: E402
from mathutils import Vector  # noqa: E402

to_local = body.matrix_world.inverted()
bm = bmesh.new()
bm.from_mesh(me)
cuts = [((0, 0, mxz - f * (mxz - mnz)), (0, 0, 1), None) for f in (HEM, SHOE, SOLE)]
cuts += [(*cuff(side), 0.5) for side in (-1, 1)]  # the cuffs on the arms only: tilted, they'd cross the legs too
for co, no, min_x in cuts:
    faces = [f for f in bm.faces if min_x is None or abs((body.matrix_world @ f.calc_center_median()).x) > min_x]
    geom = list({v for f in faces for v in f.verts}) + list({e for f in faces for e in f.edges}) + faces
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=to_local @ Vector(co),
                           plane_no=(to_local.to_3x3() @ Vector(no)).normalized())
# The same along the moustache's and lip's outlines, on the front of the face only, each cut kept to the faces
# along its own stretch of outline.
outline = list(zip(MOUSTACHE, MOUSTACHE[1:] + MOUSTACHE[:1])) + list(zip(LIP[4:], LIP[5:] + LIP[:1]))
outline += [(MOUSTACHE[4], CHEEK), (MOUSTACHE[0], (-CHEEK[0], CHEEK[1]))]
for (x0, z0), (x1, z1) in outline:
    near = []
    for f in bm.faces:
        w = body.matrix_world @ f.calc_center_median()
        x, z = mouth_xz(w)
        if w.y > 0.15 and min(x0, x1) - 3 < x < max(x0, x1) + 3 and min(z0, z1) - 3 < z < max(z0, z1) + 3:
            near.append(f)
    if not near:
        continue
    geom = list({v for f in near for v in f.verts}) + list({e for f in near for e in f.edges}) + near
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=to_local @ Vector((x0 / 100, 0, MOUTH_Z + z0 / 100)),
                           plane_no=(to_local.to_3x3() @ Vector((z1 - z0, 0, -(x1 - x0)))).normalized())
# Along the hairline, in short straight pieces following its arc, on the front of the head only.
xs = [-HAIR_X + k * HAIR_X / 5 for k in range(11)]
for xa, xb in zip(xs, xs[1:]):
    za, zb = hairline_z(xa), hairline_z(xb)
    near = [f for f in bm.faces if (w := body.matrix_world @ f.calc_center_median()).y > 0.08
            and xa - 0.03 < w.x < xb + 0.03 and 1.58 < w.z < 1.70]
    geom = list({v for f in near for v in f.verts}) + list({e for f in near for e in f.edges}) + near
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=to_local @ Vector((xa, 0, za)),
                           plane_no=(to_local.to_3x3() @ Vector((zb - za, 0, -(xb - xa)))).normalized())

# And along the neck's lines, so they come out straight: the collar (level, then rising at the back), the hair's
# line at the back, the beard's back edge.
y0, y1, z1 = COLLAR_BACK
neck_cuts = [((0, 0, COLLAR_Z), (0, 0, 1), lambda w: w.y > y0 - 0.01),
             ((0, y0, COLLAR_Z), (0, z1 - COLLAR_Z, y0 - y1), lambda w: w.y < y0 + 0.01),
             ((0, 0, NAPE_Z), (0, 0, 1), lambda w: w.y < JAW[1] + 0.01),
             ((0, BEARD_BACK_Y, JAW[0]), (0, NAPE_Z - JAW[0], BEARD_BACK_Y - JAW[1]),
              lambda w: JAW[1] - 0.01 < w.y < BEARD_BACK_Y + 0.01),
             ((0, BEARD_BACK_Y, 0), (0, 1, 0), lambda w: COLLAR_Z - 0.02 < w.z < NAPE_Z + 0.02)]
for co, no, keep in neck_cuts:
    near = [f for f in bm.faces if abs((w := body.matrix_world @ f.calc_center_median()).x) < 0.3
            and 1.1 < w.z < 1.3 and keep(w)]
    geom = list({v for f in near for v in f.verts}) + list({e for f in near for e in f.edges}) + near
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
        lbl = "sole" if fz > SOLE else "shoes"
    elif fz > HEM:
        lbl = "jeans"
    elif fz > NECK:
        side = 1 if cw.x > 0 else -1
        at, toward = cuff(side)
        past = (cw - at).dot(toward)
        # The sleeve's rim, the step down to the wrist, faces the hand: it's sleeve.
        rim = -0.02 < past < 0.006 and (normal_mat @ p.normal).normalized().dot(toward) > 0.3
        lbl = "skin" if abs(cw.x) > 0.5 and past > 0 and not rim else "jacket"
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
# The projection left a bald patch on his left cheek (-X), between the beard and the ear, where his right side has
# beard (Eduardo, 2026-11-06). Measured on a side render: height as above; y from the ear's front edge (y = 0) to 9 cm
# toward his face, short of the cheek's skin.
for i, p in enumerate(me.polygons):
    cw = sum((world[j] for j in p.vertices), world[0] * 0) / len(p.vertices)
    fz = (mxz - cw.z) / (mxz - mnz)
    if labels[i] == "skin" and cw.x < -0.03 and 0.205 < fz < 0.27 and 0.0 < cw.y < 0.095:
        labels[i] = "hair"
# His left side (-X) came out right; his right side copies it, each face taking the colour of the face nearest its
# mirror image (Eduardo, 2026-11-06). Head only: hair and skin above the collar. Before the ears are coloured by
# shape below: the two ears don't sit at exact mirror images, so copied colours would put hair on the right ear.
from mathutils import kdtree  # noqa: E402

centres = [sum((world[j] for j in p.vertices), world[0] * 0) / len(p.vertices) for p in me.polygons]
head_z = mxz - NECK * (mxz - mnz)
head = [i for i, cw in enumerate(centres) if cw.z > head_z and labels[i] in ("hair", "skin")]
left = [i for i in head if centres[i].x < 0]
tree = kdtree.KDTree(len(left))
for n, i in enumerate(left):
    tree.insert(centres[i], n)
tree.balance()
for i in head:
    cw = centres[i]
    if cw.x > 0:
        labels[i] = labels[left[tree.find(Vector((-cw.x, cw.y, cw.z)))[1]]]

# The moustache and lip by their outlines (cut into the mesh above): moustache hair, lip skin, around them skin above
# the beard's top edge and beard below.
for i, cw in enumerate(centres):
    x, z = mouth_xz(cw)
    if cw.y > 0.15 and abs(x) < CHEEK[0] and -12 < z < -2 and labels[i] in ("hair", "skin"):
        labels[i] = "hair" if inside((x, z), MOUSTACHE) else "skin" if inside((x, z), LIP) else (
            "skin" if z > beard_top(x) else "hair")

# The hairline: skin below its arc, hair above, across the forehead.
for i, cw in enumerate(centres):
    if cw.y > 0.08 and abs(cw.x) < HAIR_X and 1.58 < cw.z < 1.70 and labels[i] in ("hair", "skin"):
        labels[i] = "skin" if cw.z < hairline_z(cw.x) else "hair"

# Around the ears, colour by shape: the ears stand out from the skull, so what stands out is ear (skin) and what lies
# on the skull is hair. The projection had left bald spots there and half of his right ear hair-coloured (Eduardo,
# 2026-11-06). The skull is a smooth surface fitted to the hair around each ear, refitted without what stands out.
import numpy as np  # noqa: E402

EAR_OUT = 0.01  # how far (m) the ear stands out from the skull, at least
terms = lambda c: [1, c.y, c.z, c.y * c.y, c.y * c.z, c.z * c.z]  # noqa: E731
for side in (-1, 1):
    near = [i for i, cw in enumerate(centres) if cw.x * side > 0.15 and -0.14 < cw.y < 0.06 and 1.30 < cw.z < 1.54]
    fit = [i for i in near if labels[i] == "hair"]
    for _ in range(2):
        coef = np.linalg.lstsq(np.array([terms(centres[i]) for i in fit]),
                               np.array([centres[i].x * side for i in fit]), rcond=None)[0]
        out = {i: centres[i].x * side - float(np.dot(coef, terms(centres[i]))) for i in near}
        fit = [i for i in fit if out[i] < EAR_OUT / 2]
    for i in near:
        # The ear's back, facing the skull, stands out less than its front: half as far is enough there.
        back = (normal_mat @ me.polygons[i].normal).x * side < 0
        labels[i] = "skin" if out[i] > (EAR_OUT / 2 if back else EAR_OUT) else "hair"
    # Fill the notches in the ear's outline: hair with mostly ear around it becomes ear, until none is left.
    ring = set(near)
    changed = True
    while changed:
        changed = False
        for i in near:
            nb = [f for ek in me.polygons[i].edge_keys for f in edge_faces[ek] if f != i and f in ring]
            if labels[i] == "hair" and out[i] > 0 and sum(labels[f] == "skin" for f in nb) * 2 > len(nb):
                labels[i] = "skin"
                changed = True
# The neck: the jacket below the collar's line, beard or hair above the jaw's line and in front of the beard's back
# edge, and the neck between.
for i, cw in enumerate(centres):
    if abs(cw.x) > 0.3 or not (mxz - NECK * (mxz - mnz) - 0.01 < cw.z < NAPE_Z):
        continue
    if cw.z < collar_z(cw.y):
        labels[i] = "jacket"
    elif cw.y > BEARD_BACK_Y or cw.z > jaw_z(cw.y):
        labels[i] = "hair"
    else:
        labels[i] = "skin"


def seam(past, before, after, reach):
    """Tidies a seam whose straight cut misses the mesh's own edge: `past` holds each face's signed distance past the
    cut, toward `after`. Within `reach` of it, a patch of either colour that doesn't reach its own side becomes the
    other, and teeth of `before` past the cut, mostly bordered by `after`, become `after` until none is left."""
    near = {i for i, d in past.items() if -reach < d < reach}
    for lbl, other, seed in ((before, after, lambda d: d <= -reach), (after, before, lambda d: d >= reach)):
        reached = {i for i, d in past.items() if seed(d) and labels[i] == lbl}
        todo = list(reached)
        while todo:
            for ek in me.polygons[todo.pop()].edge_keys:
                for j in edge_faces[ek]:
                    if j in near and j not in reached and labels[j] == lbl:
                        reached.add(j)
                        todo.append(j)
        for i in near:
            if labels[i] == lbl and i not in reached:
                labels[i] = other
    changed = True
    while changed:
        changed = False
        for i in near:
            nb = [j for ek in me.polygons[i].edge_keys for j in edge_faces[ek] if j != i]
            if labels[i] == before and past[i] > 0 and sum(labels[j] == after for j in nb) * 2 > len(nb):
                labels[i] = after
                changed = True


# The sleeve's end is slanted against the cuff's straight cut, ~2.5 cm across, which left specks of sleeve on the
# wrist and of skin on the sleeve, seen from behind (Eduardo, 2026-11-06).
for side in (-1, 1):
    at, toward = cuff(side)
    seam({i: (cw - at).dot(toward) for i, cw in enumerate(centres) if cw.x * side > 0.5 and labels[i] in ("jacket", "skin")},
         "jacket", "skin", 0.05)
# The shoes start at the jeans' hem.
shoe_z = mxz - SHOE * (mxz - mnz)
seam({i: shoe_z - cw.z for i, cw in enumerate(centres) if labels[i] in ("jeans", "shoes")}, "jeans", "shoes", 0.03)
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
