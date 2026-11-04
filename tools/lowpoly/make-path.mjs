// node tools/lowpoly/make-path.mjs — writes src/journey/lowpoly/path.json, the low-poly walk's road (web units: Y up,
// walking toward −Z). `points` is where he walks, from the origin; `lead` is the same curve continued behind the
// start, drawn only (tools/blender/lowpoly/scene.py), so the road runs off the bottom of the screen without a kink.
import { writeFileSync } from "node:fs";

const x = (z) => +(2.5 * Math.sin(-z * 0.045) + 1.2 * Math.sin(-z * 0.017)).toFixed(3);
const points = Array.from({ length: 116 }, (_, i) => [x(-i * 2), -i * 2]);
const lead = Array.from({ length: 15 }, (_, i) => [x(30 - i * 2), 30 - i * 2]); // z 30 → 2, then points take over
writeFileSync(new URL("../../src/journey/lowpoly/path.json", import.meta.url), JSON.stringify({ points, lead }) + "\n");
