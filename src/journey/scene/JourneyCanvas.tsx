"use client";

import { Suspense } from "react";
import { Quiet } from "./Quiet";
import { Canvas } from "@react-three/fiber";
import { Avatar } from "./Avatar";
import { CameraRig } from "./CameraRig";
import { StandInCities } from "./StandInCities";
import { Nau } from "./Nau";
import { WelcomeBanner } from "./WelcomeBanner";
import { UnbuiltPath } from "./UnbuiltPath";
import { CityLighting } from "../art/CityLighting";

export function JourneyCanvas() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <Quiet>
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, position: [0, 3, 6] }}>
          <CityLighting />
          <StandInCities />
          <WelcomeBanner />
          <UnbuiltPath />
          <Suspense fallback={null}>
            <Avatar />
            <Nau />
          </Suspense>
          <CameraRig />
        </Canvas>
      </Quiet>
    </div>
  );
}
