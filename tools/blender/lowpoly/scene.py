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
# The walk starts at the path's first point, but the camera sits behind him: run the road straight back past the
# bottom of the screen so it doesn't begin under his feet.
ROAD = [(PATH[0][0], PATH[0][1] + y) for y in range(-30, 0, 2)] + PATH
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


def pine(x, y, s, tiers):
    z = ground_z(x, y) - 0.1
    parts = [c.primitive("primitive_cylinder_add", M["trunk"], vertices=5, radius=0.18 * s, depth=1.2 * s,
                         location=(x, y, z + 0.6 * s))]
    for k in range(tiers):
        r, h = (1.4 - 0.4 * k) * s, (3.6 - 0.8 * k) * s
        parts.append(c.primitive("primitive_cone_add", M["tree"], vertices=6, radius1=r, depth=h,
                                 location=(x, y, z + (1.0 + 1.3 * k) * s + h / 2)))
    yaw = rnd.uniform(0, math.tau)
    for p in parts:
        p.rotation_euler.z = yaw
    return parts


# Trees: a few clusters, not a scatter. The left side keeps its distance near the path: the sky behind the card stays
# open there.
trees = []
for _ in range(14):
    cy = rnd.uniform(Y0 + 20, Y1 - 30)
    side = rnd.choice((-1, 1, 1))
    cx = path_x(cy) + side * rnd.uniform(14 if side < 0 else 6, 70)
    for _ in range(rnd.randint(2, 5)):
        x, y = cx + rnd.uniform(-5, 5), cy + rnd.uniform(-5, 5)
        if abs(x - path_x(y)) > 4:
            trees += pine(x, y, rnd.uniform(0.9, 1.6), rnd.choice((1, 2)))
c.tone(c.join(trees, "trees"))

# Rocks: a few, low, by the path.
rocks = []
for _ in range(14):
    y = rnd.uniform(Y0 + 30, Y1 - 40)
    x = path_x(y) + rnd.choice((-1, 1)) * rnd.uniform(3, 25)
    ob = c.primitive("primitive_ico_sphere_add", M["rock"], subdivisions=1, radius=rnd.uniform(0.4, 1.1),
                     location=(x, y, ground_z(x, y)))
    ob.scale.z = 0.55
    rocks.append(ob)
c.tone(c.join(rocks, "rocks"))

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

c.export(c.out_path())
