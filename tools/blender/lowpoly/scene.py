"""blender -b -P tools/blender/lowpoly/scene.py -- public/models/walk-scene.glb

The low-poly landscape he walks through: faceted ground, a dirt path along src/journey/lowpoly/path.json, sparse
trees and rocks, a ring of far mountains and a few clouds. One mesh per part; the web lights it (time of day) and
fogs it (depth), so colours here are mid-tones that read in morning and dusk light alike.
"""

import math
import os
import random
import sys

from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
import common as c  # noqa: E402

c.setup()
rnd = random.Random(7)
PATH = c.read_path()
PATH_W = 2.4
Y0, Y1 = -30, PATH[-1][1] + 30  # behind the camera's start, past where the walk stops
X_HALF = 60
CELL = 2.5

GRASS = [c.material("grass", "#7d9a5e"), c.material("grass_light", "#8aa866"), c.material("grass_dark", "#6e8c54")]
DIRT = c.material("dirt", "#b89070")
BARK = c.material("bark", "#6b4f3a")
LEAF = [c.material("pine", "#3f6b4f"), c.material("leaf", "#5f8a4a"), c.material("poplar", "#7a9a48")]
ROCK = c.material("rock", "#8c8a86")
MOUNTAIN = [c.material("mountain", "#8a8fa8"), c.material("mountain_far", "#9fa3b8")]
CLOUD = c.material("cloud", "#f4f1ec")


def path_x(y):
    """The path's x at Blender y (the path runs along +y)."""
    if y <= PATH[0][1]:
        return PATH[0][0]
    for (x0, y0), (x1, y1) in zip(PATH, PATH[1:]):
        if y <= y1:
            return x0 + (x1 - x0) * (y - y0) / (y1 - y0)
    return PATH[-1][0]


def ground_z(x, y):
    """Flat by the path, rolling gently (≤ 1.5) further out."""
    d = abs(x - path_x(y)) - 2
    if d <= 0:
        return 0.0
    roll = 0.5 + 0.5 * math.sin(x * 0.11 + 1.3) * math.cos(y * 0.07)
    return min(1.5, d * 0.08) * roll


# Ground: a grid with jittered heights, each face one of three greens for the faceted look.
nx, ny = int(2 * X_HALF / CELL), int((Y1 - Y0) / CELL)
verts, faces, mats = [], [], []
for j in range(ny + 1):
    for i in range(nx + 1):
        x, y = -X_HALF + i * CELL, Y0 + j * CELL
        z = ground_z(x, y)
        if z > 0:
            z += rnd.uniform(-0.15, 0.15)
        verts.append((x, y, z))
for j in range(ny):
    for i in range(nx):
        a = j * (nx + 1) + i
        b, d, e = a + 1, a + nx + 1, a + nx + 2
        # two triangles per cell, diagonals alternating, so the facets read
        tris = [(a, b, e), (a, e, d)] if (i + j) % 2 else [(a, b, d), (b, e, d)]
        for t in tris:
            faces.append(t)
            mats.append(rnd.choice((0, 0, 1, 2)))
c.mesh("ground", verts, faces, GRASS, mats)

# Path: a strip along the polyline, just above the ground.
verts, faces = [], []
for k, (x, y) in enumerate(PATH):
    (xa, ya), (xb, yb) = PATH[max(k - 1, 0)], PATH[min(k + 1, len(PATH) - 1)]
    t = Vector((xb - xa, yb - ya, 0)).normalized()
    n = Vector((-t.y, t.x, 0)) * (PATH_W / 2)
    verts += [(x - n.x, y - n.y, 0.02), (x + n.x, y + n.y, 0.02)]
for k in range(len(PATH) - 1):
    a = 2 * k
    faces.append((a, a + 1, a + 3, a + 2))
c.mesh("path", verts, faces, [DIRT])


