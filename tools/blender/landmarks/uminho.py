"""Universidade do Minho, Gualtar campus, Braga.

References (viewed, not downloaded):
  https://commons.wikimedia.org/w/index.php?search=Universidade+do+Minho+Gualtar+campus&title=Special:MediaSearch&type=image
Noted: grey and brownish concrete blocks with long horizontal window bands; a library with tall
boxy towers; lawns; a low red entrance wall; a tall stone pillar carrying a bronze figure at the
entrance. No logos or text.
Scene size: ~16 wide, main blocks ~5–6 high, tallest block ~9.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import box, cylinder, export, material, setup, sphere  # noqa: E402

setup()
CONCRETE = material("Concrete", "#a39d93")
BROWN = material("Brick", "#8a6f5a")
WINDOW = material("Window", "#3b4152")
RED = material("Red", "#c8323a")
STONE = material("Stone", "#bdb5a6")
BRONZE = material("Bronze", "#6e5a3a", roughness=0.5, metallic=0.4)
LAWN = material("Lawn", "#7fae6a")

box((18, 9, 0.12), (0, 0.5, 0.06), LAWN, 0.04)
# Long teaching block with window bands.
box((12, 4.5, 5.2), (-2, 1.5, 2.6), CONCRETE, 0.25)
for z in (1.5, 3.2, 4.6):
    box((11.4, 0.1, 0.7), (-2, -0.78, z), WINDOW, 0.04)
# Library: brownish block with two tall boxy towers.
box((5, 4.5, 6.2), (5.6, 1.5, 3.1), BROWN, 0.25)
for x in (4.3, 6.9):
    box((1.6, 1.6, 9.0), (x, 0.2, 4.5), BROWN, 0.2)
    box((0.4, 0.1, 6.5), (x, -0.62, 4.6), WINDOW, 0.03)
# Low red entrance wall and the pillar with a bronze figure.
box((4.5, 0.4, 1.0), (-4.5, -3.6, 0.5), RED, 0.08)
cylinder(0.45, 5.0, (1.0, -3.4, 2.5), STONE, vertices=10)
sphere(0.5, (1.0, -3.4, 5.6), BRONZE, scale=(0.8, 0.5, 1.2), segments=10, rings=8)
box((1.4, 0.2, 0.25), (1.0, -3.4, 5.9), BRONZE, 0.05)  # outstretched arms

export("uminho")
