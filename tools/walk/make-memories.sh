#!/bin/sh
# art/memories/<id>.png → public/memories/<id>.webp (long side 1400 px). Run from the repo root: npm run gen:memories
set -e
mkdir -p public/memories
python3 -I -c '
import glob, os
from PIL import Image
for path in glob.glob("art/memories/*.png"):
    im = Image.open(path).convert("RGB")
    im.thumbnail((1400, 1400), Image.LANCZOS)
    out = "public/memories/" + os.path.basename(path)[:-4] + ".webp"
    im.save(out, quality=72, method=6)
    print("wrote", out)
'
