// The breadboard's numbers for Blender (src/lib/hardwareModels.ts → model.json).
import { writeFileSync } from "node:fs";
import { board } from "../../src/lib/hardwareModels";

writeFileSync(new URL("./model.json", import.meta.url), JSON.stringify(board));
console.log("model.json written");
