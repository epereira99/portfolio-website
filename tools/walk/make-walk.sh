#!/bin/sh
# Source video → keyed WebP walk frames in public/walk/. Run from the repo root: npm run gen:walk
set -e
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
# Frames 61–199 loop seamlessly: frame 200 nearly matches frame 61.
swift tools/walk/frames.swift art/walk-source.mp4 "$tmp" 61 199 2>/dev/null
rm -rf public/walk && mkdir -p public/walk
python3 -I tools/walk/key.py "$tmp" public/walk
echo "wrote $(ls public/walk | wc -l | tr -d ' ') frames, $(du -sh public/walk | cut -f1)"
