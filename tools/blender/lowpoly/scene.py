"""blender -b -P tools/blender/lowpoly/scene.py -- public/models/walk-scene.glb

The low-poly landscape he walks through, styled after the approved mockup (flat colours, two tones per face):
broad faceted ground, a two-tone dirt path along src/journey/lowpoly/path.json, a few pine clusters, layered
mountain ridges and a handful of clouds. Each material is named after a colour slot (src/journey/lowpoly/daylight.ts)
that the web swaps per time of day; each face's tone is baked into a vertex colour (common.tone).
"""

import math
import os
import random
import sys

from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
import common as c  # noqa: E402

c.setup()
rnd = random.Random(11)
PATH = c.read_path()
PATH_W = 2.6
Y0, Y1 = -40, 240  # behind the camera's start to where the near ridge stands
X_HALF = 150
CELL = 8

# The colours here are only for previews in Blender; the web replaces them by slot name.
M = {k: c.material(k, h) for k, h in [
    ("ground", "#4b5e5a"), ("path", "#b98b66"), ("tree", "#2f4a42"), ("trunk", "#3a2f2a"), ("rock", "#6b6a72"),
    ("ridge_near", "#5d4c70"), ("ridge_mid", "#6f5a7e"), ("ridge_far", "#7d6788"), ("cloud", "#e9a88a"),
]}


def path_x(y):
    """The path's x at Blender y (the path runs along +y)."""
    if y <= PATH[0][1]:
        return PATH[0][0]
    for (x0, y0), (x1, y1) in zip(PATH, PATH[1:]):
        if y <= y1:
            return x0 + (x1 - x0) * (y - y0) / (y1 - y0)
    return PATH[-1][0]


PHASES = [rnd.uniform(0, math.tau) for _ in range(4)]


def ground_z(x, y):
    """Flat along the path, rising into broad swells (up to ~5) away from it."""
    d = max(0.0, abs(x - path_x(y)) - 12)  # wider than a ground cell, so no facet buries the path
    swell = 0.5 + 0.25 * math.sin(x * 0.045 + PHASES[0]) + 0.25 * math.cos(y * 0.03 + PHASES[1])
    return min(1.0, d / 40) * 5 * swell


# Ground: a coarse grid, so the facets are big and few; heights barely jittered.
nx, ny = int(2 * X_HALF / CELL), int((Y1 - Y0) / CELL)
verts, faces = [], []
for j in range(ny + 1):
    for i in range(nx + 1):
        x, y = -X_HALF + i * CELL, Y0 + j * CELL
        z = ground_z(x, y)
        verts.append((x, y, z + (rnd.uniform(-0.6, 0.6) if z > 0.5 else 0)))
for j in range(ny):
    for i in range(nx):
        a = j * (nx + 1) + i
        b, d, e = a + 1, a + nx + 1, a + nx + 2
        faces += [(a, b, e), (a, e, d)] if (i + j) % 2 else [(a, b, d), (b, e, d)]
c.tone(c.mesh("ground", verts, faces, [M["ground"]]))

# Path: two strips along the polyline, the left one lit and the right one in shade, like the mockup.
# The walk starts at the path's first point, but the camera sits behind him: the road continues its curve back past
# the bottom of the screen so it doesn't begin under his feet.
ROAD = c.read_path(lead=True)
verts, faces, mats = [], [], []
for k, (x, y) in enumerate(ROAD):
    (xa, ya), (xb, yb) = ROAD[max(k - 1, 0)], ROAD[min(k + 1, len(ROAD) - 1)]
    t = Vector((xb - xa, yb - ya, 0)).normalized()
    n = Vector((-t.y, t.x, 0)) * (PATH_W / 2)
    verts += [(x + n.x, y + n.y, 0.06), (x, y, 0.06), (x - n.x, y - n.y, 0.06)]  # left, centre, right
for k in range(len(ROAD) - 1):
    a = 3 * k
    faces += [(a, a + 1, a + 4, a + 3), (a + 1, a + 2, a + 5, a + 4)]
path = c.mesh("path", verts, faces, [M["path"]])
c.tone(path, fixed=lambda poly: 1.0 if poly.index % 2 == 0 else 0.86)


# Trees, bushes and rocks: KayKit Forest Nature Pack (CC0, Kay Lousberg, art/raw/kaykit-forest). Each model's faces
# get the scene's colour slots from the pack's palette texture (green leaves, brown trunks, grey stone), and a soft
# tone from the scene's light, so they keep their rounded KayKit look while following the time of day.
import bpy  # noqa: E402

KIT = os.path.join(c.ROOT, "art", "raw", "kaykit-forest")
ATLAS = bpy.data.images.load(os.path.join(KIT, "Textures", "forest_texture.png"))
AW, AH = ATLAS.size
APX = ATLAS.pixels[:]


