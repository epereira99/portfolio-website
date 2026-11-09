"""Keys the green background out of extracted walk frames and writes them as WebP.

usage: python3 tools/walk/key.py <framesDir> <outDir> [cartoon]
"""
import colorsys
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


# The cartoon walk (Seedance) stands in a muted green studio, not on chroma green, so it is keyed by hue: its greens
# and yellow-green floor go, his navy, denim, skin and dark hair are nowhere near that hue range.
CARTOON_CROP = (150, 40, 580, 1230)  # union bounding box of the figure across its loop (720×1280 source)


def key_hue(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            h, s, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.15 < h < 0.42 and s > 0.14:
                px[x, y] = (0, 0, 0, 0)
            elif 0.15 < h < 0.42 and s > 0.07:
                px[x, y] = (r, max(r, b), b, int(255 * (0.14 - s) / 0.07))  # soft edge, green spill removed
    return im


src, out = sys.argv[1], sys.argv[2]
cartoon = sys.argv[3:] == ["cartoon"]
for name in sorted(f for f in os.listdir(src) if f.endswith(".png")):
    frame = Image.open(f"{src}/{name}")
    im = key_hue(frame.crop(CARTOON_CROP)) if cartoon else key(frame.crop(CROP))
    im = im.resize((round(im.width * HEIGHT / im.height), HEIGHT), Image.LANCZOS)
    im.save(f"{out}/walk-{name[:-4]}.webp", quality=QUALITY, method=6)