def tree(kind, x, y, s):
    z = ground_z(x, y) - 0.1
    parts = [c.primitive("primitive_cylinder_add", BARK, vertices=5, radius=0.15 * s, depth=1.2 * s,
                         location=(x, y, z + 0.6 * s))]
    if kind == "pine":
        parts.append(c.primitive("primitive_cone_add", LEAF[0], vertices=6, radius1=1.1 * s, depth=3.2 * s,
                                 location=(x, y, z + 2.6 * s)))
    elif kind == "pine2":
        parts.append(c.primitive("primitive_cone_add", LEAF[0], vertices=6, radius1=1.3 * s, depth=2.2 * s,
                                 location=(x, y, z + 2.0 * s)))
        parts.append(c.primitive("primitive_cone_add", LEAF[0], vertices=6, radius1=0.9 * s, depth=1.8 * s,
                                 location=(x, y, z + 3.2 * s)))
    elif kind == "broadleaf":
        parts.append(c.primitive("primitive_ico_sphere_add", LEAF[1], subdivisions=1, radius=1.3 * s,
                                 location=(x, y, z + 2.3 * s)))
    else:  # poplar
        parts.append(c.primitive("primitive_cone_add", LEAF[2], vertices=5, radius1=0.7 * s, radius2=0.2 * s,
                                 depth=3.8 * s, location=(x, y, z + 2.9 * s)))
    yaw = rnd.uniform(0, math.tau)
    for p in parts:
        p.rotation_euler.z = yaw
    return parts


# Trees: sparse, never on the path; the left side stays clearer near the path so the sky behind the card stays open.
trees = []
y = Y0
while y < Y1:
    for side in (-1, 1):
        if rnd.random() < 0.55:
            near = 7 if side < 0 else 3.5
            x = path_x(y) + side * (near + rnd.random() ** 1.6 * 45)
            trees += tree(rnd.choice(("pine", "pine2", "broadleaf", "poplar")), x, y + rnd.uniform(-1, 1),
                          rnd.uniform(0.8, 1.3))
    y += 2.2
c.join(trees, "trees")

# Rocks: lumpy icospheres, half sunk.
rocks = []
for _ in range(45):
    y = rnd.uniform(Y0, Y1)
    x = path_x(y) + rnd.choice((-1, 1)) * rnd.uniform(2.2, 30)
    ob = c.primitive("primitive_ico_sphere_add", ROCK, subdivisions=1, radius=rnd.uniform(0.25, 0.9),
                     location=(x, y, ground_z(x, y)))
    for v in ob.data.vertices:
        v.co *= rnd.uniform(0.75, 1.25)
    ob.scale.z = 0.6
    rocks.append(ob)
c.join(rocks, "rocks")

# Mountains: a ring of faceted peaks well past the fog's near edge, along both sides and across the far end.
peaks = []
spots = [(side * rnd.uniform(80, 120), y) for y in range(-20, int(Y1) + 60, 16) for side in (-1, 1)]
spots += [(x, Y1 + rnd.uniform(50, 80)) for x in range(-130, 131, 22)]
for x, y in spots:
    h = rnd.uniform(20, 45)
    ob = c.primitive("primitive_cone_add", rnd.choice(MOUNTAIN), vertices=rnd.choice((5, 6, 7)),
                     radius1=h * rnd.uniform(0.7, 1.0), depth=h, location=(x, y, h / 2 - 2))
    for v in ob.data.vertices:
        if v.co.z < h / 2 - 0.01:  # leave the tip, push the base around
            v.co.x *= rnd.uniform(0.8, 1.2)
            v.co.y *= rnd.uniform(0.8, 1.2)
    peaks.append(ob)
c.join(peaks, "mountains")

# Clouds: three shapes of clustered icospheres, high and far.
SHAPES = [[(0, 0, 0, 3), (3, 0, -0.5, 2.2), (-3, 0.5, -0.6, 2)],
          [(0, 0, 0, 2.5), (2.5, 0, 0.3, 2.5), (5, 0, -0.4, 1.8), (-2.2, 0, -0.5, 1.6)],
          [(0, 0, 0, 2), (2, 0.5, -0.3, 1.5)]]
puffs = []
for k in range(12):
    cx, cy, cz = rnd.uniform(-70, 70), rnd.uniform(30, Y1 + 40), rnd.uniform(32, 48)
    for dx, dy, dz, r in SHAPES[k % 3]:
        ob = c.primitive("primitive_ico_sphere_add", CLOUD, subdivisions=1, radius=r * 1.4,
                         location=(cx + dx * 1.4, cy + dy, cz + dz))
        ob.scale.z = 0.55
        puffs.append(ob)
c.join(puffs, "clouds")

c.export(c.out_path())