def atlas_slot(uv):
    k = (min(int(uv.y * AH), AH - 1) * AW + min(int(uv.x * AW), AW - 1)) * 4
    r, g, b = APX[k : k + 3]
    if g > r * 1.1 and g > b * 1.1:
        return "tree"
    if r > b * 1.25:
        return "trunk"
    return "rock"


def kit_template(name):
    """One pack model as a hidden template mesh, its faces on the scene's slot materials."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(KIT, "Assets", "gltf", f"{name}_Color1.gltf"))
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    ob = c.join(meshes, name)
    for o in new:
        if o is not ob and o.name in bpy.data.objects:
            bpy.data.objects.remove(o)
    me = ob.data
    uvs = me.uv_layers.active.data
    slots = [atlas_slot(sum((uvs[li].uv for li in p.loop_indices), uvs[p.loop_indices[0]].uv * 0) / p.loop_total)
             for p in me.polygons]
    me.materials.clear()
    names = ["tree", "trunk", "rock"]
    for n in names:
        me.materials.append(M[n])
    for p, slot in zip(me.polygons, slots):
        p.material_index = names.index(slot)
    ob.hide_render = True
    zs = [v.co.z for v in me.vertices]
    ob["height"] = max(zs) - min(zs)
    ob["size"] = max(max(v.co[i] for v in me.vertices) - min(v.co[i] for v in me.vertices) for i in range(3))
    bpy.context.scene.collection.objects.unlink(ob)  # kept as data only; placed copies are linked in
    return ob


def family(prefix):
    files = sorted(f[: -len("_Color1.gltf")] for f in os.listdir(os.path.join(KIT, "Assets", "gltf"))
                   if f.startswith(prefix) and f.endswith("_Color1.gltf") and "Singlesided" not in f)
    return [kit_template(f) for f in files]


PINES, ROUND, CUBE = family("Tree_4_"), family("Tree_1_"), family("Tree_2_")
MUSHROOM, BARE = family("Tree_3_"), family("Tree_Bare_1_")
BUSHES = family("Bush_1_") + family("Bush_2_") + family("Bush_3_") + family("Bush_4_")
# Boulders only: the pack's tall stacked cliffs would wall off the path.
STONES = family("Rock_1_") + [t for t in family("Rock_3_") if t["height"] < 1.0]


# Every template is toned once and then placed by reference: the GLB stores each model once and the browser draws
# the copies as GPU instances, so the kit can be used generously. Turns stay small so the baked light keeps its side.
for t in PINES + ROUND + CUBE + MUSHROOM + BARE + BUSHES + STONES:
    c.soft_tone(t)
GROUPS = {}


def place(templates, x, y, height, group="trees"):
    """A copy of one of the templates, scaled so it stands `height` tall: the pack's models vary a lot in size."""
    t = rnd.choice(templates)
    s = height / t["height"]
    ob = t.copy()  # shares t's mesh
    ob.hide_render = False
    bpy.context.scene.collection.objects.link(ob)
    if group not in GROUPS:
        GROUPS[group] = bpy.data.objects.new(group, None)
        bpy.context.scene.collection.objects.link(GROUPS[group])
    ob.parent = GROUPS[group]
    ob.location = (x, y, ground_z(x, y) - 0.05)
    ob.rotation_euler.z = rnd.uniform(-0.5, 0.5)
    ob.scale = (s, s, s)
    return ob


def any_tree(deep=1.0):
    """Mostly pines; round and cube trees mixed in; mushroom and bare trees only toward a wood's thin edge."""
    k = rnd.random()
    if deep < 0.6 and k < 0.15:
        return MUSHROOM if k < 0.08 else BARE
    return PINES if k < 0.55 else ROUND if k < 0.85 else CUBE


GRASS = family("Grass_1_") + family("Grass_2_")
for t in GRASS:
    c.soft_tone(t)
FPH = [rnd.uniform(0, math.tau) for _ in range(6)]


def forest(x, y):
    """0 (meadow) to 1 (deep wood): smooth, so trees gather into woods with open fields between them."""
    v = (math.sin(x * 0.06 + FPH[0]) * math.cos(y * 0.05 + FPH[1])
         + 0.6 * math.sin(x * 0.13 + y * 0.09 + FPH[2]) + 0.4 * math.cos(x * 0.21 - y * 0.17 + FPH[3]))
    return min(1.0, max(0.0, 0.5 + v / 3.2))


def open_near_path(x, y):
    """How much the land by the path is kept clear: the left side stays open below the card, both sides near it."""
    d = x - path_x(y)
    clear = 14 if d < 0 else 6
    return max(0.0, 1 - abs(d) / clear) if abs(d) < clear else 0.0


