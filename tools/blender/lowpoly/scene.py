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
Y_BACK = Y0 - 14 * CELL  # the land goes on behind him too (whole ground cells, so the grid ahead stays put)

# The colours here are only for previews in Blender; the web replaces them by slot name.
M = {k: c.material(k, h) for k, h in [
    ("ground", "#4b5e5a"), ("path", "#b98b66"), ("tree", "#2f4a42"), ("trunk", "#3a2f2a"), ("rock", "#6b6a72"),
    ("ridge_near", "#5d4c70"), ("ridge_mid", "#6f5a7e"), ("ridge_far", "#7d6788"), ("cloud", "#e9a88a"),
    ("wall", "#efe6da"), ("roof", "#b4553a"), ("sign", "#d93a32"),
    ("sign_dark", "#1d1f24"), ("sign_green", "#86bc25"), ("letters", "#ffffff"), ("ju", "#961b81"),
    ("flag_blue", "#006aa7"), ("flag_yellow", "#fecc02"),
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


# Everything behind Y0 draws on its own random stream, so the land ahead keeps the exact look it had.
back = random.Random(5)

# Ground: a coarse grid, so the facets are big and few; heights barely jittered.
nx, ny = int(2 * X_HALF / CELL), int((Y1 - Y_BACK) / CELL)
verts, faces = [], []
for j in range(ny + 1):
    for i in range(nx + 1):
        x, y = -X_HALF + i * CELL, Y_BACK + j * CELL
        z = ground_z(x, y)
        verts.append((x, y, z + ((rnd if y >= Y0 else back).uniform(-0.6, 0.6) if z > 0.5 else 0)))
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


def place(templates, x, y, height, group="trees", rng=rnd):
    """A copy of one of the templates, scaled so it stands `height` tall: the pack's models vary a lot in size."""
    t = rng.choice(templates)
    s = height / t["height"]
    ob = t.copy()  # shares t's mesh
    ob.hide_render = False
    bpy.context.scene.collection.objects.link(ob)
    if group not in GROUPS:
        GROUPS[group] = bpy.data.objects.new(group, None)
        bpy.context.scene.collection.objects.link(GROUPS[group])
    ob.parent = GROUPS[group]
    ob.location = (x, y, ground_z(x, y) - 0.05)
    ob.rotation_euler.z = rng.uniform(-0.5, 0.5)
    ob.scale = (s, s, s)
    return ob


def any_tree(deep=1.0, rng=rnd):
    """Mostly pines; round and cube trees mixed in; mushroom and bare trees only toward a wood's thin edge."""
    k = rng.random()
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

# Braga, where it all started: a hamlet where the road begins, behind him at the start. White cottages under
# terracotta roofs line the road's first stretch, which opens onto a little square with a church at its end.
def road_x(y):
    """The drawn road's x at Blender y, its lead behind the start included."""
    if y <= ROAD[0][1]:
        return ROAD[0][0]
    for (x0, y0), (x1, y1) in zip(ROAD, ROAD[1:]):
        if y <= y1:
            return x0 + (x1 - x0) * (y - y0) / (y1 - y0)
    return ROAD[-1][0]


SQUARE_Y = ROAD[0][1] - 6  # the square's middle, just past where the road begins
VILLAGE = (SQUARE_Y - 16, -9)  # y span kept clear of the woods for it
parts = []  # (verts, faces, material index) per closed piece, in world space
gardens, farms = [], []
WALL, ROOF, DARK, STONE, PAVING = range(5)


def piece(cx, cy, z, yaw, local, faces, mat):
    cs, sn = math.cos(yaw), math.sin(yaw)
    parts.append(([(cx + x * cs - y * sn, cy + x * sn + y * cs, z + h) for x, y, h in local], faces, mat))


def box(x0, x1, y0, y1, z0, z1):
    return ([(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1),
             (x0, y1, z1)], [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])


def gable(x0, x1, y0, y1, z, rise):
    """A roof ridged along local x."""
    ym = (y0 + y1) / 2
    return ([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z), (x0, ym, z + rise), (x1, ym, z + rise)],
            [(0, 3, 2, 1), (0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5)])


def spire(h, z, rise):
    return ([(-h, -h, z), (h, -h, z), (h, h, z), (-h, h, z), (0, 0, z + rise)],
            [(0, 3, 2, 1), (0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)])


def house(cx, cy, yaw, w, d, h, rng):
    """A cottage whose front (local -y) faces along yaw: whitewashed walls, a door, windows, an overhanging roof."""
    z = min(ground_z(cx + dx, cy + dy) for dx in (-w / 2, w / 2) for dy in (-d / 2, d / 2)) - 0.4
    h += 0.4
    piece(cx, cy, z, yaw, *box(-w / 2, w / 2, -d / 2, d / 2, 0, h), WALL)
    piece(cx, cy, z, yaw, *gable(-w / 2 - 0.35, w / 2 + 0.35, -d / 2 - 0.35, d / 2 + 0.35, h, rng.uniform(1.2, 1.7)),
          ROOF)
    door = rng.uniform(-w / 4, w / 4)
    piece(cx, cy, z, yaw, *box(door - 0.45, door + 0.45, -d / 2 - 0.06, -d / 2 + 0.1, 0.35, 2.3), DARK)
    for wx in (-w / 2 + 0.9, w / 2 - 0.9):
        if abs(wx - door) > 1.2:
            piece(cx, cy, z, yaw, *box(wx - 0.4, wx + 0.4, -d / 2 - 0.06, -d / 2 + 0.1, h - 1.6, h - 0.75), DARK)
        piece(cx, cy, z, yaw, *box(wx - 0.4, wx + 0.4, d / 2 - 0.1, d / 2 + 0.06, h - 1.6, h - 0.75), DARK)
    for side in (-1, 1):  # a window on each end wall
        piece(cx, cy, z, yaw, *box(side * w / 2 - 0.1, side * w / 2 + 0.1 * side, -0.4, 0.4, h - 1.6, h - 0.75), DARK)


# Along the road, both sides, set back behind a strip of verge; each faces the road.
for side in (-1, 1):
    # Clear of the camera, wherever the viewer turns it round him at the start; on his left (-x, the screen's right
    # as he faces you) they start farther back, so the church shows past them.
    y = (-24 if side < 0 else -13) - back.uniform(0, 2)
    while y > SQUARE_Y + 3:
        w, d = back.uniform(3.8, 5.2), back.uniform(3.2, 4.0)
        cx = road_x(y) + side * (PATH_W / 2 + 2.2 + d / 2)
        house(cx, y, -side * math.pi / 2 + back.uniform(-0.06, 0.06), w, d, back.uniform(2.6, 3.4), back)
        if back.random() < 0.6:  # a garden tree behind it
            gardens.append(place(ROUND, cx + side * (d / 2 + 2.2), y + back.uniform(-1.5, 1.5), back.uniform(3.5, 5),
                                 rng=back))
        y -= w + back.uniform(1.6, 3.2)
# The square: paving where the road ends, houses round its sides, and the church closing it, facing up the road.
sx = road_x(SQUARE_Y + 6)
parts.append(([(sx - 7, SQUARE_Y - 6, 0.05), (sx + 7, SQUARE_Y - 6, 0.05), (sx + 7, SQUARE_Y + 6.2, 0.05),
               (sx - 7, SQUARE_Y + 6.2, 0.05)], [(0, 1, 2, 3)], PAVING))
house(sx + 10.5, SQUARE_Y - 1, -math.pi / 2, 5.5, 4, 3.2, back)
house(sx + 10.5, SQUARE_Y + 6, -math.pi / 2, 4.4, 3.6, 2.8, back)
house(sx, SQUARE_Y - 8.5, 0, 6, 4, 3.4, back)  # closing the square's far end
# The church on the square's side to his left (the screen's right as he faces you), its gable end and door facing
# across the square (+x), the bell tower at its front corner nearest the road.
cx, cy = sx - 13, SQUARE_Y - 5
z = ground_z(cx, cy) - 0.4
piece(cx, cy, z, 0, *box(-5, 5, -3, 3, 0, 4.6), WALL)  # the nave runs along local x
piece(cx, cy, z, 0, *gable(-5.3, 5.3, -3.3, 3.3, 4.6, 2.0), ROOF)
piece(cx, cy, z, 0, *box(4.9, 5.06, -0.7, 0.7, 0.4, 3.2), DARK)  # its door, under a tall window
piece(cx, cy, z, 0, *box(4.9, 5.06, -0.5, 0.5, 3.6, 4.4), DARK)
tx, ty = cx + 3.7, cy + 4.3
piece(tx, ty, z, 0, *box(-1.3, 1.3, -1.3, 1.3, 0, 8.6), WALL)
piece(tx, ty, z, 0, *box(-0.45, 0.45, 1.26, 1.4, 6.6, 7.8), DARK)  # the belfry opening, toward the road
piece(tx, ty, z, 0, *spire(1.5, 8.6, 2.8), ROOF)
# Low dry-stone walls along the verges, where the hamlet begins.
for side in (-1, 1):
    y0 = -15 if side < 0 else -10
    x0 = road_x(y0) + side * (PATH_W / 2 + 0.9)
    piece(x0, y0, -0.3, 0, *box(-0.2, 0.2, -back.uniform(3.5, 5.5), 0, 0, 0.6), STONE)
# And a few farms out on the hills behind.
for _ in range(7):
    fx, fy = back.uniform(-70, 70), back.uniform(-120, -60)
    if abs(fx - road_x(fy)) > 18:
        farms.append((fx, fy))
        house(fx, fy, back.uniform(0, math.tau), back.uniform(4, 6), back.uniform(3.4, 4.2), back.uniform(2.8, 3.4), back)

verts, faces, mats = [], [], []
for vs, fs, mat in parts:
    k = len(verts)
    verts += vs
    faces += [tuple(k + i for i in f) for f in fs]
    mats += [mat] * len(fs)
village = c.mesh("village", verts, faces, [M["wall"], M["roof"], M["trunk"], M["rock"], M["path"]], mats)
c.tone(village)

# The land behind: no trees in the hamlet, woods and a treeline beyond it, and the ridges closing that end too.
in_village = lambda ob: VILLAGE[0] < ob.location.y < VILLAGE[1] and abs(ob.location.x - road_x(ob.location.y)) < 18
cleared = [t for t in trees + rocks if in_village(t)]
trees, rocks = [t for t in trees if t not in cleared], [r for r in rocks if r not in cleared]
for ob in cleared:
    bpy.data.objects.remove(ob)
gy = Y_BACK + 12
while gy < Y0 + 10:
    gx = -X_HALF + 10
    while gx < X_HALF - 10:
        x, y = gx + back.uniform(-1.8, 1.8), gy + back.uniform(-1.8, 1.8)
        gx += CELL_T
        if (abs(x - road_x(y)) < 6 or (VILLAGE[0] - 6 < y and abs(x - road_x(y)) < 24)
                or any(abs(x - fx) < 7 and abs(y - fy) < 7 for fx, fy in farms)):
            continue
        f = forest(x, y)
        if back.random() < (f - 0.42) * 2.4:
            place(any_tree(f, back), x, y, 3.5 + 3.5 * f + back.uniform(-0.6, 0.6), rng=back)
    gy += CELL_T
x = -X_HALF
while x < X_HALF:
    for row in range(2):
        place(any_tree(rng=back), x + back.uniform(-1.5, 1.5), Y_BACK + 12 + row * 6 + back.uniform(-2, 2), back.uniform(6, 9),
              rng=back)
    x += back.uniform(3, 5)

# Mountains: three ridges of two-faced peaks, each farther, taller and paler (by colour slot), like the mockup.
verts, faces, mats = [], [], []
# Behind the start, the same ridges face the other way (their own random stream, after the ones ahead).
RIDGES = [(Y1 + 10, 30, 2, 1, rnd), (Y1 + 90, 55, 1, 1, rnd), (Y1 + 190, 90, 0, 1, rnd),
          (Y_BACK - 10, 30, 2, -1, back), (Y_BACK - 90, 55, 1, -1, back), (Y_BACK - 190, 90, 0, -1, back)]
for layer, (y, height, slot, facing, r) in enumerate(RIDGES):
    x = -520.0
    while x < 520:
        w = r.uniform(50, 110) * (1 + (layer % 3) * 0.4)
        h = height * r.uniform(0.55, 1.0)
        px = x + w * r.uniform(0.35, 0.65)
        k = len(verts)
        verts += [(x, y, -8), (px, y - facing * w * 0.3, -8), (x + w, y, -8), (px, y, h)]  # left, front, right, peak
        faces += [(k, k + 1, k + 3), (k + 1, k + 2, k + 3)] if facing > 0 else [(k, k + 3, k + 1), (k + 1, k + 3, k + 2)]
        mats += [slot, slot]
        x += w * r.uniform(0.5, 0.8)  # overlap neighbours so the ridge reads as one line
ridges = c.mesh("mountains", verts, faces, [M["ridge_far"], M["ridge_mid"], M["ridge_near"]], mats)
c.tone(ridges, fixed=lambda poly: 1.0 if poly.index % 2 == 0 else 0.84)  # left faces lit, right in shade

# Clouds: a few flattened low-poly blobs, high up.
puffs = []
for rng, (y0, y1) in ((rnd, (120, Y1 + 200)), (back, (Y_BACK - 150, -90))):  # ahead, then behind the start
    for _ in range(6):
        cx, cy, cz = rng.uniform(-160, 160), rng.uniform(y0, y1), rng.uniform(55, 90)
        for dx, r in ((0, 6), (7, 4.5), (-6.5, 4)):
            ob = c.primitive("primitive_ico_sphere_add", M["cloud"], subdivisions=1, radius=r,
                             location=(cx + dx, cy, cz))
            ob.scale = (1.6, 1.0, 0.5)
            puffs.append(ob)
c.tone(c.join(puffs, "clouds"))

# Signs by the road, where a chapter comes in: each a slab on a plinth, its name in raised letters.
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"  # Blender's own font where it's missing
font = bpy.data.fonts.load(FONT) if os.path.exists(FONT) else None


def letters(text, width, x, z, front, mat):
    """Raised letters on a slab's front (at local y = front, facing -y): `width` wide, from x, baseline at z."""
    cu = bpy.data.curves.new(text, "FONT")
    cu.body, cu.extrude, cu.resolution_u = text, 0.012, 3  # coarse curves: the letters are small on screen
    if font:
        cu.font = font
    ob = bpy.data.objects.new(text, cu)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.convert(target="MESH")
    ob = bpy.context.active_object
    ob.select_set(False)
    k = width / ob.dimensions.x
    ob.scale = (k, k, 1)
    ob.rotation_euler = (math.pi / 2, 0, 0)  # face -y
    ob.location = (x, front - 0.012, z)
    ob.data.materials.clear()
    ob.data.materials.append(mat)
    return ob


def along(d):
    """The road's centre d along it from where he starts (as the web walks it, lowpoly/path.ts), and its heading."""
    for (x0, y0), (x1, y1) in zip(PATH, PATH[1:]):
        seg = math.hypot(x1 - x0, y1 - y0)
        if d <= seg:
            return x0 + (x1 - x0) * d / seg, y0 + (y1 - y0) * d / seg, math.atan2(x1 - x0, y1 - y0)
        d -= seg
    return (*PATH[-1], 0.0)


def road_gap(px, py):
    """How far a point is from the road's centre line (its lead behind the start included)."""
    best = math.inf
    for (x0, y0), (x1, y1) in zip(ROAD, ROAD[1:]):
        dx, dy = x1 - x0, y1 - y0
        t = max(0.0, min(1.0, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(px - x0 - t * dx, py - y0 - t * dy))
    return best


ROAD_CLEAR = PATH_W / 2 + 0.6  # no part of a sign comes closer to the road's centre than this


def stand(pieces, name, d, side, back):
    """Joins a sign's pieces and stands it d along the road, `back` from its edge on his right (side 1) or left (-1),
    its face turned toward him as he walks up; nothing grows in front of it or through it. He covers 14 a screen."""
    global trees, rocks
    sign = c.join(pieces, name)
    rx, ry, heading = along(d)
    x, y = rx + math.cos(heading) * side * (PATH_W / 2 + back), ry - math.sin(heading) * side * (PATH_W / 2 + back)
    sign.rotation_euler.z = -heading - side * 0.5
    sign.location = (x, y, ground_z(x, y))
    bpy.ops.object.select_all(action="DESELECT")
    sign.select_set(True)
    bpy.context.view_layer.objects.active = sign
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    sign.select_set(False)
    # Turned toward him, its near end swings toward the road, and the road curves: step it back until it's clear.
    out = Vector((math.cos(heading) * side, -math.sin(heading) * side, 0))
    for _ in range(40):
        short = ROAD_CLEAR - min(road_gap(v.co.x, v.co.y) for v in sign.data.vertices)
        if short <= 0:
            break
        for v in sign.data.vertices:
            v.co += out * (short + 0.05)
        x, y = x + out.x * (short + 0.05), y + out.y * (short + 0.05)
    assert min(road_gap(v.co.x, v.co.y) for v in sign.data.vertices) >= ROAD_CLEAR, f"{name} stands in the road"
    c.tone(sign)
    # The lettering keeps its full tone whichever way the sign faces the sun; the web's light alone shades it.
    col = sign.data.color_attributes["Col"]
    bright = {sign.data.materials.find(n) for n in ("letters", "sign_green")}
    for poly in sign.data.polygons:
        if poly.material_index in bright:
            for li in poly.loop_indices:
                col.data[li].color = (1, 1, 1, 1)
    near = [o for o in trees + rocks if (o.location.x - x) ** 2 + (o.location.y - y) ** 2 < 7 ** 2]
    trees, rocks = [t for t in trees if t not in near], [r for r in rocks if r not in near]
    for ob in near:
        bpy.data.objects.remove(ob)
    return x, y, -heading - side * 0.5  # where it stands, and its turn


def slab_on_plinth(h, w, t, mat, plinth_mat):
    slab = c.primitive("primitive_cube_add", mat, size=1, location=(0, 0, 0.2 + h / 2))
    slab.scale = (w, t, h)
    bpy.context.view_layer.objects.active = slab
    bpy.ops.object.transform_apply(scale=True)
    plinth = c.primitive("primitive_cube_add", plinth_mat, size=1, location=(0.15 * w / 5, 0, 0.1))
    plinth.scale = (w * 1.17, t + 0.6, 0.3)
    return slab, plinth


# The University of Minho's sign, as at the entrance of Campus de Gualtar (art/references/uminho): a long red slab on
# a low concrete plinth, the emblem's six rays cut right through it at its left end, the name in raised silver letters.
# It stands on his right just ahead of where the BSc chapter comes in: he's 7 in when it shows, and passes it at 21.
SIGN_H = 1.2  # a little under his height
SIGN_W, SIGN_T = 4.2 * SIGN_H, 0.25  # 4.2 times as wide as tall, as in the frontal photo
slab, plinth = slab_on_plinth(SIGN_H, SIGN_W, SIGN_T, M["sign"], M["rock"])
# The emblem's rays, measured in slab heights from its centre (0.12 of the width in, halfway up): (angle from
# straight up, inner and outer radius). A short ray up, a long one down, long ones rising to each side, short ones
# falling.
RAYS = [(0, 0.17, 0.34), (180, 0.05, 0.35), (-66, 0.04, 0.41), (66, 0.04, 0.41), (-115, 0.18, 0.40), (115, 0.18, 0.40)]
ex, ez = -SIGN_W / 2 + 0.12 * SIGN_W, 0.2 + SIGN_H / 2
for ang, r0, r1 in RAYS:
    a = math.radians(ang)
    mid, length = (r0 + r1) / 2 * SIGN_H, (r1 - r0) * SIGN_H
    # A ray: a cylinder through the slab, squashed into a long, narrow, leaf-shaped slot along its angle.
    cut = c.primitive("primitive_cylinder_add", M["trunk"], vertices=16, radius=0.5, depth=1,
                      location=(ex + math.sin(a) * mid, 0, ez + math.cos(a) * mid), rotation=(math.pi / 2, a, 0))
    cut.scale = (0.078 * SIGN_H, length, SIGN_T * 3)
    mod = slab.modifiers.new("ray", "BOOLEAN")
    mod.operation, mod.object, mod.solver, mod.material_mode = "DIFFERENCE", cut, "EXACT", "TRANSFER"
    bpy.context.view_layer.objects.active = slab
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cut)
# Each line: its text, its width as a share of the slab's, and its baseline as a share of the height from the top.
pieces = [slab, plinth] + [
    letters(text, width * SIGN_W, -SIGN_W / 2 + 0.314 * SIGN_W, 0.2 + SIGN_H * (1 - baseline), -SIGN_T / 2, M["letters"])
    for text, width, baseline in (("Universidade do Minho", 0.62, 0.31), ("University of Minho", 0.365, 0.55),
                                  ("Campus de Gualtar - Braga", 0.29, 0.79))]
stand(pieces, "uminho_sign", 21, 1, 4.5)

# Deloitte's, like its office signs: a black slab on a dark plinth, the wordmark in bold white letters and its green
# dot. It stands on his left a screen into the Deloitte chapter (which comes in at 21), so he walks up to it as it does.
DEL_H, DEL_W, DEL_T = 1.2, 3.8, 0.25
slab, plinth = slab_on_plinth(DEL_H, DEL_W, DEL_T, M["sign_dark"], M["trunk"])
word = letters("Deloitte", 0.66 * DEL_W, 0, 0, -DEL_T / 2, M["letters"])
h, w = word.dimensions.y * word.scale.x, word.dimensions.x * word.scale.x  # its height and width, once fitted
r = 0.2 * h  # the dot: round, sitting on the baseline just past the last letter
x0 = -(w + 0.35 * r + 2 * r) / 2  # the wordmark and its dot, centred
word.location = (x0, -DEL_T / 2 - 0.012, 0.2 + DEL_H / 2 - h / 2)
dot = c.primitive("primitive_cylinder_add", M["sign_green"], vertices=20, radius=r, depth=0.03,
                  location=(x0 + w + 0.35 * r + r, -DEL_T / 2 - 0.015, 0.2 + DEL_H / 2 - h / 2 + r),
                  rotation=(math.pi / 2, 0, 0))
stand([slab, plinth, word, dot], "deloitte_sign", 35, -1, 3.5)


def prism(outline, front, depth, mat):
    """A flat convex shape raised `depth` off a slab's front (at local y = front), from its outline in the slab's x/z."""
    import bmesh
    n = len(outline)
    verts = [(x, front - depth, z) for x, z in outline] + [(x, front, z) for x, z in outline]
    faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))] + [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
    ob = c.mesh("mark", verts, faces, [mat])
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)  # outward, whichever way the outline runs
    bm.to_mesh(ob.data)
    bm.free()
    return ob


