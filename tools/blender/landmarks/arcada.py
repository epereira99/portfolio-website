"""Arcada, Praça da República, Braga.

References (viewed, not downloaded):
  https://commons.wikimedia.org/w/index.php?search=Arcada+Braga+Pra%C3%A7a+da+Rep%C3%BAblica&title=Special:MediaSearch&type=image
Noted: long three-storey granite façade, ~5.5:1 width:height; ground-floor arcade of ~13 round arches;
two upper floors of balconied windows; dark hipped roof; at the centre the baroque Lapa church front
projects slightly and rises higher with an ornate gable and a small bell tower (~1.6x the main height).
Scene size: ~20 wide, main block 7 high, tower top ~11.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import box, cone, cylinder, export, hip_roof, material, prism, setup  # noqa: E402

setup()
GRANITE = material("Granite", "#e6dccb")
STONE = material("Stone", "#cbbfa9")
SHADOW = material("Shadow", "#5d5348")
WINDOW = material("Window", "#3b4152")
ROOF = material("Slate", "#4b4a4f")

W, D, H = 20.0, 4.0, 7.0
FRONT = -D / 2  # front face (Blender -Y faces the path)

box((W, D, H), (0, 0, H / 2), GRANITE, 0.2)
box((W + 0.4, D + 0.4, 0.3), (0, 0, H), STONE, 0.1)  # cornice
hip_roof(W + 0.2, D + 0.2, 1.3, (0, 0, H + 0.15), ROOF)

# Ground-floor arcade: 13 round arches, recessed (dark) with a granite pier between each.
ARCHES = 13
span = W / ARCHES
for i in range(ARCHES):
    x = -W / 2 + span * (i + 0.5)
    if abs(x) < 2.6:
        continue  # the church front sits here
    box((span * 0.62, 0.12, 1.6), (x, FRONT - 0.04, 0.8), SHADOW, 0.04)
    cylinder(span * 0.31, 0.12, (x, FRONT - 0.04, 1.6), SHADOW, vertices=16, rot=(1.5708, 0, 0))
    # Upper floors: one balconied window per bay on each floor.
    for z in (3.4, 5.4):
        box((span * 0.42, 0.1, 1.0), (x, FRONT - 0.03, z), WINDOW, 0.03)
        box((span * 0.6, 0.35, 0.12), (x, FRONT - 0.2, z - 0.55), STONE, 0.03)

# Central Lapa church front: projecting, taller, with a gable and a bell tower.
box((5.0, 1.2, 9.0), (0, FRONT - 0.5, 4.5), GRANITE, 0.18)
box((2.0, 0.12, 3.2), (0, FRONT - 1.12, 1.6), SHADOW, 0.05)  # door
cylinder(1.0, 0.12, (0, FRONT - 1.12, 3.2), SHADOW, rot=(1.5708, 0, 0))
box((1.2, 0.1, 1.4), (0, FRONT - 1.12, 6.0), WINDOW, 0.04)
prism(5.4, 1.4, 1.3, (0, FRONT - 0.5, 9.0), STONE)  # pediment
box((1.4, 1.4, 1.6), (0, FRONT - 0.5, 10.0), GRANITE, 0.12)  # bell tower
box((0.6, 1.5, 0.9), (0, FRONT - 0.5, 10.0), SHADOW, 0.05)  # belfry opening
cone(0.85, 0.9, (0, FRONT - 0.5, 11.25), STONE, vertices=8)  # cap

export("arcada")
