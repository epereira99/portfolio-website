"use client";

import { useMemo, useState } from "react";
import { Shape, ShapeGeometry, Vector2, type WebGLProgramParametersWithUniforms } from "three";
import { useFrame } from "@react-three/fiber";
import type { SegmentId } from "../timeline";
import { CITY_STYLE } from "./styles";
import { nextWaterTime, waterShapes } from "./water";

const IDS: SegmentId[] = ["porto", "voyage", "jonkoping", "stockholm"];

/** Soft moving highlight bands on top of the base colour. */
function patch(time: { value: number }) {
  return (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWPos = (modelMatrix * vec4(position, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nuniform float uTime;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float wave = sin(vWPos.x * 0.35 + uTime * 0.6) * sin(vWPos.z * 0.27 - uTime * 0.45);
        diffuseColor.rgb += 0.06 * smoothstep(0.55, 1.0, wave);`,
      );
  };
}

export function WaterSurface() {
  const [time] = useState(() => ({ value: 0 }));
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const meshes = useMemo(
    () =>
      IDS.flatMap((id) =>
        waterShapes(id).map((shape) => {
          // Shape lives in the xy plane: map (x, z) → (x, −z), then lay it flat.
          const geometry = new ShapeGeometry(new Shape(shape.points.map(([x, z]) => new Vector2(x, -z)))).rotateX(-Math.PI / 2);
          return { id, geometry };
        }),
      ),
    [],
  );
  const onBeforeCompile = useMemo(() => patch(time), [time]);

  useFrame((_, dt) => {
    // the shader uniform is mutated every frame by design (R3F pattern)
    // eslint-disable-next-line react-hooks/immutability
    time.value = nextWaterTime(time.value, dt, reduced);
  });

  return (
    <group position={[0, 0.03, 0]}>
      {meshes.map(({ id, geometry }, i) => (
        <mesh key={i} geometry={geometry} receiveShadow>
          <meshStandardMaterial color={CITY_STYLE[id].waterColor} roughness={0.25} onBeforeCompile={onBeforeCompile} />
        </mesh>
      ))}
    </group>
  );
}
