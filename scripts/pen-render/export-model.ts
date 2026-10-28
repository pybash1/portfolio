// Sample the pen model (src/lib/penModel.ts) for Blender: one profile per part,
// finely enough that the segments' filleted steps stay round.
import { writeFileSync } from "node:fs";
import {
  penClip,
  penLength,
  penRadius,
  penSegments,
  penTravel,
} from "../../src/lib/penModel";

const sample = (parts: ("body" | "button")[], from: number, to: number) => {
  const points: [number, number][] = [];

  for (let x = from; x <= to + 1e-9; x += 0.025)
    points.push([+x.toFixed(4), +Math.max(0, penRadius(x, parts)).toFixed(5)]);

  return points.filter(([, r]) => r > 0.02);
};

const button = penSegments.find((s) => s.part === "button")!;

writeFileSync(
  new URL("./model.json", import.meta.url),
  JSON.stringify({
    body: sample(["body"], 0, 131.2),
    button: sample(["button"], button.from - 0.2, button.to),
    clip: penClip,
    travel: penTravel,
    length: penLength,
    materials: penSegments
      .filter((s) => s.part === "body")
      .map((s) => ({ from: s.from, to: s.to })),
  }),
);

console.log("model.json written");
