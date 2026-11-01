"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { unbuiltTiles } from "./unbuilt";

export function UnbuiltPath() {
  const tiles = useMemo(() => unbuiltTiles(), []);
  return (
    <group>
      {tiles.map((tile) => (
        <RoundedBox
          key={tile.along}
          args={[1.8, 0.05, 1.2]}
          radius={0.02}
          position={tile.position}
          rotation={[0, tile.heading, 0]}
        >
          <meshStandardMaterial color="#e8dcc4" transparent opacity={tile.opacity} depthWrite={false} />
        </RoundedBox>
      ))}
    </group>
  );
}
