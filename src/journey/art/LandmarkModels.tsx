"use client";

import { Suspense, useMemo, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useScreens } from "../progress";
import { Quiet } from "../scene/Quiet";
import { LANDMARKS, landmarkPosition, type Landmark, type LandmarkId } from "./landmarks";
import { landmarksToLoad } from "./loading";

function Model({ landmark }: { landmark: Landmark }) {
  const { scene } = useGLTF(landmark.url);
  const object = useMemo(() => scene.clone(), [scene]);
  const { position, heading } = landmarkPosition(landmark);
  return (
    <group name={landmark.id} position={position} rotation={[0, heading, 0]}>
      <primitive object={object} />
    </group>
  );
}

/** Landmarks of the current and next city; each loads (and may fail) on its own, and stays once loaded. */
export function Landmarks() {
  const s = useScreens();
  const [loaded, setLoaded] = useState<Set<LandmarkId>>(() => new Set(landmarksToLoad(s)));

  // Adjusting state during render (React's documented pattern): add newly needed landmarks, never drop any.
  const wanted = landmarksToLoad(s);
  if (wanted.some((id) => !loaded.has(id))) setLoaded(new Set([...loaded, ...wanted]));

  return (
    <group>
      {LANDMARKS.filter((l) => loaded.has(l.id)).map((l) => (
        <Quiet key={l.id}>
          <Suspense fallback={null}>
            <Model landmark={l} />
          </Suspense>
        </Quiet>
      ))}
    </group>
  );
}
