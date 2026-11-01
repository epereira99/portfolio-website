"""Jönköping University campus.

References (viewed, not downloaded):
  https://commons.wikimedia.org/w/index.php?search=J%C3%B6nk%C3%B6ping+University+campus&title=Special:MediaSearch&type=image
Noted: a modern red-brick block with a ground-floor colonnade and a row of flagpoles; a curved
white-and-glass building; (the historic yellow villa also appears, but the brick + glass campus is
used here). Winter: snow on the flat roofs. No logos or text.
Scene size: ~18 wide, ~8 high.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import box, cylinder, export, material, setup  # noqa: E402

setup()
BRICK = material("Brick", "#a8483a")
WHITE = material("White", "#eef0f2")
GLASS = material("Glass", "#9fb9cc", roughness=0.25)
SHADOW = material("Shadow", "#3d3838")
SNOW = material("Snow", "#f6f9fc")
POLE = material("Pole", "#d9dde2")
BLUE = material("FlagBlue", "#2a5da8")
YELLOW = material("FlagYellow", "#f2c230")

# Red-brick block with a colonnade along its ground floor.
box((10, 5, 6.4), (-4, 1, 3.2), BRICK, 0.25)
box((9.4, 0.2, 2.0), (-4, -1.55, 1.0), SHADOW, 0.05)  # recessed arcade
for i in range(7):
    cylinder(0.18, 2.0, (-8.2 + i * 1.4, -1.75, 1.0), WHITE, vertices=10)
for z in (3.3, 4.9):
    box((9.0, 0.1, 0.8), (-4, -1.52, z), GLASS, 0.04)
box((10.2, 5.2, 0.18), (-4, 1, 6.5), SNOW, 0.06)

# Curved white-and-glass wing.
R, H = 4.2, 7.8
SEG = 10
for i in range(SEG):
    a0 = math.pi * i / SEG
    a1 = math.pi * (i + 1) / SEG
    am = (a0 + a1) / 2
    w = 2 * R * math.sin((a1 - a0) / 2) + 0.05
    x, y = 4.5 + R * math.cos(am), 1.5 - R * math.sin(am)
    box((w, 0.6, H), (x, y, H / 2), GLASS if i % 2 else WHITE, 0.06, rot=(0, 0, -am + math.pi / 2))
box((2 * R + 0.4, R + 0.6, 0.18), (4.5, 1.5 - R / 2, H + 0.09), SNOW, 0.06)

# Flagpoles with Swedish flags.
for i in range(3):
    x = -7.5 + i * 2.2
    cylinder(0.06, 5.5, (x, -3.6, 2.75), POLE, vertices=8)
    box((1.2, 0.04, 0.75), (x + 0.62, -3.6, 5.05), BLUE, 0.01)
    box((1.2, 0.05, 0.14), (x + 0.62, -3.6, 5.05), YELLOW, 0.005)
    box((0.14, 0.05, 0.75), (x + 0.42, -3.6, 5.05), YELLOW, 0.005)

export("jonkoping-university")
