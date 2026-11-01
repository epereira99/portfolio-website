import { describe, expect, test } from "vitest";
import { Color } from "three";
import { CITY_STYLE, lightingAt } from "./styles";

const rgb = (hex: string) => {
  const c = new Color(hex);
  return [c.r, c.g, c.b];
};

describe("CITY_STYLE", () => {
  test("water only where it is real", () => {
    expect(CITY_STYLE.braga.water).toBeNull();
    for (const id of ["porto", "voyage", "jonkoping", "stockholm"] as const) expect(CITY_STYLE[id].water).not.toBeNull();
  });

  test("every city has a palette", () => {
    for (const id of ["braga", "porto", "jonkoping", "stockholm"] as const) {
      expect(CITY_STYLE[id].walls.length).toBeGreaterThanOrEqual(3);
      expect(CITY_STYLE[id].roofs.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("lightingAt", () => {
  test("mid-city is that city's own light", () => {
    const { sky, fog, sun, ambient } = CITY_STYLE.porto;
    expect(lightingAt(2.5)).toEqual({ sky, fog, sun, ambient });
  });

  test("halfway across a boundary is halfway between the two cities", () => {
    const [a, b, mid] = [rgb(CITY_STYLE.braga.sky), rgb(CITY_STYLE.porto.sky), rgb(lightingAt(1.5).sky)];
    expect(mid[0]).toBeCloseTo((a[0] + b[0]) / 2, 2);
  });

  test("never flashes: light changes smoothly all the way through", () => {
    let prev = lightingAt(0);
    for (let s = 0.01; s <= 9; s += 0.01) {
      const next = lightingAt(s);
      for (const [x, y] of [
        [prev.sky, next.sky],
        [prev.sun.color, next.sun.color],
        [prev.ambient.sky, next.ambient.sky],
        [prev.ambient.ground, next.ambient.ground],
      ]) {
        rgb(x).forEach((v, i) => expect(Math.abs(v - rgb(y)[i])).toBeLessThanOrEqual(0.03));
      }
      expect(Math.abs(prev.sun.intensity - next.sun.intensity)).toBeLessThanOrEqual(0.05);
      prev = next;
    }
  });
});