# Jönköping University's, in its brand (art/references/jonkoping-university, public/ju-mark.png): a magenta slab,
# the white "j" mark at its left, traced from the logo, and the name in white capitals. The mark is two halves of a
# U with a slit between them, the right one taller, each with its outer bottom corner rounded right off, and a
# slanted tab above the right one: the j's dot. It stands on his right a screen and a half into the MSc chapter (which
# comes in at 63), a Swedish flag flying beside it.
JU_H, JU_W, JU_T = 1.2, 4.4, 0.25
slab, plinth = slab_on_plinth(JU_H, JU_W, JU_T, M["ju"], M["rock"])
QUARTER = [k * math.pi / 16 for k in range(9)]
# In the logo's pixels (y down; the mark spans x 45-117, y 34-126).
MARK = [
    [(78, 72), (45, 72)] + [(78 - 33 * math.cos(t), 93 + 33 * math.sin(t)) for t in QUARTER],  # left half
    [(117, 56), (84, 56)] + [(84 + 33 * math.sin(t), 93 + 33 * math.cos(t)) for t in QUARTER],  # right half
    [(117, 34), (84, 40), (84, 50), (117, 50)],  # the dot, its top slanting up to the right
]
u = 0.72 * JU_H / 92  # a logo pixel, in metres: the mark stands 0.72 of the slab tall
mx, mz = -JU_W / 2 + 0.42, 0.2 + 0.14 * JU_H  # the mark's left edge and foot
pieces = [slab, plinth] + [prism([(mx + (x - 45) * u, mz + (126 - y) * u) for x, y in pts], -JU_T / 2, 0.02, M["letters"])
                           for pts in MARK]
