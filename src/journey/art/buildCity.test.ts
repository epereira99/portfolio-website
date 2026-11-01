import { describe, expect, test } from "vitest";
import { Color } from "three";
import type { SegmentId } from "../timeline";
import { buildCityGeometry } from "./buildCity";
import { cityLayout } from "./layout";

const CITIES: SegmentId[] = ["braga", "porto", "jonkoping", "stockholm"];

describe("buildCityGeometry", () => {
  test("is one vertex-coloured geometry", () => {
    const g = buildCityGeometry(cityLayout("porto"), "porto");
    for (const name of ["position", "normal", "color"]) expect(g.getAttribute(name), name).toBeDefined();
    expect(g.getAttribute("position").count).toBeGreaterThan(0);
  });

  test("stays where the layout put things", () => {
    const layout = cityLayout("porto");
    const xs = [...layout.houses, ...layout.trees].map((o) => o.x);
    const zs = [...layout.houses, ...layout.trees].map((o) => o.z);
    const g = buildCityGeometry(layout, "porto");
    g.computeBoundingBox();
    const { min, max } = g.boundingBox!;
    expect(min.x).toBeGreaterThanOrEqual(Math.min(...xs) - 3);
    expect(max.x).toBeLessThanOrEqual(Math.max(...xs) + 3);
    expect(min.z).toBeGreaterThanOrEqual(Math.min(...zs) - 3);
    expect(max.z).toBeLessThanOrEqual(Math.max(...zs) + 3);
  });

  test.each(CITIES)("%s stays within the vertex budget", (id) => {
    expect(buildCityGeometry(cityLayout(id), id).getAttribute("position").count).toBeLessThan(150_000);
  });

  test("is deterministic", () => {
    const count = () => buildCityGeometry(cityLayout("braga"), "braga").getAttribute("position").count;
    expect(count()).toBe(count());
  });

  test("Stockholm's windows glow in the evening", () => {
    const glow = new Color("#ffd28a");
    const colors = buildCityGeometry(cityLayout("stockholm"), "stockholm").getAttribute("color");
    let found = false;
    for (let i = 0; i < colors.count && !found; i++) {
      found =
        Math.abs(colors.getX(i) - glow.r) < 1e-3 &&
        Math.abs(colors.getY(i) - glow.g) < 1e-3 &&
        Math.abs(colors.getZ(i) - glow.b) < 1e-3;
    }
    expect(found).toBe(true);
  });
});
