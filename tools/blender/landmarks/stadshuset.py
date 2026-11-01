"""Stockholms stadshus (Stockholm City Hall).

References (viewed, not downloaded):
  https://commons.wikimedia.org/w/index.php?search=Stockholms+stadshus&title=Special:MediaSearch&type=image
Noted: a long, low red-brick hall with green copper roofs; a tall square brick tower at one corner,
~4.5x the hall's height, with an open belfry and a green copper lantern topped by a spire with the
three gold crowns; a small green-domed turret at the far end; on the waterfront.
Scene size: hall ~13 long, ~4.5 high; tower with crowns ~19.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import box, cone, cylinder, export, hip_roof, material, setup, sphere  # noqa: E402

setup()
BRICK = material("Brick", "#a3412f")
COPPER = material("Copper", "#5f9a83")
SHADOW = material("Shadow", "#3a2a26")
GOLD = material("Gold", "#e3b341", roughness=0.35, metallic=0.8)

# The long hall with copper roofs.
box((13, 8, 4.5), (-1.5, 1.5, 2.25), BRICK, 0.25)
hip_roof(13.2, 8.2, 1.6, (-1.5, 1.5, 4.5), COPPER)
for i in range(9):
    box((0.5, 0.1, 1.3), (-7.0 + i * 1.3, -2.55, 2.4), SHADOW, 0.04)

# The corner tower.
TX, TY, TW = 5.2, -1.2, 2.4
box((TW, TW, 14.2), (TX, TY, 7.1), BRICK, 0.2)
for z in (6.0, 9.5):
    box((0.4, 0.1, 1.4), (TX, TY - TW / 2 - 0.02, z), SHADOW, 0.03)
box((TW + 0.3, TW + 0.3, 0.25), (TX, TY, 14.3), BRICK, 0.06)
# Open belfry and copper lantern.
for dx, dy in [(-1, -1), (-1, 1), (1, -1), (1, 1)]:
    box((0.35, 0.35, 1.8), (TX + dx * 0.95, TY + dy * 0.95, 15.3), BRICK, 0.05)
box((TW, TW, 0.3), (TX, TY, 16.3), COPPER, 0.06)
cylinder(0.7, 1.0, (TX, TY, 16.95), COPPER, vertices=8)
cone(0.75, 1.1, (TX, TY, 18.0), COPPER, vertices=8)
cylinder(0.05, 0.5, (TX, TY, 18.8), GOLD, vertices=6)
# The three gold crowns.
for dx, dy in [(-0.22, -0.13), (0.22, -0.13), (0, 0.25)]:
    sphere(0.17, (TX + dx, TY + dy, 19.1), GOLD, segments=10, rings=6)

# Small green-domed turret at the far end.
cylinder(0.8, 6.0, (-7.6, -1.8, 3.0), BRICK, vertices=10)
sphere(0.85, (-7.6, -1.8, 6.1), COPPER, scale=(1, 1, 0.9), segments=12, rings=8)

export("stadshuset")