for text, baseline in (("JÖNKÖPING", 0.42), ("UNIVERSITY", 0.72)):
    pieces.append(letters(text, 0.56 * JU_W, mx + 72 * u + 0.3, 0.2 + JU_H * (1 - baseline), -JU_T / 2, M["letters"]))
# The sun there (diorama/shots.ts) is behind him, so it lights the face.
jx, jy, jyaw = stand(pieces, "ju_sign", 84, 1, 3.0)

# The Swedish flag: blue with a yellow Nordic cross (5:2:9 along, 4:2:4 up), on a white pole with a gold ball, just
# past the sign's far end, flying away from the road and rippling a little. Two sheets back to back, so it shows from
# both sides.
FLAG_L, FLAG_H, POLE = 1.8, 1.125, 6.5
xs = sorted({k / 14 for k in range(15)} | {5 / 16, 7 / 16})
zs = [0, 0.4, 0.6, 1]
verts, faces, mats = [], [], []
for sheet, off in ((0, -0.006), (1, 0.006)):
    k = len(verts)
    for x in xs:
        for z in zs:
            verts.append((x * FLAG_L, off + 0.12 * math.sin(x * 7) * x, POLE - 0.15 - (1 - z) * FLAG_H))
    for i in range(len(xs) - 1):
        for j in range(len(zs) - 1):
            a, b = k + i * len(zs) + j, k + (i + 1) * len(zs) + j
            faces.append((a, b, b + 1, a + 1) if sheet else (a, a + 1, b + 1, b))
            mid_x, mid_z = (xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2
            mats.append(1 if 5 / 16 < mid_x < 7 / 16 or 0.4 < mid_z < 0.6 else 0)
flag = c.mesh("flag", verts, faces, [M["flag_blue"], M["flag_yellow"]], mats)
pole = c.primitive("primitive_cylinder_add", M["wall"], vertices=10, radius=0.05, depth=POLE, location=(0, 0, POLE / 2))
ball = c.primitive("primitive_ico_sphere_add", M["flag_yellow"], subdivisions=1, radius=0.1, location=(0, 0, POLE + 0.05))
flagpole = c.join([flag, pole, ball], "flag")
ox, oy = JU_W / 2 + 1.0, 0.4  # from the sign's middle, in its own frame
fx, fy = jx + ox * math.cos(jyaw) - oy * math.sin(jyaw), jy + ox * math.sin(jyaw) + oy * math.cos(jyaw)
flagpole.location = (fx, fy, ground_z(fx, fy) - 0.1)
flagpole.rotation_euler.z = jyaw  # the cloth runs out from the pole, away from the road
c.tone(flagpole)

# Effektify's, in its brand (public/logos/effektify.png): a white slab with its black mark, traced from the logo, and
# the name in black. The mark is three slanted blocks: one on the left falling to the right, two on the right rising,
# one above the other. It stands on his left a little into the Effektify chapter (which comes in at 105).
EF_H, EF_W, EF_T = 1.2, 3.9, 0.25
slab, plinth = slab_on_plinth(EF_H, EF_W, EF_T, M["letters"], M["rock"])  # the signs' clean white, not whitewash
EF_MARK = [  # in the logo's pixels (y down; the mark spans x 40-118, y 28-131)
    [(40, 57), (78, 72), (78, 102), (40, 87)],
    [(78, 45), (118, 28), (118, 58), (78, 74)],
    [(78, 101), (118, 85), (118, 115), (78, 131)],
]
u = 0.7 * EF_H / 103  # a logo pixel, in metres: the mark stands 0.7 of the slab tall
mx, mz = -EF_W / 2 + 0.3, 0.2 + 0.15 * EF_H  # the mark's left edge and foot
pieces = [slab, plinth] + [prism([(mx + (x - 40) * u, mz + (131 - y) * u) for x, y in pts], -EF_T / 2, 0.02,
                                 M["sign_dark"]) for pts in EF_MARK]
pieces.append(letters("effektify", 0.58 * EF_W, mx + 78 * u + 0.3, 0.2 + EF_H * 0.38, -EF_T / 2, M["sign_dark"]))
stand(pieces, "effektify_sign", 115, -1, 3.0)

# Drawn unlit with baked tones: normals and UVs would only add weight.
c.export(c.out_path(), export_normals=False, export_texcoords=False, export_gpu_instances=True)
