"use client";

import { ScrollDriver } from "@/journey/ScrollDriver";
import { DioramaWalk } from "@/journey/diorama/DioramaWalk";
import { CampScreen } from "@/about/Campfire";
import { useCamp } from "@/about/camp";
import { JourneyOverlay } from "@/ui/JourneyOverlay";
import { BottomBar } from "@/ui/BottomBar";
import { ProjectDialog } from "@/ui/ProjectDialog";

export default function Home() {
  const camp = useCamp(); // About me: the camp by the road, in the same world
  return (
    <>
      <ScrollDriver />
      <DioramaWalk />
      <main>
        {!camp && <JourneyOverlay />}
        <CampScreen />
      </main>
      {!camp && <BottomBar />}
      <ProjectDialog />
    </>
  );
}