trees, rocks = [], []
# Woods: a jittered grid, each spot planted by the forest's density; big trees deep in, small ones and bushes at the
# edges, rocks in twos and threes at their feet.
CELL_T = 4.5
gy = Y0 + 10
while gy < Y1 - 15:
    gx = -X_HALF + 10
    while gx < X_HALF - 10:
        x, y = gx + rnd.uniform(-1.8, 1.8), gy + rnd.uniform(-1.8, 1.8)
        gx += CELL_T
        if abs(x - path_x(y)) < 5 or open_near_path(x, y) > 0.3:
            continue
        f = forest(x, y)
        if rnd.random() < (f - 0.42) * 2.4:
            trees.append(place(any_tree(f), x, y, 3.5 + 3.5 * f + rnd.uniform(-0.6, 0.6)))
        elif 0.3 < f < 0.45 and rnd.random() < 0.35:  # a wood's edge
            if rnd.random() < 0.7:
                trees.append(place(BUSHES, x, y, rnd.uniform(0.6, 1.1)))
            else:
                for _ in range(rnd.randint(2, 3)):
                    rocks.append(place(STONES, x + rnd.uniform(-1.2, 1.2), y + rnd.uniform(-1.2, 1.2), rnd.uniform(0.3, 0.9), "rocks"))
    gy += CELL_T

# Treeline: a continuous band of tall trees where the ground meets the mountains, so the land never just ends.
x = -X_HALF
while x < X_HALF:
    for row in range(2):
        y = Y1 - 18 + row * 6 + rnd.uniform(-2, 2)
        trees.append(place(any_tree(), x + rnd.uniform(-1.5, 1.5), y, rnd.uniform(6, 9)))
    x += rnd.uniform(3, 5)

# The path's edges: grass tufts all along, and now and then a clump of bushes or rocks, so something always passes
# close by as he walks.
y = 2.0  # from just ahead of where he starts: nothing stands between him and the camera
while y < Y1 - 30:
    for side in (-1, 1):
        if rnd.random() < 0.7:
            trees.append(place(GRASS, path_x(y) + side * (PATH_W / 2 + rnd.uniform(0.1, 1.2)), y + rnd.uniform(-0.8, 0.8),
                               rnd.uniform(0.25, 0.45), "grass"))
    if rnd.random() < 0.18:
        side = rnd.choice((-1, 1))
        cx = path_x(y) + side * (PATH_W / 2 + rnd.uniform(1.2, 3))
        for _ in range(rnd.randint(1, 3)):
            trees.append(place(BUSHES, cx + rnd.uniform(-0.8, 0.8), y + rnd.uniform(-0.8, 0.8), rnd.uniform(0.4, 0.8)))
        if rnd.random() < 0.5:
            rocks.append(place(STONES, cx + rnd.uniform(-1, 1), y + rnd.uniform(-1, 1), rnd.uniform(0.25, 0.5), "rocks"))
    y += rnd.uniform(1.2, 2.2)

# Mountains: three ridges of two-faced peaks, each farther, taller and paler (by colour slot), like the mockup.
verts, faces, mats = [], [], []
for layer, (y, height, slot) in enumerate([(Y1 + 10, 30, 2), (Y1 + 90, 55, 1), (Y1 + 190, 90, 0)]):
    x = -520.0
    while x < 520:
        w = rnd.uniform(50, 110) * (1 + layer * 0.4)
        h = height * rnd.uniform(0.55, 1.0)
        px = x + w * rnd.uniform(0.35, 0.65)
        k = len(verts)
        verts += [(x, y, -8), (px, y - w * 0.3, -8), (x + w, y, -8), (px, y, h)]  # left, front, right, peak
        faces += [(k, k + 1, k + 3), (k + 1, k + 2, k + 3)]
        mats += [slot, slot]
        x += w * rnd.uniform(0.5, 0.8)  # overlap neighbours so the ridge reads as one line
ridges = c.mesh("mountains", verts, faces, [M["ridge_far"], M["ridge_mid"], M["ridge_near"]], mats)
c.tone(ridges, fixed=lambda poly: 1.0 if poly.index % 2 == 0 else 0.84)  # left faces lit, right in shade

# Clouds: a few flattened low-poly blobs, high up.
puffs = []
for _ in range(6):
    cx, cy, cz = rnd.uniform(-160, 160), rnd.uniform(120, Y1 + 200), rnd.uniform(55, 90)
    for dx, r in ((0, 6), (7, 4.5), (-6.5, 4)):
        ob = c.primitive("primitive_ico_sphere_add", M["cloud"], subdivisions=1, radius=r,
                         location=(cx + dx, cy, cz))
        ob.scale = (1.6, 1.0, 0.5)
        puffs.append(ob)
c.tone(c.join(puffs, "clouds"))

# Drawn unlit with baked tones: normals and UVs would only add weight.
c.export(c.out_path(), export_normals=False, export_texcoords=False, export_gpu_instances=True)
