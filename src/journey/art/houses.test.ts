import { describe, expect, test } from "vitest";
import { UNITS_PER_SCREEN, pathPoint } from "../path";
import { SEGMENTS, segmentStart, type SegmentId } from "../timeline";
import { houseSpec, rng } from "./houses";
import { LANDMARKS, landmarkPosition } from "./landmarks";
import { CITY_STYLE } from "./styles";

const CITIES: SegmentId[] = ["braga", "porto", "jonkoping", "stockholm"];
const FLOORS: Record<string, [number, number]> = { braga: [1, 2], porto: [2, 4], jonkoping: [1, 2], stockholm: [3, 4] };
const ROOFS: Record<string, string[]> = {
  braga: ["hip", "gable"],
  porto: ["gable"],
  jonkoping: ["gable"],
  stockholm: ["stepped", "gable"],
};
const base = { along: 10, x: 0, z: 0, heading: 0 };

describe("houseSpec", () => {
  test.each(CITIES)("%s houses stay within the city's proportions and palette", (id) => {
    const rand = rng(1);
    for (let i = 0; i < 200; i++) {
      const h = houseSpec(rand, id, base);
      expect(h.w).toBeGreaterThanOrEqual(1.6);
      expect(h.w).toBeLessThanOrEqual(id === "porto" ? 2.0 : 2.6);
      expect(h.d).toBeGreaterThanOrEqual(1.6);
      expect(h.d).toBeLessThanOrEqual(2.6);
      expect(h.floors).toBeGreaterThanOrEqual(FLOORS[id][0]);
      expect(h.floors).toBeLessThanOrEqual(FLOORS[id][1]);
      expect(h.floorHeight).toBe(1.1);
      expect(ROOFS[id]).toContain(h.roof);
      expect(CITY_STYLE[id].walls).toContain(h.wall);
      expect(CITY_STYLE[id].roofs).toContain(h.roofColor);
      expect(h.trim).toBe(CITY_STYLE[id].trim);
    }
  });

  test("is deterministic for a seed", () => {
    expect(houseSpec(rng(7), "porto", base)).toEqual(houseSpec(rng(7), "porto", base));
  });

  test("only Porto has azulejo façades, on a share of its houses", () => {
    for (const id of ["braga", "jonkoping", "stockholm"] as const) {
      const rand = rng(3);
      for (let i = 0; i < 200; i++) expect(houseSpec(rand, id, base).azulejo).toBe(false);
    }
    const rand = rng(3);
    const share = Array.from({ length: 200 }, () => houseSpec(rand, "porto", base).azulejo).filter(Boolean).length / 200;
    expect(share).toBeGreaterThanOrEqual(0.2);
    expect(share).toBeLessThanOrEqual(0.5);
  });
});

describe("LANDMARKS", () => {
  test("Eduardo's landmarks, each in its own city", () => {
    expect(LANDMARKS.map((l) => l.id)).toEqual([
      "arcada",
      "bom-jesus",
      "uminho",
      "clerigos",
      "dom-luis",
      "jonkoping-university",
      "stadshuset",
    ]);
    for (const l of LANDMARKS) {
      const seg = SEGMENTS.find((g) => g.id === l.segment)!;
      expect(l.along).toBeGreaterThanOrEqual(segmentStart(l.segment) * UNITS_PER_SCREEN);
      expect(l.along).toBeLessThanOrEqual((segmentStart(l.segment) + seg.screens) * UNITS_PER_SCREEN);
    }
  });

  test("keep the walkway clear (footprint d is the depth away from the path)", () => {
    for (const l of LANDMARKS) {
      const { position } = landmarkPosition(l);
      const [px, , pz] = pathPoint(l.along);
      expect(Math.hypot(position[0] - px, position[2] - pz)).toBeCloseTo(l.offset, 5);
      expect(l.offset - l.footprint.d / 2, l.id).toBeGreaterThanOrEqual(3);
    }
  });
});
