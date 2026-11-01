"use client";

import { Suspense } from "react";
import { Quiet } from "./Quiet";
import { Canvas } from "@react-three/fiber";
import { Avatar } from "./Avatar";
import { CameraRig } from "./CameraRig";
import { Nau } from "./Nau";
import { WelcomeBanner } from "./WelcomeBanner";
import { UnbuiltPath } from "./UnbuiltPath";
import { CityLighting } from "../art/CityLighting";
import { CityArt } from "../art/CityArt";
import { Ground } from "../art/Ground";
import { LandmarkModels } from "../art/LandmarkModels";
import { WaterSurface } from "../art/WaterSurface";
import { DebugStats } from "../art/DebugStats";

export function JourneyCanvas() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <Quiet>
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, position: [0, 3, 6] }}>
          <CityLighting />
          <Ground />
          <WaterSurface />
          <CityArt />
          <LandmarkModels />
          <WelcomeBanner />
          <UnbuiltPath />
          <Suspense fallback={null}>
            <Avatar />
            <Nau />
          </Suspense>
          <CameraRig />
          <DebugStats />
        </Canvas>
      </Quiet>
    </div>
  );
}
