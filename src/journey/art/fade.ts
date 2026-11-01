import { MeshDepthMaterial, RGBADepthPacking, type Material, type WebGLProgramParametersWithUniforms } from "three";

// Buildings ahead fade in as you approach (Eduardo, spec §7).
export const FADE_FULL = 22; // fully visible within 22 path units ahead
export const FADE_START = 45; // invisible beyond 45 units ahead

/** 1 = fully visible, 0 = hidden. Anything at or behind the walker stays visible. */
export function fadeAhead(along: number, avatarAlong: number): number {
  const t = Math.min(Math.max((along - avatarAlong - FADE_FULL) / (FADE_START - FADE_FULL), 0), 1);
  return 1 - t * t * (3 - 2 * t);
}

/** Shared uniform: the walker's path distance, updated every frame by <CityArt/>. */
export const APPROACH = { value: 0 };

/**
 * Dithered (screen-door) fade so everything stays opaque: no transparency sorting.
 * Use `alongAttribute` for merged geometry carrying a per-vertex `aAlong`, or a fixed `along` for one object.
 */
export function applyApproachFade(material: Material, opts: { alongAttribute: true } | { along: number }): void {
  const fixed = "along" in opts ? opts.along : null;
  material.customProgramCacheKey = () => (fixed === null ? "approach-attr" : `approach-${fixed}`);
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uAvatarAlong = APPROACH;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\nvarying float vAlong;\n${fixed === null ? "attribute float aAlong;" : ""}`,
      )
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvAlong = ${fixed === null ? "aAlong" : fixed.toFixed(3)};`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vAlong;\nuniform float uAvatarAlong;")
      .replace(
        "#include <clipping_planes_fragment>", // present in both the colour and the shadow (depth) shaders
        `#include <clipping_planes_fragment>
        float fadeT = clamp((vAlong - uAvatarAlong - ${FADE_FULL.toFixed(1)}) / ${(FADE_START - FADE_FULL).toFixed(1)}, 0.0, 1.0);
        float fade = 1.0 - fadeT * fadeT * (3.0 - 2.0 * fadeT);
        ivec2 p = ivec2(mod(gl_FragCoord.xy, 4.0));
        int b = p.x + p.y * 4;
        float bayer = float(b == 0 ? 0 : b == 1 ? 8 : b == 2 ? 2 : b == 3 ? 10 : b == 4 ? 12 : b == 5 ? 4 : b == 6 ? 14 : b == 7 ? 6
          : b == 8 ? 3 : b == 9 ? 11 : b == 10 ? 1 : b == 11 ? 9 : b == 12 ? 15 : b == 13 ? 7 : b == 14 ? 13 : 5) / 16.0;
        if (fade <= bayer) discard;`,
      );
  };
}

/** Shadow-pass material with the same fade, so buildings that are still hidden cast no shadow. */
export function approachDepthMaterial(opts: { alongAttribute: true } | { along: number }): MeshDepthMaterial {
  const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  applyApproachFade(depth, opts);
  return depth;
}
