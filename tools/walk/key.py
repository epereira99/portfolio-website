"""Keys the green background out of extracted walk frames and writes them as WebP.

usage: python3 tools/walk/key.py <framesDir> <outDir>
"""
import os
import sys

from PIL import Image

CROP = (172, 129, 538, 1243)  # union bounding box of the figure across the loop (720×1280 source)
HEIGHT = 900
QUALITY = 70


def key(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            m = max(r, b)
            k = g - m
            if k > 70:
                px[x, y] = (0, 0, 0, 0)
            elif k > 20:
                px[x, y] = (r, m, b, int(255 * (70 - k) / 50))  # soft edge, green spill removed
            elif g > m:
                px[x, y] = (r, m, b, a)
    return im


src, out = sys.argv[1], sys.argv[2]
for name in sorted(f for f in os.listdir(src) if f.endswith(".png")):
    im = key(Image.open(f"{src}/{name}").crop(CROP))
    im = im.resize((round(im.width * HEIGHT / im.height), HEIGHT), Image.LANCZOS)
    im.save(f"{out}/walk-{name[:-4]}.webp", quality=QUALITY, method=6)
