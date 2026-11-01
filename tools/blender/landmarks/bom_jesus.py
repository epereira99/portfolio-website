"""Bom Jesus do Monte, Braga.

References (viewed, not downloaded):
  https://commons.wikimedia.org/w/index.php?search=Bom+Jesus+do+Monte+escadaria&title=Special:MediaSearch&type=image
Noted: white zig-zag staircase (Stairs of the Five Senses) with dark granite edges, rising like a
stepped triangle up a wooded hill; two small white octagonal chapels with dark conical roofs at its
foot; at the top the church front, white and granite, with twin towers and dark caps.
Scene size: hill ~22 wide, ~9 high; towers top out ~15.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import box, cone, cylinder, export, material, mound, setup, sphere  # noqa: E402

setup()
GREEN = material("Hill", "#7fae6a")
TREES = material("Trees", "#5f8f52")
WHITE = material("Whitewash", "#f4f1ea")
GRANITE = material("Granite", "#8c8478")
DARK = material("Dark", "#3e3a38")
WINDOW = material("Window", "#3b4152")

R, HILL = 11.0, 9.0
mound(R, HILL, GREEN)


def surface(x, y):
    """Height of the hill's surface at (x, y)."""
    return HILL * math.sqrt(max(0.0, 1 - (x * x + y * y) / (R * R)))


# Woods on the slopes, either side of the stairs.
for x, y, r in [(-6.5, -4, 2.2), (6.5, -4, 2.2), (-5, 2.5, 2.6), (5, 2.5, 2.6), (-8.5, -0.5, 1.8), (8.5, -0.5, 1.8), (-3.5, 6, 2.0), (3.5, 6, 2.0)]:
    sphere(r, (x, y, surface(x, y) + r * 0.45), TREES, scale=(1, 1, 0.8), segments=12, rings=8)

# Zig-zag stairs climbing the front slope (front faces -Y), narrowing toward the top.
FLIGHTS = 7
landings = []
for i in range(FLIGHTS + 1):
    y = -10.2 + i * 1.32
    landings.append((y, surface(0, y) + 0.25, 6.6 - i * 0.55))
for i, (y, z, width) in enumerate(landings):
    box((width, 0.9, 0.5), (0, y, z), WHITE, 0.1)  # landing, white walls
    box((width + 0.25, 1.0, 0.16), (0, y, z + 0.3), GRANITE, 0.05)  # dark granite coping
for i in range(FLIGHTS):
    (y0, z0, w0), (y1, z1, _) = landings[i], landings[i + 1]
    side = 1 if i % 2 else -1
    length = math.hypot(y1 - y0, z1 - z0)
    tilt = math.atan2(z1 - z0, y1 - y0)
    x = side * w0 * 0.3
    box((1.3, length, 0.45), (x, (y0 + y1) / 2, (z0 + z1) / 2 + 0.15), WHITE, 0.08, rot=(tilt, 0, 0))
    box((1.45, length, 0.12), (x, (y0 + y1) / 2, (z0 + z1) / 2 + 0.42), GRANITE, 0.03, rot=(tilt, 0, 0))

# Two octagonal chapels at the foot.
for x in (-4.2, 4.2):
    cylinder(1.0, 1.6, (x, -10.2, 0.8), WHITE, vertices=8)
    cone(1.25, 1.3, (x, -10.2, 2.25), DARK, vertices=8)

# The church at the top: white front, granite trim, twin towers with dark caps.
TOP = 8.6
box((5.0, 3.0, 3.6), (0, 0.5, TOP + 1.8), WHITE, 0.15)
box((5.3, 3.2, 0.25), (0, 0.5, TOP + 3.6), GRANITE, 0.05)
box((1.6, 0.12, 2.0), (0, -1.06, TOP + 1.0), DARK, 0.05)  # door
for x in (-2.0, 2.0):
    box((1.3, 1.3, 4.6), (x, -0.6, TOP + 2.3), WHITE, 0.12)
    box((0.5, 1.4, 0.9), (x, -0.6, TOP + 3.9), WINDOW, 0.05)  # belfry
    box((1.45, 1.45, 0.2), (x, -0.6, TOP + 4.7), GRANITE, 0.05)
    cone(0.75, 1.3, (x, -0.6, TOP + 5.45), DARK, vertices=8)

export("bom-jesus")
