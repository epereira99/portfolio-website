"use client";

import { useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { BANNER_DISTANCE, WELCOME_BANNER } from "@/content/voyage";
import { pathPoint, pathTangent } from "../path";
import { headingAt } from "../voyage/poses";

const WIDTH = 6.4;
const HEIGHT = 1.2;
const CLOTH_Y = 3.2;

// Drawn with the 2D canvas API: no font download.
function bannerTexture(text: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 240;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f3e9d2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#8f2a1f";
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
  ctx.fillStyle = "#8f2a1f";
  ctx.font = "italic bold 84px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4, canvas.width - 80);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function WelcomeBanner() {
  const texture = useMemo(() => bannerTexture(WELCOME_BANNER), []);
  const [x, , z] = pathPoint(BANNER_DISTANCE);
  const [tx, , tz] = pathTangent(BANNER_DISTANCE);
  const len = Math.hypot(tx, tz);
  const [nx, nz] = [-tz / len, tx / len];
  const half = WIDTH / 2;

  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[x + side * nx * half, CLOTH_Y / 2 + 0.6, z + side * nz * half]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, CLOTH_Y + 1.2, 10]} />
          <meshStandardMaterial color="#5a3d22" />
        </mesh>
      ))}
      {/* faces back toward the arriving walker */}
      <mesh position={[x, CLOTH_Y, z]} rotation={[0, headingAt(BANNER_DISTANCE) + Math.PI, 0]}>
        <planeGeometry args={[WIDTH, HEIGHT]} />
        <meshStandardMaterial map={texture} side={2} roughness={0.9} />
      </mesh>
    </group>
  );
}
