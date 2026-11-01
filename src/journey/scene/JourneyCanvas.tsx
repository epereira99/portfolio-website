"use client";

import { Component, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Avatar } from "./Avatar";
import { CameraRig } from "./CameraRig";
import { StandInCities } from "./StandInCities";
import { Nau } from "./Nau";
import { WelcomeBanner } from "./WelcomeBanner";

// No WebGL or a failed asset must never take the page down: the UI layers still work.
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function JourneyCanvas() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0 }}>
      <Quiet>
        <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, position: [0, 3, 6] }}>
          <color attach="background" args={["#f6d7a7"]} />
          <fog attach="fog" args={["#f6d7a7", 25, 90]} />
          <hemisphereLight args={["#fff8ee", "#b7a88a", 0.9]} />
          <directionalLight position={[20, 30, 10]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} />
          <StandInCities />
          <WelcomeBanner />
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
