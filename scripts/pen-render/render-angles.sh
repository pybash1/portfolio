#!/bin/sh
# Render every pen layer at every 15° turn on the desk (the light stays put, so
# the pen's lighting changes as it turns), into public/hardware/pens/<color>/.
# The page shows the set nearest to the pen's angle on screen (Pen.astro).
set -e
cd "$(dirname "$0")"
BLENDER=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
bun export-model.ts
node print.cjs
for color in black blue; do
  mkdir -p "../../public/hardware/pens/$color"
  angle=0
  while [ $angle -lt 360 ]; do
    for part in body button refill; do
      out="../../public/hardware/pens/$color/$angle-$part.webp"
      [ -f "$out" ] && [ -z "$FORCE" ] && continue
      for attempt in 1 2 3; do
        "$BLENDER" -b --factory-startup --python pen.py -- "$color" "$angle" "$part" "/tmp/pen-$color-$angle-$part.png" ${SAMPLES:-256} > /dev/null 2>&1 && break
      done
      magick "/tmp/pen-$color-$angle-$part.png" -quality 92 -define webp:alpha-quality=100 "$out"
    done
    angle=$((angle + 15))
  done
done
echo "pen angle sets rendered"
