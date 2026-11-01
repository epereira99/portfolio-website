"""Torre dos Clérigos, Porto.

References (viewed, not downloaded):
  https://commons.wikimedia.org/w/index.php?search=Torre+dos+Cl%C3%A9rigos&title=Special:MediaSearch&type=image
Noted: a slender square granite tower ~6:1 height:width, in ~six stages that narrow slightly, with
corner pilasters; an arched belfry near the top; a domed crown with a bulb and a cross; a low
church body at its foot.
Scene size: ~14 high.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import box, cylinder, export, material, setup, sphere  # noqa: E402

setup()
GRANITE = material("Granite", "#cfc6b6")
TRIM = material("Trim", "#b3a993")
SHADOW = material("Shadow", "#4a4440")

# Church body behind the tower.
box((3.6, 6.5, 3.6), (0, 3.6, 1.8), GRANITE, 0.2)
box((3.9, 6.8, 0.3), (0, 3.6, 3.65), TRIM, 0.08)

# Tower in stages, narrowing, with corner pilasters and cornices.
z = 0.0
for i, (w, h) in enumerate([(2.4, 2.4), (2.25, 2.0), (2.15, 1.8), (2.05, 1.6), (1.95, 1.6), (1.85, 1.5)]):
    box((w, w, h), (0, 0, z + h / 2), GRANITE, 0.1)
    for dx in (-1, 1):
        for dy in (-1, 1):
            box((0.22, 0.22, h), (dx * w / 2, dy * w / 2, z + h / 2), TRIM, 0.05)
    box((w + 0.25, w + 0.25, 0.14), (0, 0, z + h), TRIM, 0.04)  # cornice
    if i in (1, 3):
        box((0.45, 0.1, 0.8), (0, -w / 2 - 0.02, z + h / 2), SHADOW, 0.03)  # small window
    if i == 5:  # belfry: arched openings on every side
        for rot, (x, y) in [(0, (0, -w / 2 - 0.02)), (0, (0, w / 2 + 0.02))]:
            box((0.7, 0.1, 1.0), (x, y, z + h / 2), SHADOW, 0.05)
        for x in (-w / 2 - 0.02, w / 2 + 0.02):
            box((0.1, 0.7, 1.0), (x, 0, z + h / 2), SHADOW, 0.05)
    z += h

# Domed crown, bulb and cross.
sphere(1.0, (0, 0, z + 0.35), GRANITE, scale=(1, 1, 0.75), segments=16, rings=10)
cylinder(0.32, 0.6, (0, 0, z + 1.2), TRIM, vertices=10)
sphere(0.35, (0, 0, z + 1.65), GRANITE, segments=12, rings=8)
box((0.1, 0.1, 0.8), (0, 0, z + 2.3), SHADOW, 0.02)
box((0.45, 0.1, 0.1), (0, 0, z + 2.45), SHADOW, 0.02)

export("clerigos")
