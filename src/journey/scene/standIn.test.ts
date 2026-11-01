import { describe, expect, test } from "vitest";
import { standInBlocks } from "./standIn";
import { SEGMENTS, segmentStart } from "../timeline";
import { UNITS_PER_SCREEN, pathPoint } from "../path";

describe("standInBlocks", () => {
  test("puts water only where it is real: never in Braga", () => {
    expect(standInBlocks("braga").water).toBeNull();
    for (const id of ["porto", "voyage", "jonkoping", "stockholm"] as const) {
      expect(standInBlocks(id).water).not.toBeNull();
    }
  });

  test("the voyage is open water with no buildings", () => {
    expect(standInBlocks("voyage").blocks).toHaveLength(0);
  });

  test("buildings stay inside their city and off the walkway", () => {
    for (const { id, screens } of SEGMENTS.filter((s) => s.id !== "voyage")) {
      const from = segmentStart(id) * UNITS_PER_SCREEN;
      const to = (segmentStart(id) + screens) * UNITS_PER_SCREEN;
      const { blocks } = standInBlocks(id);
      expect(blocks.length).toBeGreaterThan(0);
      for (const b of blocks) {
        expect(b.along).toBeGreaterThanOrEqual(from);
        expect(b.along).toBeLessThanOrEqual(to);
        const [px, , pz] = pathPoint(b.along);
        expect(Math.hypot(b.x - px, b.z - pz)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test("is deterministic", () => {
    expect(standInBlocks("porto")).toEqual(standInBlocks("porto"));
  });
});
