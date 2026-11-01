"use client";

import { useFrame } from "@react-three/fiber";

type Stats = { frame: number; calls: number; triangles: number };

function Stats() {
  useFrame(({ gl }) => {
    const w = window as unknown as { __journeyStats?: Stats };
    const frame = (w.__journeyStats?.frame ?? 0) + 1;
    w.__journeyStats = { frame, calls: gl.info.render.calls, triangles: gl.info.render.triangles };
  });
  return null;
}

/** Dev/test only: exposes renderer stats for the performance budget e2e. Compiled out of production. */
export function DebugStats() {
  return process.env.NODE_ENV === "production" ? null : <Stats />;
}
