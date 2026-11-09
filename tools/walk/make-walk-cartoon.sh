#!/bin/sh
# Cartoon walk video (Seedance) → keyed WebP walk frames in public/walk-cartoon/. Run from the repo root: npm run gen:walk-cartoon
set -e
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
# Frames 110–141 are one gait cycle that loops cleanly: frame 142 nearly matches frame 110.
swift tools/walk/frames.swift art/raw/road/cartoon/cartoon-walk.mp4 "$tmp" 110 141 2>/dev/null
rm -rf public/walk-cartoon && mkdir -p public/walk-cartoon
python3 -I tools/walk/key.py "$tmp" public/walk-cartoon cartoon
echo "wrote $(ls public/walk-cartoon | wc -l | tr -d ' ') frames, $(du -sh public/walk-cartoon | cut -f1)"
