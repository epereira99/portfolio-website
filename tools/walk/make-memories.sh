#!/bin/sh
# art/memories/<id>.png|jpg|jpeg → public/memories/<id>.webp (long side 1400 px). Run from the repo root: npm run gen:memories
set -e
mkdir -p public/memories
python3 -I -c '
import glob, os
from PIL import Image
for path in sorted(p for p in glob.glob("art/memories/*") if p.lower().endswith((".png", ".jpg", ".jpeg"))):
    im = Image.open(path).convert("RGB")
    im.thumbnail((1400, 1400), Image.LANCZOS)
    out = "public/memories/" + os.path.splitext(os.path.basename(path))[0] + ".webp"
    im.save(out, quality=72, method=6)
    print("wrote", out)
'
