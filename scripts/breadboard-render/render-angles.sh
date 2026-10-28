#!/bin/sh
# Render the breadboard at every 15° turn on the desk (the light stays put, so
# its lighting changes as it turns) into public/hardware/breadboard/<angle>.webp.
# The page shows the render nearest the board's angle on screen (Breadboard.astro).
set -e
cd "$(dirname "$0")"
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
bun export-model.ts
mkdir -p ../../public/hardware/breadboard
angle=0
while [ $angle -lt 360 ]; do
  out="../../public/hardware/breadboard/$angle.webp"
  if [ ! -f "$out" ] || [ -n "$FORCE" ]; then
    for attempt in 1 2 3; do
      "$BLENDER" -b --factory-startup --python breadboard.py -- "$angle" "/tmp/breadboard-$angle.png" ${SAMPLES:-192} > /dev/null 2>&1 && break
    done
    magick "/tmp/breadboard-$angle.png" -quality 92 -define webp:alpha-quality=100 "$out"
  fi
  angle=$((angle + 15))
done
echo "breadboard renders done"
