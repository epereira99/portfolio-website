import { describe, expect, test } from "vitest";
import { MeshStandardMaterial } from "three";
import { buildCityGeometry } from "./buildCity";
import { FADE_FULL, FADE_START, applyApproachFade, fadeAhead } from "./fade";
import { cityLayout } from "./layout";

describe("fadeAhead", () => {
  test("hidden far ahead, fading in as you approach, fully there up close", () => {
    expect(FADE_FULL).toBe(22);
    expect(FADE_START).toBe(45);
    expect(fadeAhead(100, 100)).toBe(1);
    expect(fadeAhead(122, 100)).toBe(1);
    expect(fadeAhead(145, 100)).toBe(0);
    expect(fadeAhead(200, 100)).toBe(0);
    const mid = fadeAhead(133.5, 100);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  test("what you have passed stays", () => {
    expect(fadeAhead(50, 100)).toBe(1);
  });
});

test("every city vertex knows how far along the path its object stands", () => {
  const g = buildCityGeometry(cityLayout("porto"), "porto");
  const along = g.getAttribute("aAlong");
  expect(along.count).toBe(g.getAttribute("position").count);
  for (let i = 0; i < along.count; i += 97) {
    expect(along.getX(i)).toBeGreaterThanOrEqual(60 - 10);
    expect(along.getX(i)).toBeLessThanOrEqual(140 + 10);
  }
});

test("applyApproachFade adds the walker's position and a dithered discard to the shader", () => {
  const m = new MeshStandardMaterial();
  applyApproachFade(m, { alongAttribute: true });
  expect(m.onBeforeCompile).toBeTypeOf("function");
  const shader = {
    uniforms: {} as Record<string, { value: unknown }>,
    vertexShader: "#include <common>\n#include <begin_vertex>",
    fragmentShader: "#include <common>\n#include <dithering_fragment>",
  };
  m.onBeforeCompile(shader as never, undefined as never);
  expect(shader.uniforms.uAvatarAlong).toBeDefined();
  expect(shader.vertexShader).toContain("aAlong");
  expect(shader.fragmentShader).toContain("discard");
});
