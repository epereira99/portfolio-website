"""Ponte Luís I (Dom Luís I bridge), Porto.

References (viewed, not downloaded):
  https://commons.wikimedia.org/w/index.php?search=Ponte+Lu%C3%ADs+I+Porto&title=Special:MediaSearch&type=image
Noted: a single dark-grey wrought-iron parabolic arch of two braced lattice ribs; the upper deck runs
straight across on top of the arch, carried by vertical lattice piers standing on tall granite pylons
at each bank; the lower deck crosses near the water at the arch's base; arch ~3.8:1 span:rise.
Scene size: ~34 long (spans the Douro away from the path, i.e. along Blender Y), ~12 high.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import box, export, material, setup  # noqa: E402

setup()
IRON = material("Iron", "#4a4e57", roughness=0.6, metallic=0.3)
GRANITE = material("Granite", "#bdb3a2")

SPAN = 26.0  # arch span along Y
RISE = 10.5
DECK = 11.6
RIBS = (-1.1, 1.1)

def arch_z(y):
    return RISE * (1 - (2 * y / SPAN) ** 2)

# Two arch ribs as chains of short rounded segments, with cross-bracing between them.
STEPS = 18
for i in range(STEPS):
    y0 = -SPAN / 2 + SPAN * i / STEPS
    y1 = -SPAN / 2 + SPAN * (i + 1) / STEPS
    z0, z1 = arch_z(y0), arch_z(y1)
    length = math.hypot(y1 - y0, z1 - z0)
    tilt = math.atan2(z1 - z0, y1 - y0)
    for x in RIBS:
        box((0.55, length + 0.1, 0.9), (x, (y0 + y1) / 2, (z0 + z1) / 2), IRON, 0.08, rot=(tilt, 0, 0))
    if i % 2 == 0:
        box((2.4, 0.18, 0.18), (0, (y0 + y1) / 2, (z0 + z1) / 2), IRON, 0.04)

# Upper deck across the top, on lattice piers rising from the arch and from the bank pylons.
box((3.4, 34.0, 0.5), (0, 0, DECK + 0.25), IRON, 0.08)
for y in (-9.0, -5.0, 5.0, 9.0):
    for x in RIBS:
        box((0.25, 0.25, DECK - arch_z(y)), (x, y, (DECK + arch_z(y)) / 2), IRON, 0.05)
for sign in (-1, 1):
    y = sign * 15.5
    box((3.2, 2.6, 6.0), (0, y, 3.0), GRANITE, 0.25)  # granite pylon at the bank
    for x in RIBS:
        box((0.35, 0.35, DECK - 6.0), (x, y, 6.0 + (DECK - 6.0) / 2), IRON, 0.05)

# Lower deck near the water, through the arch's base.
box((3.0, SPAN + 2.0, 0.4), (0, 0, 2.2), IRON, 0.08)

export("dom-luis")
